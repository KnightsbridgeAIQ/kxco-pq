# Assessment notes

Where this package's boundary falls, what agility it has, and what constrains
its lifecycle.

## Boundary

**What the assessed thing is: a bundle, and almost nothing else.** This package
installs and re-exports seven others. `src/index.js` is a set of re-export
statements. It implements no cryptography, defines no wire format, opens no
socket and stores nothing.

**So the honest statement is that this package cannot be assessed on its own.**
Every property a buyer cares about is decided in a member package, and an
assessment result attached to this name without naming the members is not
meaningful. The members and where their properties are decided:

| Member | What it decides |
|---|---|
| [`kxco-pq-sdk`](https://www.npmjs.com/package/kxco-pq-sdk) | Institution identity and the composition of custody, audit and attestation |
| [`kxco-pq-chain`](https://www.npmjs.com/package/kxco-pq-chain) | Signed intents to the relay, and the relay dependency |
| [`kxco-pq-tls`](https://www.npmjs.com/package/kxco-pq-tls) | Its own handshake protocol and record layer |
| [`kxco-pq-vault`](https://www.npmjs.com/package/kxco-pq-vault) | File and envelope encryption, pure post-quantum |
| [`kxco-pq-agent`](https://www.npmjs.com/package/kxco-pq-agent) | Agent identity, with scope enforced relay-side |
| [`kxco-pq-network`](https://www.npmjs.com/package/kxco-pq-network) | Verification modes, the registry, the licence |
| [`kxco-post-quantum-webhook`](https://www.npmjs.com/package/kxco-post-quantum-webhook) | Webhook signing, and the family's best key-rotation story |

Each carries its own `ASSESSMENT.md` and its own evidence bundle. Read the ones
you will actually deploy.

**What installing this does that installing the parts does not.** It pulls in
all seven whether or not they are used. For an assessment that matters in one
direction: the dependency surface, the SBOM and the audit signature check all
cover seven packages and their transitive trees, not the one or two features a
deployment uses. A buyer who needs the smallest reviewable surface should
install the individual packages, and the README says so.

**Transitively, this bundle inherits every required service connection in the
family:** `relay.kxco.ai` through `kxco-pq-chain` and `kxco-pq-agent`, and
`chain.kxco.ai` through `kxco-pq-network`. Both negotiate the hybrid key
exchange group `X25519MLKEM768` under TLS 1.3, measured 7 September 2026 with
OpenSSL 3.5.6, and both present ECDSA P-384 certificates, so endpoint
authentication is classical. The details, including which modes require them
and what happens when they are unavailable, are in those packages' notes.

**Start and update.** Every release carries a SLSA provenance attestation,
tying the published tarball to the commit and workflow that built it, and a
CycloneDX SBOM as a GitHub Release asset at a permanent unauthenticated URL
rather than an expiring build artifact. Both are checkable without asking us
for anything.

What this package does not have is release-asset signing with ML-DSA-65
against a committed public key. That is the primitives package, it is the
stronger control, and it should not be read across to this one.

## Agility

**None of its own.** No algorithms, no formats, no versions to negotiate.

**What it does add is a coordination problem, and it is worth naming.** The
seven members release independently and each declares its dependencies as
ranges. A parameter-set migration has to move through all of them, plus the
chain and the relay, before this bundle presents a coherent position. Nothing
in this package coordinates that, and installing the bundle does not pin the
members to a set that has been assessed together.

## Lifecycle

**Assess `origin/main`, and know that this working tree is ahead of it.**
Verified 8 September 2026: `origin/main`, this checkout and npm all read 2.0.1,
so the published artefact does correspond to `origin/main`.

The local working branch is `main2`, which carries 5 commits that have never
been pushed and is 1 behind `origin/main`. The remote has no `main2`. The
evidence bundle records the branch it was built from in `01-identity.json`.

**Supported versions.** One line moving forward. At 2.x while several members
are at 1.x; the major numbers are per package and this bundle's version does
not describe its members'.

**Pins: seven ranges, and no direct primitives dependency.** All seven members
are declared as caret ranges, so two installs of the same version of this
package can differ in seven places. There is no direct `kxco-post-quantum`
dependency here, which is why the evidence bundle carries no
`02-primitives.json`: the primitives arrive transitively, at whatever version
each member resolves. `04-sbom.cyclonedx.json` is the file that describes what
was actually assessed, and for this package it is the only one that can.

**Ceiling.** No ceiling of its own. It inherits the family's one hardware
ceiling through `kxco-pq-sdk` and `kxco-pq-hsm`: a token performs the
mechanisms its firmware implements.

**Blocking dependencies.** All of the members', combined: the upstream
primitives library, and the KXCO relay and registry services with their licence
where the live modes are used.

**Roadmap.** No external audit of this package. There would be little to audit;
the question belongs to the members.

## Correcting this document

Every claim here is checkable against `src/index.js`, `package.json` and the
member repositories. If one does not match, that is a defect worth reporting
through the repository's issues.
