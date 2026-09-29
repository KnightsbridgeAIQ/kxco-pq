// Property-based tests with fast-check.
//
// stack.test.js proves each part of the family is exported and works once.
// These ask the general question through the same single import: for ANY
// payload, key, body or recipient set, does attestation verify offline, does
// the vault give back exactly what it sealed and refuse anything altered, does
// a signed webhook verify under every policy and fail under all of them once
// changed, and does an identity credential verify through the whole chain?
// fast-check generates the inputs and, when a property breaks, shrinks the
// failing case to the smallest one that still breaks it.
//
// No network. Nothing here takes a chain client, a registry or a relay, and
// verifyAsync is only asked for modes decided from the envelope alone.
//
// Runs on whichever backend kxco-post-quantum reports.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fc from 'fast-check'
import {
  attest, verify, verifyAsync, FAILURE, mlDsa, mlKem, fingerprint,
  encryptPayload, decryptPayload, generateDek, generateNonce, computeKid, wrapDek, unwrapDek,
  serializeHeader, parseEnvelope, parseHeaderText, encodePublicKey, decodePublicKey, KxcoVaultError,
  createSigner, createVerifier,
  KxcoIdentity,
} from '../src/index.js'

// Anything that signs runs a modest number of cases; pure parsing runs more.
const RUNS = { numRuns: 25 }

const signer = mlDsa.ml_dsa65.keygen()
const other = mlDsa.ml_dsa65.keygen()

const enc = new TextEncoder()
const same = (a, b) => Buffer.from(a).equals(Buffer.from(b))
const flip = (bytes, at) => {
  const out = Buffer.from(bytes)
  out[at % out.length] ^= 0x01
  return out
}
const flipB64 = (s, at) => flip(Buffer.from(s, 'base64url'), at).toString('base64url')

const payload = fc.oneof(
  fc.string({ minLength: 1, maxLength: 200 }),
  fc.string({ unit: 'grapheme', minLength: 1, maxLength: 60 }),
  fc.uint8Array({ minLength: 1, maxLength: 512 }),
)
const bytesOf = (p) => (typeof p === 'string' ? enc.encode(p) : new Uint8Array(p))

async function throwsVaultError(fn) {
  try {
    await fn()
    return false
  } catch (err) {
    return err instanceof KxcoVaultError
  }
}

test('the harness fails a property that is false', () => {
  assert.throws(() => fc.assert(fc.property(fc.integer(), (n) => n + 1 === n), { numRuns: 10 }))
})

// ── attestation ─────────────────────────────────────────────────────────────

test('attest: any payload verifies offline, synchronously and through verifyAsync, and any signed field changed fails', async () => {
  const edit = fc.oneof(
    fc.nat().map((at) => ['payload', (e) => flipB64(e.payload, at)]),
    fc.nat().map((at) => ['sig', (e) => flipB64(e.sig, at)]),
    fc.stringMatching(/^[0-9a-f]{16}$/).map((k) => ['kid', () => k]),
    fc.integer({ min: 1, max: 1e9 }).map((ms) => ['issuedAt', (e) => new Date(Date.parse(e.issuedAt) + ms).toISOString()]),
    fc.constantFrom('anchored', '', 'anchored+live').map((h) => ['verifyModeHint', () => h]),
  )
  await fc.assert(fc.asyncProperty(payload, edit, async (p, [field, change]) => {
    const env = await attest(p, signer)
    const r = verify(env, signer.publicKey)
    const offline = await verifyAsync(env, signer.publicKey)
    const anchored = await verifyAsync(env, signer.publicKey, { mode: 'anchored' })
    const tampered = { ...env, [field]: change(env) }
    return r.valid === true &&
      same(r.payload, bytesOf(p)) &&
      r.signerKid === fingerprint(signer.publicKey) &&
      offline.valid === true &&
      anchored.valid === false && anchored.reason === FAILURE.NOT_ANCHORED &&
      verify(env, other.publicKey).valid === false &&
      verify(tampered, signer.publicKey).valid === false
  }), RUNS)
})

// ── vault ───────────────────────────────────────────────────────────────────

const key32 = fc.uint8Array({ minLength: 32, maxLength: 32 }).map((b) => Buffer.from(b))
const nonce12 = fc.uint8Array({ minLength: 12, maxLength: 12 }).map((b) => Buffer.from(b))
const bytes = (max) => fc.uint8Array({ maxLength: max }).map((b) => Buffer.from(b))

