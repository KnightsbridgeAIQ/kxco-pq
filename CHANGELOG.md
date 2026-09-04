# Changelog

## 2.0.0

Meta package. Tracks the breaking releases below and re-exports the new
surface. No code of its own changed.

### Dependencies

- `kxco-pq-chain` ^2.0.0 — **relay writes now require a licence key**, and
  every response must name chain 1111111
- `kxco-pq-sdk` ^2.0.0 — re-exports the verification modes
- `kxco-post-quantum-webhook` ^1.2.0 — optional compact-JWS delivery path
- `kxco-pq-tls` ^1.2.0 — repositioned as secondary to TLS; new `TLS.md`
- `kxco-pq-network` ^1.0.0 — **new**: the three verification modes and the key
  registry

Read `kxco-pq-chain`'s changelog before upgrading. A service that constructs a
`KxcoChain` against the hosted relay without a licence key now throws at boot.

### Corrected

The README described `@noble/post-quantum` as "the audited @noble/post-quantum
library (Cure53, 2024)". **That was wrong.** The other Noble packages have been audited, but separately and at different times: `@noble/hashes` by Cure53 in January 2022, `@noble/curves` by Trail of Bits in February 2023, Kudelski in September 2023 and Cure53 in September 2024, and `@noble/ciphers` by Cure53 in September 2024. None of those engagements covered the post-quantum package.
Nothing in this stack has had a third-party cryptographic assessment.

What exists instead is evidence a customer can re-run: `npm run evidence` in
`kxco-post-quantum` produces a bundle with the ACVP conformance output, the
cross-implementation interoperability matrix, the backend that did the maths,
an SBOM, and the honest documents. It is not an audit and it says so.

The `quantum-safe` keyword is removed from the manifest.

## 1.2.6

Earlier releases. See git history.
