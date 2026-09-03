# kxco-pq

[![npm](https://img.shields.io/npm/v/kxco-pq.svg)](https://www.npmjs.com/package/kxco-pq)
[![Socket](https://socket.dev/api/badge/npm/package/kxco-pq)](https://socket.dev/npm/package/kxco-pq)
[![node](https://img.shields.io/node/v/kxco-pq.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/KnightsbridgeAIQ/kxco-pq/actions/workflows/ci.yml/badge.svg)](https://github.com/KnightsbridgeAIQ/kxco-pq/actions/workflows/ci.yml)

The complete KXCO post-quantum stack in one package.

```sh
npm install kxco-pq
```

Every export from all KXCO PQC packages is available from this single entry point. One install, one import source, no version juggling across sub-packages.

---

## Release integrity

Every release of this package is checkable without asking us for anything.

- **Provenance.** Each release carries a SLSA provenance attestation tying the
  published tarball to the commit and workflow that built it. Verify with
  `npm audit signatures`, or read it directly from
  `registry.npmjs.org/-/npm/v1/attestations/kxco-pq@<version>`.
- **Bill of materials.** A CycloneDX SBOM is published as a GitHub Release asset
  at `releases/download/v<version>/sbom.cyclonedx.json`, a permanent
  unauthenticated URL. Not an expiring build artifact.
- **Pinned where it matters.** Third-party dependencies are pinned to exact
  versions, never ranges, so the code that performs the cryptography cannot
  change without a release. Sibling `kxco-*` packages sit on caret ranges
  deliberately: it means a correctness fix in the base package reaches you
  without a release of every package above it. That is not theoretical. When
  `@noble/post-quantum` 0.7.1 was found to fail NIST SLH-DSA verification
  vectors, the revert in the base package propagated here on the next install.
  Every GitHub Action is pinned by 40-character commit SHA.
- **Conformance underneath.** The cryptography comes from
  [`kxco-post-quantum`](https://www.npmjs.com/package/kxco-post-quantum), which
  is run against **2,103 NIST ACVP vectors (0 failed)** and a **225-check
  cross-implementation interoperability matrix** against liboqs, Bouncy Castle
  and two pure-Python implementations, in both directions and with negative
  controls. Its published tarball also rebuilds bit-for-bit from its own tag,
  verified in CI on every run.

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

All cryptography uses [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) (ML-KEM-768) and [NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) (ML-DSA-65) via [`kxco-post-quantum`](https://www.npmjs.com/package/kxco-post-quantum), which wraps [@noble/post-quantum](https://github.com/paulmillr/noble-post-quantum) and prefers OpenSSL 3.5 where the runtime provides it. No custom cryptography.

**`@noble/post-quantum` is not audited.** An earlier version of this README called it "the audited @noble/post-quantum library (Cure53, 2024)". That was wrong. The other Noble packages have been audited, but separately and at different times: `@noble/hashes` by Cure53 in January 2022, `@noble/curves` by Trail of Bits in February 2023, Kudelski in September 2023 and Cure53 in September 2024, and `@noble/ciphers` by Cure53 in September 2024. None of those engagements covered the post-quantum package. Nothing in this stack has had a third-party cryptographic assessment.

What exists instead is evidence you can re-run: every parameter set checked against NIST's own ACVP vectors and cross-checked against OpenSSL, liboqs, Bouncy Castle and dilithium-py/kyber-py in both directions. See [`kxco-post-quantum/AUDIT.md`](https://github.com/KnightsbridgeAIQ/kxco-post-quantum/blob/main/AUDIT.md) and `npm run evidence` in that repository.

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

Advisory feed: [github.com/KnightsbridgeAIQ/kxco-pq/security/advisories](https://github.com/KnightsbridgeAIQ/kxco-pq/security/advisories)

---

## License

Apache-2.0 © 2026 KXCO by Knightsbridge

Authors: Shayne Heffernan and John Heffernan
