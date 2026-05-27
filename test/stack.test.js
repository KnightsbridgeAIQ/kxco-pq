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