test('vault: encryptPayload then decryptPayload returns the plaintext for any key, nonce, associated data and plaintext', () => {
  fc.assert(fc.property(key32, nonce12, bytes(64), bytes(2048), (dek, nonce, ad, plaintext) => {
    const sealed = encryptPayload(dek, nonce, ad, plaintext)
    return sealed.length === plaintext.length + 16 && same(decryptPayload(dek, nonce, ad, sealed), plaintext)
  }), { numRuns: 300 })
})

test('vault: changing any byte of the ciphertext, the tag or the associated data is refused with KxcoVaultError', async () => {
  await fc.assert(fc.asyncProperty(key32, nonce12, bytes(64), bytes(512), fc.nat(), fc.boolean(), async (dek, nonce, ad, plaintext, at, inAd) => {
    fc.pre(!inAd || ad.length > 0)
    const sealed = encryptPayload(dek, nonce, ad, plaintext)
    return inAd
      ? throwsVaultError(() => decryptPayload(dek, nonce, flip(ad, at), sealed))
      : throwsVaultError(() => decryptPayload(dek, nonce, ad, flip(sealed, at)))
  }), { numRuns: 300 })
})

test('vault: decryptPayload fails closed on arbitrary bytes, always with KxcoVaultError', async () => {
  await fc.assert(fc.asyncProperty(key32, nonce12, bytes(64), bytes(600), async (dek, nonce, ad, junk) => {
    return throwsVaultError(() => decryptPayload(dek, nonce, ad, junk))
  }), { numRuns: 300 })
})

// The envelope is built exactly as the kxco-vault CLI builds it: an ML-KEM-768
// encapsulation per recipient wrapping one data key, and the header text as
// the associated data for the payload.
test('vault: an envelope sealed to any set of recipients opens for each of them, for nobody else, and not once its header changes', async () => {
  const pool = [0, 1, 2, 3].map(() => mlKem.ml_kem768.keygen())
  const SEPARATOR = Buffer.from('--- BEGIN CIPHERTEXT ---\n', 'utf-8')

  await fc.assert(fc.asyncProperty(fc.shuffledSubarray([0, 1, 2, 3], { minLength: 1, maxLength: 3 }), bytes(1024), async (picked, plaintext) => {
    const dek = generateDek()
    const nonce = generateNonce()
    const created = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
    const recipients = picked.map((i) => {
      const kid = computeKid(pool[i].publicKey)
      const { ciphertext, sharedSecret } = mlKem.encapsulate(pool[i].publicKey)
      return {
        kid,
        encapsulatedKey: Buffer.from(ciphertext).toString('hex'),
        wrappedDek: wrapDek(Buffer.from(sharedSecret), kid, dek).toString('hex'),
      }
    })
    const headerText = serializeHeader({ recipients, nonce: nonce.toString('hex'), created })
    const header = Buffer.from(headerText, 'utf-8')
    const file = Buffer.concat([header, SEPARATOR, encryptPayload(dek, nonce, header, plaintext)])

    const parsed = parseEnvelope(file)
    const open = (i) => {
      const kid = computeKid(pool[i].publicKey)
      const block = parsed.header.recipients.find((r) => r.kid === kid) ?? parsed.header.recipients[0]
      const ss = Buffer.from(mlKem.decapsulate(Buffer.from(block.encapsulatedKey, 'hex'), pool[i].secretKey))
      const key = unwrapDek(ss, block.kid, Buffer.from(block.wrappedDek, 'hex'))
      return decryptPayload(key, Buffer.from(parsed.header.nonce, 'hex'), parsed.canonicalHeader, parsed.ciphertext)
    }
    const outsider = [0, 1, 2, 3].find((i) => !picked.includes(i))

    // A different creation time, which parses cleanly but is not the header that was sealed.
    const altered = parseEnvelope(Buffer.from(file.toString('latin1').replace(`created: ${created}`, 'created: 1999-01-01T00:00:00Z'), 'latin1'))

    return same(parsed.canonicalHeader, header) &&
      JSON.stringify(parsed.header) === JSON.stringify({ algorithm: 'ml-kem-768+aes-256-gcm', recipients, nonce: nonce.toString('hex'), created }) &&
      picked.every((i) => same(open(i), plaintext)) &&
      await throwsVaultError(() => open(outsider)) &&
      await throwsVaultError(() => decryptPayload(dek, nonce, altered.canonicalHeader, altered.ciphertext))
  }), RUNS)
})

