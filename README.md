# kxco-pq

**Post-quantum security for institutions in one install: identity, key custody, audit, attestation, encryption and AI agent identity on the NIST standards.**

[![npm](https://img.shields.io/npm/v/kxco-pq.svg?label=npm&color=b0964f)](https://www.npmjs.com/package/kxco-pq)
[![downloads](https://img.shields.io/npm/dm/kxco-pq?label=downloads&color=b0964f)](https://www.npmjs.com/package/kxco-pq)
[![NIST ACVP](https://img.shields.io/badge/NIST_ACVP-1,793_passed,_0_failed-2ea44f)](https://github.com/KnightsbridgeAIQ/kxco-post-quantum/blob/main/CONFORMANCE.md)
[![npm provenance](https://img.shields.io/badge/npm-provenance-2ea44f)](https://www.npmjs.com/package/kxco-pq)
[![Socket](https://socket.dev/api/badge/npm/package/kxco-pq)](https://socket.dev/npm/package/kxco-pq)
[![node](https://img.shields.io/node/v/kxco-pq.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![CI](https://github.com/KnightsbridgeAIQ/kxco-pq/actions/workflows/ci.yml/badge.svg)](https://github.com/KnightsbridgeAIQ/kxco-pq/actions/workflows/ci.yml)

```sh
npm install kxco-pq
```

- **The whole stack from one import.** Institution identity, HSM key custody, tamper-evident audit, document attestation, encrypted channels, file encryption, webhook signing, AI agent identity and a chain relay Armature L1 verifies in consensus.
- **NIST standards throughout.** ML-DSA-87 and ML-DSA-65 (FIPS 204), ML-KEM-1024 and ML-KEM-768 (FIPS 203), with the maths in OpenSSL 3.5 on Node 24 and later.
- **Proven underneath.** 1,793 NIST ACVP vectors passed, 0 failed, and 225 interoperability checks against liboqs, Bouncy Castle and the Python reference implementations, 0 failed, per [CONFORMANCE.md](https://github.com/KnightsbridgeAIQ/kxco-post-quantum/blob/main/CONFORMANCE.md).
- **Verifiable forever.** A signed envelope verifies offline from the envelope and a public key, with no KXCO server in the path, now or in ten years.
- **Typed end to end.** Full `.d.ts` declarations ship with the package, so there is no `@types` install.
- **A supply chain you can check.** SLSA provenance and a CycloneDX SBOM on every release since 1.2.5, third-party dependencies pinned to exact versions, and every GitHub Action pinned by commit SHA.

**The migration has dates.**

- **NIST** published [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final), [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) and [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final) in August 2024.
- **United States:** [Executive Order 14412](https://www.federalregister.gov/documents/2026/06/25/2026-12909/securing-the-nation-against-advanced-cryptographic-attacks), signed on 22 June 2026, moves federal high-value and high-impact systems to post-quantum key establishment by 31 December 2030 and to post-quantum signatures by 31 December 2031. [OMB M-26-15](https://www.whitehouse.gov/wp-content/uploads/2026/06/M-26-15-Execution-of-the-Migration-to-Post-Quantum-Cryptography.pdf) requires PQC-agile libraries for all new applications.
- **United Kingdom:** the [NCSC](https://www.ncsc.gov.uk/guidance/pqc-migration-timelines) sets 2028, 2031 and 2035 as its migration milestones.

[Quick start](#quick-start) · [What's included](#whats-included) · [For institutions](#for-institutions) · [Assessment notes](./ASSESSMENT.md) · [Changelog](./CHANGELOG.md) · [kxco.ai](https://kxco.ai)

---

## When to use this

Use `kxco-pq` when you want the full stack without managing individual package versions. It is the right choice for new projects, backend services that touch identity and chain together, and integrations that span more than two sub-packages.

Every export from all KXCO PQC packages is available from this single entry point. One install, one import source, no version juggling across sub-packages.

## When to use individual packages

Use the individual packages when you need only part of the stack and want minimal dependencies. If your service only verifies webhooks, install `kxco-post-quantum-webhook`. If it only encrypts files, install `kxco-pq-vault`. The full family is listed at the bottom of this file.

Requires Node.js 22.12 or later.

---

## What's included

| Sub-package | Exports | Description |
|---|---|---|
| `kxco-pq-sdk` | `KxcoIdentity`, `AuditedHsm`, `PqHsm`, `MemoryBackend`, `FileBackend`, `Pkcs11Backend`, `AuditLog`, `FileAuditLog`, `attest`, `verify`, `mlDsa`, `mlKem`, `fingerprint`, `kidEquals`, `KxcoPqSdkError` | ML-DSA-87 and ML-DSA-65 hierarchical identity credentials, encrypted HSM key storage, tamper-evident audit log, and attestation signing |
| `kxco-pq-tls` | `wrapStream`, `wrapWebSocket`, `PqTlsWebSocket`, `initiatorHandshake`, `responderHandshake`, `KxcoPqTlsError` | Hybrid ML-KEM-1024 + X25519 key exchange by default, ML-KEM-768 available, with AES-256-GCM encryption; wraps Node.js streams and WebSockets. New keys made with these packages use ML-KEM-1024 (FIPS 203, Category 5); ML-KEM-768 keys made earlier keep decrypting. |
| `kxco-pq-vault` | `encryptPayload`, `decryptPayload`, `encodePublicKey`, `decodePublicKey`, `generateDek`, `generateNonce`, `wrapDek`, `unwrapDek`, `serializeHeader`, `parseEnvelope`, `parseHeaderText`, `computeKid`, `resolveRecipient`, `readIdentity`, `KxcoVaultError` | ML-KEM-1024 envelope encryption for files and payloads by default; supports multiple recipients. ML-KEM-768 envelopes made earlier still decrypt |
| `kxco-post-quantum-webhook` | `createSigner`, `createVerifier`, `signedFetch`, `signedEnvelope`, `signResponse`, `verifiedFetch`, `isStreamingBody`, `webhook`, `KxcoResponseError` | Dual-signed webhook delivery and verification: HMAC-SHA-256 plus ML-DSA-87 or ML-DSA-65; works with Express, Fastify, Hono, Workers, and Vercel |
| `kxco-pq-chain` | `KxcoChain`, `KxcoChainError`, `buildIntent`, `buildSigningMessage`, `randomNonce`, `canonicalize` | Relay client for the Armature L1 chain: build, sign, and submit intents |
| `kxco-pq-agent` | `KxcoAgentIdentity`, `AgentChainClient`, `validateScope`, `hashScope`, `KxcoPqAgentError` | Post-quantum identity and chain access for AI agents and automated services |
| `kxco-post-quantum` | `mlDsa87`, `mlKem1024` | ML-DSA-87 and ML-KEM-1024, the Category 5 parameter sets, beside ML-DSA-65 and ML-KEM-768 (`mlDsa`, `mlKem`). ML-DSA-87 is the set for a new signing key |

All cryptography uses [NIST FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) (ML-KEM-1024 and ML-KEM-768) and [NIST FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) (ML-DSA-87 and ML-DSA-65) via [`kxco-post-quantum`](https://www.npmjs.com/package/kxco-post-quantum), which wraps [@noble/post-quantum](https://github.com/paulmillr/noble-post-quantum) and prefers OpenSSL 3.5 where the runtime provides it. No custom cryptography.

That base package is held to evidence you can re-run: every parameter set checked against NIST's own ACVP vectors and cross-checked against liboqs, Bouncy Castle and dilithium-py/kyber-py in both directions. See its [CONFORMANCE.md](https://github.com/KnightsbridgeAIQ/kxco-post-quantum/blob/main/CONFORMANCE.md), the audit history of every upstream library in [AUDIT.md](https://github.com/KnightsbridgeAIQ/kxco-post-quantum/blob/main/AUDIT.md), and `npm run evidence` in that repository.

---

## Quick start

An institution creates its identity, credentials a customer, and sponsors an AI agent that anyone can verify offline, all from the same import. Every key here is ML-DSA-87. Keys and signatures made with ML-DSA-65 keep verifying.

```js
import { KxcoIdentity, KxcoAgentIdentity, mlDsa87 } from 'kxco-pq'

// 1. The institution creates its post-quantum identity, once, at setup
const institution = await KxcoIdentity.create({ alg: 'ML-DSA-87' })

// 2. After KYC, it issues a customer a signed credential
const customer = mlDsa87.ml_dsa87.keygen()
const credential = await institution.issue(customer.publicKey, {
  role: 'verified-user',
  authority: ['sign:transactions'],
  expiresIn: '365d',
})

// 3. It sponsors an AI agent with a scoped, expiring identity
const agent = await KxcoAgentIdentity.create({
  sponsor:   institution,
  label:     'Settlement Bot',
  agentType: 'llm',
  alg:       'ML-DSA-87',
  scope:     { attestations: { purposes: ['trade-confirmation'] } },
  expiresIn: '90d',
})

// 4. Anyone verifies the agent's credential offline, from the sponsor's public key
const { valid } = await KxcoAgentIdentity.verify(agent.credential, {
  sponsorPublicKey: await institution.getPublicKey(),
})
// valid === true

// 5. The agent anchors on Armature L1 through the KXCO relay, a licensed service
const client = agent.toChainClient('https://relay.kxco.ai')
const { txHash } = await client.anchorAttestation({
  payloadHash: '9f86d081884c7d65...',
  purpose:     'trade-confirmation',
})
```

---

## For institutions

The cryptography is free under Apache-2.0, works offline and needs nothing from
KXCO, now or in ten years. What KXCO sells is the part that has to be operated:
an answer about the present.

| Service | What you get |
|---|---|
| Hosted key registry | Whether a key is active, revoked or rotated, answered at verification time |
| Meta-transaction relay | KXCO validates your signed intent, pays the gas and submits it, so you never hold a token or run a node |
| On-chain anchoring | A timestamp on Armature L1 that the chain itself has verified |
| Live revocation | `anchored+live` verification, which confirms the signing key is still trusted now |
| Support and SLA | Availability commitments, an escalation path and a named contact |

Priced in USD, per seat, per year. No tokens, no nodes and no wallets. The line
between free and paid is set out in
[LICENCE-PRODUCT.md](https://github.com/KnightsbridgeAIQ/kxco-post-quantum/blob/main/LICENCE-PRODUCT.md).

**Talk to us: [admin@kxco.ai](mailto:admin@kxco.ai)** · [kxco.ai](https://kxco.ai)

---

## TypeScript

`kxco-pq` ships full `.d.ts` declarations generated from the sub-packages. No `@types` install needed. All exports are typed end-to-end.

```ts
import type { KxcoIdentity, KxcoChain, KxcoAgentIdentity } from 'kxco-pq'
```

---

## The KXCO post-quantum family

One install covers the stack. Each part is also published on its own:

| You need to | Install |
|---|---|
| Put the whole stack in one install | [`kxco-pq`](https://www.npmjs.com/package/kxco-pq) |
| Use ML-DSA, ML-KEM and SLH-DSA directly | [`kxco-post-quantum`](https://www.npmjs.com/package/kxco-post-quantum) |
| Keep signing keys on the HSM you already run | [`kxco-pq-hsm`](https://www.npmjs.com/package/kxco-pq-hsm) |
| Sign a document or record anyone can verify offline | [`kxco-pq-attest`](https://www.npmjs.com/package/kxco-pq-attest) |
| Keep a tamper-evident audit trail | [`kxco-pq-audit`](https://www.npmjs.com/package/kxco-pq-audit) |
| Verify a signature in a browser, with no server | [`kxco-verify`](https://www.npmjs.com/package/kxco-verify) |
| Issue institution identity credentials | [`kxco-pq-sdk`](https://www.npmjs.com/package/kxco-pq-sdk) |
| Encrypt files and payloads to one or many recipients | [`kxco-pq-vault`](https://www.npmjs.com/package/kxco-pq-vault) |
| Encrypt Node streams and WebSockets | [`kxco-pq-tls`](https://www.npmjs.com/package/kxco-pq-tls) |
| Sign and verify webhooks | [`kxco-post-quantum-webhook`](https://www.npmjs.com/package/kxco-post-quantum-webhook) |
| Give an AI agent an identity a verified institution sponsors | [`kxco-pq-agent`](https://www.npmjs.com/package/kxco-pq-agent) |
| Have Armature L1 verify a signature in consensus | [`kxco-pq-chain`](https://www.npmjs.com/package/kxco-pq-chain) |
| Prove an envelope at three levels, offline to on-chain | [`kxco-pq-network`](https://www.npmjs.com/package/kxco-pq-network) |
| Generate and rotate keys from a terminal | [`kxco-pq-cli`](https://www.npmjs.com/package/kxco-pq-cli) |
| Find quantum-vulnerable cryptography in a dependency tree | [`kxco-pq-scan`](https://www.npmjs.com/package/kxco-pq-scan) |
| Fail the build when code reaches past the wrapper | [`eslint-plugin-kxco-pq`](https://www.npmjs.com/package/eslint-plugin-kxco-pq) |

---

## Release integrity

Every release since 1.2.5 carries a SLSA provenance attestation tying the published tarball to
the commit and workflow that built it: verify with `npm audit signatures`, or read
it from `registry.npmjs.org/-/npm/v1/attestations/kxco-pq@<version>`. A CycloneDX
SBOM is published, from v1.2.5, as a GitHub Release asset at
`releases/download/v<version>/sbom.cyclonedx.json`, a permanent unauthenticated
URL. Sibling `kxco-*` packages sit on caret ranges so a correctness fix in the
base package reaches you on the next install, with no release of every package
above it.

---

## Security

To report a vulnerability, email [security@kxco.ai](mailto:security@kxco.ai) and keep the report out of public issues.

Advisory feed: [github.com/KnightsbridgeAIQ/kxco-pq/security/advisories](https://github.com/KnightsbridgeAIQ/kxco-pq/security/advisories)

---

## License

Apache-2.0 © 2026 Knightsbridge Financial Ltd, trading as KXCO. See [LICENSE](./LICENSE) and [NOTICE](./NOTICE).

Authors: Shayne Heffernan and John Heffernan
