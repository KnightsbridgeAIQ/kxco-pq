# kxco-pq

[![npm](https://img.shields.io/npm/v/kxco-pq.svg)](https://www.npmjs.com/package/kxco-pq)
[![Socket](https://socket.dev/api/badge/npm/package/kxco-pq)](https://socket.dev/npm/package/kxco-pq)
[![node](https://img.shields.io/node/v/kxco-pq.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

The complete KXCO post-quantum stack in one package.

```sh
npm install kxco-pq
```

Every export from all KXCO PQC packages is available from this single entry point. One install, one import source, no version juggling across sub-packages.

---

## When to use this

Use `kxco-pq` when you want the full stack without managing individual package versions. It is the right choice for new projects, backend services that touch identity and chain together, and integrations that span more than two sub-packages.

## When to use individual packages

Use the individual packages when you need only part of the stack and want minimal dependencies. If your service only verifies webhooks, install `kxco-post-quantum-webhook`. If it only encrypts files, install `kxco-pq-vault`. The à la carte options are listed at the bottom of this file.

---

## Install

```sh
npm install kxco-pq
```

Requires Node.js 20.19 or later.

---

## What's included

| Sub-package | Exports | Description |
|---|---|---|
| `kxco-pq-sdk` | `KxcoIdentity`, `AuditedHsm`, `PqHsm`, `MemoryBackend`, `FileBackend`, `Pkcs11Backend`, `AuditLog`, `FileAuditLog`, `attest`, `verify`, `mlDsa`, `mlKem`, `fingerprint`, `kidEquals`, `KxcoPqSdkError` | ML-DSA-65 hierarchical identity credentials, encrypted HSM key storage, tamper-evident audit log, and attestation signing |
| `kxco-pq-tls` | `wrapStream`, `wrapWebSocket`, `PqTlsWebSocket`, `initiatorHandshake`, `responderHandshake`, `KxcoPqTlsError` | Hybrid ML-KEM-768 + X25519 key exchange with AES-256-GCM encryption; wraps Node.js streams and WebSockets |
| `kxco-pq-vault` | `encryptPayload`, `decryptPayload`, `encodePublicKey`, `decodePublicKey`, `generateDek`, `generateNonce`, `wrapDek`, `unwrapDek`, `serializeHeader`, `parseEnvelope`, `parseHeaderText`, `computeKid`, `resolveRecipient`, `readIdentity`, `KxcoVaultError` | ML-KEM-768 envelope encryption for files and payloads; supports multiple recipients |
| `kxco-post-quantum-webhook` | `createSigner`, `createVerifier`, `signedFetch`, `signedEnvelope`, `signResponse`, `verifiedFetch`, `isStreamingBody`, `webhook`, `KxcoResponseError` | Dual-signed webhook delivery and verification — HMAC-SHA-256 plus ML-DSA-65; works with Express, Fastify, Hono, Workers, and Vercel |
| `kxco-pq-chain` | `KxcoChain`, `KxcoChainError`, `buildIntent`, `buildSigningMessage`, `randomNonce`, `canonicalize` | Relay client for the Armature L1 chain — build, sign, and submit intents |
| `kxco-pq-agent` | `KxcoAgentIdentity`, `AgentChainClient`, `validateScope`, `hashScope`, `KxcoPqAgentError` | Post-quantum identity and chain access for AI agents and automated services |

All cryptography uses [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) (ML-KEM-768) and [NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) (ML-DSA-65) via the [audited @noble/post-quantum](https://github.com/paulmillr/noble-post-quantum) library (Cure53, 2024). No custom cryptography.

---

## Quick start

The example below establishes a post-quantum identity, registers it with the chain, and has an agent sign and submit an intent — all from the same import.

```js
import {
  KxcoIdentity,
  mlDsa,
  KxcoChain,
  buildIntent,
  KxcoAgentIdentity,
  AgentChainClient,
  validateScope,
} from 'kxco-pq'

// 1. Institution creates and publishes its identity (done once at setup)
const institution = await KxcoIdentity.create()
const institutionPublicKey = await institution.getPublicKey()

// 2. User keypair generated after KYC; institution issues a credential
const userKeypair = mlDsa.ml_dsa65.keygen()
const credential = await institution.issue(userKeypair.publicKey, {
  role: 'verified-user',
  authority: ['sign:transactions', 'submit:intents'],
  expiresIn: '365d',
})
const user = KxcoIdentity.fromCredential({ keypair: userKeypair, credential })

// 3. Agent identity for an automated service acting on behalf of the user
const agent = await KxcoAgentIdentity.create({
  label: 'settlement-agent',
  scopes: ['submit:intents'],
})
const scopeOk = validateScope(agent.scopes, 'submit:intents')

// 4. Connect to the chain and submit a signed intent
const chain = new KxcoChain({ endpoint: 'https://chain.kxco.ai' })
const agentClient = new AgentChainClient({ chain, agent })

const intent = buildIntent({
  action: 'transfer',
  from: 'account_a',
  to: 'account_b',
  amount: '1000',
  currency: 'GBP',
})
const result = await agentClient.submit(intent)
console.log('submitted:', result.intentId)
```

---

## TypeScript

`kxco-pq` ships full `.d.ts` declarations generated from the sub-packages. No `@types` install needed. All exports are typed end-to-end.

```ts
import type { KxcoIdentity, KxcoChain, KxcoAgentIdentity } from 'kxco-pq'
```

---

## Individual packages

Install only what you need:

```sh
npm install kxco-pq-sdk                # identity, HSM, audit log, attestation
npm install kxco-pq-tls                # encrypted channels (streams + WebSockets)
npm install kxco-pq-vault              # file and payload encryption
npm install kxco-post-quantum-webhook  # webhook signing and verification
npm install kxco-pq-chain              # chain relay client
npm install kxco-pq-agent              # agent identity and chain access
```

---

## Security

To report a vulnerability: [security@kxco.ai](mailto:security@kxco.ai) — do not open a public issue.

Advisory feed: [github.com/JackKXCO/kxco-pq/security/advisories](https://github.com/JackKXCO/kxco-pq/security/advisories)

---

## License

Apache-2.0 © 2026 KXCO by Knightsbridge

Authors: Shayne Heffernan and John Heffernan
