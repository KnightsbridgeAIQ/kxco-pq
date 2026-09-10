# Assessment notes

The answers a buyer's readiness assessment asks for: what this package does,
how it moves when algorithms move, and what it takes to run it.

## What this package is

The whole KXCO post-quantum stack in one install. Institution identity, HSM
custody, tamper-evident audit, attestation, encrypted channels, file encryption,
agent identity, on-chain anchoring and webhook signing, behind one import and
one version number.

**One decision instead of seven.** A team adopting post-quantum cryptography
does not want to research which seven packages compose correctly and at which
versions. This is the answer to that question, maintained as one.

| Member | What it brings |
|---|---|
| [`kxco-pq-sdk`](https://www.npmjs.com/package/kxco-pq-sdk) | Hierarchical institution identity, and `AuditedHsm` binding signing to the record |
| [`kxco-pq-chain`](https://www.npmjs.com/package/kxco-pq-chain) | Signed intents verified in consensus on Armature L1 |
| [`kxco-pq-tls`](https://www.npmjs.com/package/kxco-pq-tls) | Hybrid ML-KEM-768 + X25519 channels with mutual ML-DSA-65 identity |
| [`kxco-pq-vault`](https://www.npmjs.com/package/kxco-pq-vault) | Multi-recipient file encryption, pure post-quantum |
| [`kxco-pq-agent`](https://www.npmjs.com/package/kxco-pq-agent) | Sponsored agent identity with capability scope enforced at both ends |
| [`kxco-pq-network`](https://www.npmjs.com/package/kxco-pq-network) | Three verification modes, fail-closed live key status |
| [`kxco-post-quantum-webhook`](https://www.npmjs.com/package/kxco-post-quantum-webhook) | Dual-signature webhooks with a drain window for key rotation |

Every one of them carries its own `ASSESSMENT.md` and its own evidence bundle,
so a buyer can assess exactly the part their control framework cares about
without taking the bundle on faith. That is the point of composing rather than
monolithing.

**All cryptography delegates to one audited surface.**
[`kxco-post-quantum`](https://www.npmjs.com/package/kxco-post-quantum) is the
only place primitives are implemented, and it is held to published evidence
rather than assertion: 2,103 NIST ACVP vectors across FIPS 203, 204 and 205, and
225 cross-implementation interoperability checks against OpenSSL 3.5, liboqs,
Bouncy Castle and two Python implementations, 0 failed. One implementation to
review, seven packages that inherit the result.

**A worked stack, not a bag of parts.** The members are designed against each
other: an audit log records the kid the registry resolves, an attestation
anchors through the chain client, an agent's scope is checked locally and again
at the relay. Those compositions are the value, and they are why the bundle
exists as a package rather than a documentation page.

## Scope

Installing this pulls in all seven. A deployment that needs one or two features
and the smallest possible reviewable surface should install those packages
directly, and the README says so — the bundle is for teams who want the whole
stack, and the individual packages are for teams who want a subset. Both are
supported and neither is a compromise.

`src/index.js` is re-exports. The behaviour is the members', which is why this
document points at theirs rather than restating them.

## Agility

Nothing of its own: no algorithms, no wire formats, no versions to negotiate.

What it provides is a tested combination. A parameter-set migration moves
through the primitives, the packages that own formats, and the chain and relay
that must accept them; this bundle is where a version set known to work together
is expressed as one number.

## Running it

**Release integrity.** Every release carries a SLSA provenance attestation and
a CycloneDX SBOM at a permanent unauthenticated URL, plus an evidence bundle
from `npm run evidence`. `04-sbom.cyclonedx.json` in that bundle is the file
that records exactly which member versions were assessed together.

**Supported versions.** One line moving forward. Fixes land in the next release.

**Connections.** Transitively, the stack's service connections are
`relay.kxco.ai` through `kxco-pq-chain` and `kxco-pq-agent`, and
`chain.kxco.ai` through `kxco-pq-network`. Both negotiate the hybrid key
exchange group `X25519MLKEM768` under TLS 1.3, measured 7 September 2026 with
OpenSSL 3.5.6. Which modes require them, and what happens when they are
unavailable, is in those packages' notes.

**Runtime.** Node 20.19 and later, with Node 24 and later running the primitives
in OpenSSL 3.5 for roughly 4x to 8x per operation.

## Correcting this document

Every claim here is checkable against `src/index.js`, `package.json` and the
member repositories. If one does not match, that is a defect worth reporting
through the repository's issues.
