import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  // Identity
  KxcoIdentity, AuditLog, PqHsm, MemoryBackend, AuditedHsm,
  // Attestation
  attest, verify,
  // Primitives
  mlDsa, mlKem, fingerprint,
  // TLS
  wrapStream, initiatorHandshake, responderHandshake,
  // Vault
  encryptPayload, decryptPayload, generateDek, generateNonce,
  // Webhook
  createSigner, createVerifier,
} from '../src/index.js'

test('all top-level exports are defined', () => {
  assert.equal(typeof KxcoIdentity, 'function')
  assert.equal(typeof AuditedHsm, 'function')
  assert.equal(typeof AuditLog, 'function')
  assert.equal(typeof PqHsm, 'function')
  assert.equal(typeof MemoryBackend, 'function')
  assert.equal(typeof attest, 'function')
  assert.equal(typeof verify, 'function')
  assert.equal(typeof mlDsa, 'object')
  assert.equal(typeof mlKem, 'object')
  assert.equal(typeof fingerprint, 'function')
  assert.equal(typeof wrapStream, 'function')
  assert.equal(typeof initiatorHandshake, 'function')
  assert.equal(typeof responderHandshake, 'function')
  assert.equal(typeof encryptPayload, 'function')
  assert.equal(typeof decryptPayload, 'function')
  assert.equal(typeof generateDek, 'function')
  assert.equal(typeof createSigner, 'function')
  assert.equal(typeof createVerifier, 'function')
})

test('identity: create institution + issue + attest + verifyChain', async () => {
  const instKp = mlDsa.ml_dsa65.keygen()
  const userKp = mlDsa.ml_dsa65.keygen()

  const inst   = await KxcoIdentity.create({ keypair: instKp })
  const cred   = await inst.issue(userKp.publicKey, { role: 'verified-user', authority: ['sign:all'] })
  const user   = KxcoIdentity.fromCredential({ keypair: userKp, credential: cred })
  const env    = await user.attest('full stack test')

  const result = KxcoIdentity.verifyChain({
    envelope: env,
    credential: cred,
    institutionPublicKey: instKp.publicKey,
  })
  assert.equal(result.valid, true)
  assert.equal(result.role, 'verified-user')
})

test('vault: encrypt and decrypt a payload round-trips correctly', () => {
  const dek       = generateDek()    // 32-byte AES-256 key
  const nonce     = generateNonce()  // 12-byte GCM nonce
  const ad        = Buffer.from('kxco-pq-smoke-test')
  const plaintext = Buffer.from('quantum-safe secret')

  const ct = encryptPayload(dek, nonce, ad, plaintext)
  const pt = decryptPayload(dek, nonce, ad, ct)

  assert.deepEqual(new Uint8Array(pt), new Uint8Array(plaintext))
})

test('webhook: createSigner + createVerifier round-trip', () => {
  const kp     = mlDsa.ml_dsa65.keygen()
  const kid    = fingerprint(kp.publicKey)
  const secret = 'hmac-shared-secret'
  const body   = JSON.stringify({ event: 'kyc.approved', applicantId: 'abc123' })

  const signer   = createSigner({ hmacSecret: secret, pqSecretKey: kp.secretKey, pqKid: kid })
  const verifier = createVerifier({ hmacSecret: secret, pqPublicKey: kp.publicKey, pinnedKid: kid, required: 'both' })

  const headers = signer.sign(body)
  const result  = verifier.verify(headers, body)

  assert.equal(result.ok, true)
  assert.equal(result.hmacOk, true)
  assert.equal(result.pqOk, true)
})

// A meta package at 2.0.0 that did not expose the modes would be a meta package
// hiding the thing the major version is about.
test('the verification modes and seed-form surface are re-exported', async () => {
  const m = await import('../src/index.js')
  for (const name of [
    'verifyAsync', 'generateClassicalKeypair', 'CLASSICAL_ALGORITHMS',
    'networkConfig', 'networkConfigFromEnv', 'applyVerifyMode', 'readAnchor',
    'KeyRegistry', 'KxcoPqNetworkError', 'FAILURE', 'VERIFY_MODES', 'CHAIN_ID',
    'meter', 'usageEvent', 'seed', 'jws', 'backend',
  ]) {
    assert.notEqual(m[name], undefined, `${name} must be exported`)
  }
  assert.equal(m.CHAIN_ID, 1111111)
  assert.deepEqual(m.VERIFY_MODES, ['signature', 'anchored', 'anchored+live'])
})

// The Category 5 sets come through the meta package as the wrapper's own
// modules, and sign, verify and encapsulate at their own sizes.
test('ML-DSA-87 and ML-KEM-1024 are re-exported from kxco-post-quantum', async () => {
  const m = await import('../src/index.js')
  const pq = await import('kxco-post-quantum')
  assert.equal(m.mlDsa87, pq.mlDsa87)
  assert.equal(m.mlKem1024, pq.mlKem1024)

  const master = Buffer.alloc(32, 5)
  const dsa = m.mlDsa87.keypairFromMaster(master)
  assert.equal(dsa.publicKey.length, 2592)
  assert.equal(dsa.secretKey.length, 4896)
  const sig = m.mlDsa87.sign(dsa.secretKey, 'category five')
  assert.equal(sig.length, 4627 * 2)
  assert.equal(m.mlDsa87.verify(dsa.publicKey, 'category five', sig), true)
  // A key of the other set does not verify it.
  assert.equal(m.mlDsa.verify(m.mlDsa.keypairFromMaster(master).publicKey, 'category five', sig), false)

  const kem = m.mlKem1024.keypairFromMaster(master)
  assert.equal(kem.publicKey.length, 1568)
  const { ciphertext, sharedSecret } = m.mlKem1024.encapsulate(kem.publicKey)
  assert.equal(ciphertext.length, 1568)
  assert.deepEqual(m.mlKem1024.decapsulate(ciphertext, kem.secretKey), sharedSecret)
})

// The three modes, end to end through the meta package: a signature-mode
// envelope verifies offline, and the same envelope fails anchored because it
// carries no anchor.
test('signature mode verifies offline; anchored refuses an unanchored envelope', async () => {
  const m = await import('../src/index.js')
  const keypair = m.mlDsa.ml_dsa65.keygen()
  const envelope = await m.attest('through the meta package', keypair)

  assert.equal(m.verify(envelope, keypair.publicKey).valid, true)

  const anchored = m.verify(envelope, keypair.publicKey, { mode: 'anchored' })
  assert.equal(anchored.valid, false)
  assert.equal(anchored.reason, m.FAILURE.NOT_ANCHORED)
})
