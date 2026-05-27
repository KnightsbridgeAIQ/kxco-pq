# kxco-pq

[![npm](https://img.shields.io/npm/v/kxco-pq.svg)](https://www.npmjs.com/package/kxco-pq)
[![Socket](https://socket.dev/api/badge/npm/package/kxco-pq)](https://socket.dev/npm/package/kxco-pq)
[![node](https://img.shields.io/node/v/kxco-pq.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

The full KXCO post-quantum stack in one install.

```sh
npm install kxco-pq
```

Everything from all KXCO PQC packages is re-exported from this single entry point — identity, HSM, audit logging, attestation, encrypted channels, file encryption, and webhook signing.

---

## What's included

| Module | Package | What it does |
|--------|---------|-------------|
| **Identity** | `kxco-pq-sdk` | ML-DSA-65 hierarchical credentials — institution issues signed user credentials after KYC. Chain verifiable offline. |
| **HSM** | `kxco-pq-hsm` | Encrypted key storage: in-memory, file (Argon2id + AES-256-GCM), or PKCS#11 hardware. |
| **Audit log** | `kxco-pq-audit` | Tamper-evident, hash-chained, ML-DSA-signed operation log. |
| **Attestation** | `kxco-pq-attest` | Sign arbitrary payloads — documents, trade confirmations, regulatory submissions. |
| **Channels** | `kxco-pq-tls` | Hybrid ML-KEM-768 + X25519 key exchange. AES-256-GCM data encryption. Wraps Node streams and WebSockets. |
| **Vault** | `kxco-pq-vault` | ML-KEM-768 envelope encryption for files. Multi-recipient. Resistant to harvest-now-decrypt-later. |
| **Webhooks** | `kxco-post-quantum-webhook` | HMAC-SHA-256 + ML-DSA-65 dual-signed webhook delivery and verification. Express / Fastify / Hono / Workers / Vercel adapters. |
| **Primitives** | `kxco-post-quantum` | Raw ML-DSA-65, ML-KEM-768, deterministic key derivation, fingerprinting. |

All built on [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) and [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) via the [audited @noble/post-quantum](https://github.com/paulmillr/noble-post-quantum) library (Cure53, 2024).

---

## Usage

### Identity — issue and verify a user credential

```js
import { KxcoIdentity, mlDsa } from 'kxco-pq'

// Institution: create once, store keypair securely
const institution = await KxcoIdentity.create()

// User: generate keypair (e.g. in browser after KYC)
const userKeypair = mlDsa.ml_dsa65.keygen()

// Institution: issue credential after KYC approval (e.g. Sumsub webhook)
const credential = await institution.issue(userKeypair.publicKey, {
  role:      'verified-user',
  authority: ['sign:transactions', 'access:chain'],
  metadata:  { sumsubApplicantId: 'applicant_42', country: 'GB' },
  expiresIn: '365d',
})

// User: activate their identity
const user = KxcoIdentity.fromCredential({ keypair: userKeypair, credential })

// User: sign a document or transaction
const envelope = await user.attest(
  { action: 'transfer', amount: 1000, currency: 'GBP' },
  { purpose: 'trade-confirmation' },
)

// Anyone: verify the full chain offline
const result = KxcoIdentity.verifyChain({
  envelope,
  credential,
  institutionPublicKey: await institution.getPublicKey(),
})
// result.valid === true
```

### Encrypted channel between two services

```js
import { initiatorHandshake, responderHandshake, wrapStream } from 'kxco-pq'
import net from 'node:net'

// Server side
const server = net.createServer(async (socket) => {
  const channel = await responderHandshake(socket, { identity: serverIdentity })
  const secure  = wrapStream(channel)
  secure.on('data', (msg) => console.log('received:', msg.toString()))
})

// Client side
const socket  = net.connect(port)
const channel = await initiatorHandshake(socket, { identity: clientIdentity, serverPublicKey })
const secure  = wrapStream(channel)
secure.write(Buffer.from('hello over post-quantum TLS'))
```

### Encrypt a file for multiple recipients

```js
import { generateDek, generateNonce, wrapDek, encryptPayload } from 'kxco-pq'
import { mlKem } from 'kxco-pq'

const dek       = generateDek()   // 32-byte AES-256 content key
const nonce     = generateNonce() // 12-byte GCM nonce
const plaintext = await fs.readFile('report.pdf')

// Encapsulate DEK for each recipient's ML-KEM public key
const { ciphertext, sharedSecret } = mlKem.ml_kem768.encapsulate(recipientPublicKey)
const wrappedDek = wrapDek(sharedSecret, recipientKid, dek)

const ciphertext = encryptPayload(dek, nonce, headerBytes, plaintext)
```

### Sign and verify a webhook delivery

```js
import { createSigner, createVerifier, fingerprint } from 'kxco-pq'

const signer = createSigner({
  hmacSecret: process.env.WEBHOOK_SECRET,
  pqSecretKey: signingKeypair.secretKey,
  pqKid: fingerprint(signingKeypair.publicKey),
})

// On delivery:
const headers = signer.sign(JSON.stringify(payload), { event: 'kyc.approved' })

// On receipt:
const verifier = createVerifier({
  hmacSecret: process.env.WEBHOOK_SECRET,
  pqPublicKey: signingKeypair.publicKey,
  pinnedKid: fingerprint(signingKeypair.publicKey),
  required: 'both',
})
const { ok, hmacOk, pqOk } = verifier.verify(incomingHeaders, rawBody)
```

---

## Install individual packages

`kxco-pq` is the full stack. If you only need part of it:

```sh
npm install kxco-pq-sdk        # identity + HSM + audit + attest
npm install kxco-pq-tls        # encrypted channels only
npm install kxco-pq-vault      # file encryption only
npm install kxco-post-quantum-webhook  # webhooks only
npm install kxco-post-quantum   # raw primitives only
```

---

## Security

Cryptography: **ML-DSA-65** (NIST FIPS 204) and **ML-KEM-768** (NIST FIPS 203) via [@noble/post-quantum](https://github.com/paulmillr/noble-post-quantum), independently audited by Cure53 in 2024. No custom cryptography.

To report a vulnerability: [security@kxco.ai](mailto:security@kxco.ai) — do not open a public issue.

Advisory feed: [github.com/JackKXCO/kxco-pq/security/advisories](https://github.com/JackKXCO/kxco-pq/security/advisories)

---

## Funding

Supported by [Knightsbridge](https://knightsbridgelaw.com) · Shayne Heffernan · John Heffernan

- [kxco.ai](https://kxco.ai) — KXCO platform
- [Armature L1](https://chain.kxco.ai) — post-quantum blockchain

---

## License

Apache-2.0 © 2026 KXCO by Knightsbridge