test('vault: the header and envelope parsers fail closed on arbitrary input, with KxcoVaultError or a parsed header', () => {
  const line = fc.oneof(
    fc.constant('KXCO-VAULT/1.0'),
    fc.constant('algorithm: ml-kem-768+aes-256-gcm'),
    fc.constantFrom('recipients: 1', 'recipients: 2', 'recipients: 0', 'recipients: x'),
    fc.stringMatching(/^recipient\[[0-2]\]\.(kid|encapsulated_key|wrapped_dek): [0-9a-f]{0,8}$/),
    fc.constantFrom('nonce: 00', 'created: 2026-01-01T00:00:00Z'),
    fc.string({ unit: 'binary', maxLength: 40 }),
  )
  const text = fc.oneof(fc.string({ unit: 'binary', maxLength: 400 }), fc.array(line, { maxLength: 12 }).map((ls) => ls.join('\n')))
  const envelope = fc.oneof(
    fc.uint8Array({ maxLength: 600 }).map((b) => Buffer.from(b)),
    fc.tuple(text, fc.uint8Array({ maxLength: 64 })).map(([t, ct]) => Buffer.concat([Buffer.from(t), Buffer.from('--- BEGIN CIPHERTEXT ---\n'), Buffer.from(ct)])),
  )
  const failsClosed = (fn) => {
    try {
      const h = fn()
      return typeof h === 'object' && h !== null
    } catch (err) {
      return err instanceof KxcoVaultError
    }
  }
  fc.assert(fc.property(text, envelope, (t, e) => failsClosed(() => parseHeaderText(t)) && failsClosed(() => parseEnvelope(e))), { numRuns: 500 })
})

test('vault: recipient strings round-trip any ML-KEM-768 public key; other lengths and any one character changed are refused with KxcoVaultError', async () => {
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
  await fc.assert(fc.asyncProperty(
    fc.uint8Array({ minLength: 1184, maxLength: 1184 }),
    fc.uint8Array({ maxLength: 1300 }).filter((b) => b.length !== 1184),
    fc.nat(), fc.nat({ max: 31 }),
    async (pk, wrongLength, at, c) => {
      const s = encodePublicKey(pk)
      const i = 5 + (at % (s.length - 5))
      const corrupted = s.slice(0, i) + (CHARSET[c] === s[i] ? CHARSET[(c + 1) % 32] : CHARSET[c]) + s.slice(i + 1)
      return s.startsWith('kxco1') &&
        same(decodePublicKey(s), pk) &&
        await throwsVaultError(() => decodePublicKey(encodePublicKey(wrongLength))) &&
        await throwsVaultError(() => decodePublicKey(corrupted))
    }), { numRuns: 100 })
})

// ── webhook ─────────────────────────────────────────────────────────────────

const POLICIES = ['hmac', 'pq', 'both', 'either']
const KID = fingerprint(signer.publicKey)

function verifiers(secret) {
  return {
    hmac: createVerifier({ hmacSecret: secret, required: 'hmac' }),
    pq: createVerifier({ pqPublicKey: signer.publicKey, pinnedKid: KID, required: 'pq' }),
    both: createVerifier({ hmacSecret: secret, pqPublicKey: signer.publicKey, pinnedKid: KID, required: 'both' }),
    either: createVerifier({ hmacSecret: secret, pqPublicKey: signer.publicKey, pinnedKid: KID, required: 'either' }),
  }
}

const secret = fc.string({ minLength: 1, maxLength: 64 })
const body = fc.oneof(fc.string({ maxLength: 300 }), fc.uint8Array({ maxLength: 300 }).map((b) => Buffer.from(b)))

test('webhook: any body signed with HMAC and ML-DSA-65 verifies under every policy, and changed by one byte, under none', async () => {
  await fc.assert(fc.asyncProperty(secret, body, fc.nat(), fc.stringMatching(/^[0-9a-f]{16}$/), async (s, b, at, otherKid) => {
    fc.pre(otherKid !== KID)
    const headers = createSigner({ hmacSecret: s, pqSecretKey: signer.secretKey, pqKid: KID }).sign(b)
    const v = verifiers(s)
    const bytes = typeof b === 'string' ? Buffer.from(b) : b
    const changed = bytes.length === 0 ? Buffer.from([0]) : flip(bytes, at)
    const wrongKid = v.pq.verify({ ...headers, 'X-KXCO-PQ-Kid': otherKid }, b)
    return POLICIES.every((p) => v[p].verify(headers, b).ok === true) &&
      POLICIES.every((p) => v[p].verify(headers, changed).ok === false) &&
      v.both.verify(headers, changed).reason === 'hmac_invalid' &&
      v.pq.verify(headers, changed).reason === 'pq_invalid' &&
      wrongKid.ok === false && wrongKid.reason === 'kid_mismatch'
  }), RUNS)
})

test('webhook: arbitrary signature headers on a fresh timestamp never verify, under any policy', async () => {
  const hex = (min, max) => fc.uint8Array({ minLength: min, maxLength: max }).map((x) => Buffer.from(x).toString('hex'))
  const hmacHeader = fc.oneof(hex(32, 32).map((h) => 'sha256=' + h), fc.string({ maxLength: 80 }))
  const pqHeader = fc.oneof(hex(3309, 3309).map((h) => 'ml-dsa-65=' + h), hex(0, 200).map((h) => 'ml-dsa-65=' + h), fc.string({ maxLength: 80 }))
  await fc.assert(fc.asyncProperty(secret, body, hmacHeader, pqHeader, async (s, b, sigHmac, sigPq) => {
    const v = verifiers(s)
    const headers = {
      'X-KXCO-Timestamp': Math.floor(Date.now() / 1000).toString(),
      'X-KXCO-Signature': sigHmac,
      'X-KXCO-PQ-Signature': sigPq,
      'X-KXCO-PQ-Kid': KID,
    }
    return POLICIES.every((p) => v[p].verify(headers, b).ok === false)
  }), { numRuns: 60 })
})

// ── identity ────────────────────────────────────────────────────────────────

test('identity: a credential issued for any role, authority and metadata verifies offline through the chain, and any one signed field changed fails', async () => {
  const institutionKeys = mlDsa.ml_dsa65.keygen()
  const userKeys = mlDsa.ml_dsa65.keygen()
  const institution = await KxcoIdentity.create({ keypair: institutionKeys })

  const role = fc.string({ minLength: 1, maxLength: 30 })
  const authority = fc.array(fc.string({ maxLength: 20 }), { maxLength: 4 })
  const meta = fc.dictionary(fc.string({ maxLength: 10 }), fc.jsonValue({ maxDepth: 1 }), { maxKeys: 3 })
  const data = fc.oneof(payload, fc.dictionary(fc.string({ maxLength: 10 }), fc.string({ maxLength: 20 }), { maxKeys: 3 }))
  const iso = fc.integer({ min: 1, max: 1e9 }).map((ms) => (t) => new Date(Date.parse(t) + ms).toISOString())
  const tamper = fc.oneof(
    fc.string({ maxLength: 5 }).map((s) => ['credential', 'role', (c) => c.role + 'x' + s]),
    fc.string({ maxLength: 10 }).map((s) => ['credential', 'authority', (c) => [...c.authority, s]]),
    fc.jsonValue({ maxDepth: 1 }).map((v) => ['credential', 'metadata', (c) => ({ ...c.metadata, k_tampered: v })]),
    iso.map((f) => ['credential', 'issuedAt', (c) => f(c.issuedAt)]),
    fc.constant(['credential', 'expiresAt', () => '2999-01-01T00:00:00.000Z']),
    fc.nat().map((at) => ['credential', 'userPublicKey', (c) => flipB64(c.userPublicKey, at)]),
    fc.nat().map((at) => ['credential', 'signature', (c) => flipB64(c.signature, at)]),
    fc.nat().map((at) => ['envelope', 'payload', (e) => flipB64(e.payload, at)]),
    fc.nat().map((at) => ['envelope', 'signature', (e) => flipB64(e.signature, at)]),
    iso.map((f) => ['envelope', 'iat', (e) => f(e.iat)]),
  )

  await fc.assert(fc.asyncProperty(role, authority, meta, data, tamper, async (r, a, m, d, [target, field, change]) => {
    const credential = await institution.issue(userKeys.publicKey, { role: r, authority: a, metadata: m })
    const user = KxcoIdentity.fromCredential({ keypair: userKeys, credential })
    const envelope = await user.attest(d)
    const expected = typeof d === 'string' || d instanceof Uint8Array ? bytesOf(d) : enc.encode(JSON.stringify(d))

    const ok = KxcoIdentity.verifyChain({ envelope, credential, institutionPublicKey: institutionKeys.publicKey })
    const wrongInstitution = KxcoIdentity.verifyChain({ envelope, credential, institutionPublicKey: other.publicKey })
    const broken = target === 'credential'
      ? KxcoIdentity.verifyChain({ envelope, credential: { ...credential, [field]: change(credential) }, institutionPublicKey: institutionKeys.publicKey })
      : KxcoIdentity.verifyChain({ envelope: { ...envelope, [field]: change(envelope) }, credential, institutionPublicKey: institutionKeys.publicKey })

    return ok.valid === true &&
      ok.role === r &&
      JSON.stringify(ok.authority) === JSON.stringify(a) &&
      JSON.stringify(ok.metadata) === JSON.stringify(m) &&
      ok.issuedBy === institution.kid &&
      same(ok.payload, expected) &&
      wrongInstitution.valid === false &&
      broken.valid === false
  }), { numRuns: 20 })
})
