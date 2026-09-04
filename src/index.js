// ── Identity, HSM, audit, attestation ────────────────────────────────────
export {
  KxcoIdentity,
  AuditedHsm,
  KxcoPqSdkError,
  PqHsm,
  MemoryBackend,
  FileBackend,
  Pkcs11Backend,
  AuditLog,
  FileAuditLog,
  attest,
  verify,
  mlDsa,
  mlKem,
  fingerprint,
  kidEquals,
} from 'kxco-pq-sdk'

// ── Verification modes ────────────────────────────────────────────────────
//
// `verify` above is synchronous and covers the signature and anchored modes.
// `verifyAsync` covers anchored+live, which needs a live registry lookup, and
// the dual-signature check.
//
// signature and anchored need no licence and no network. anchored+live needs
// both, and fails closed when the registry cannot be reached.
export {
  verifyAsync,
  generateClassicalKeypair,
  CLASSICAL_ALGORITHMS,
  networkConfig,
  networkConfigFromEnv,
  applyVerifyMode,
  readAnchor,
  KeyRegistry,
  KxcoPqNetworkError,
  FAILURE,
  VERIFY_MODES,
  CHAIN_ID,
  meter,
  usageEvent,
} from 'kxco-pq-sdk'

// ── Seed-form keys, compact JWS, backend reporting ────────────────────────
//
// RFC 9964 AKP JWKs and LAMPS seed-form PKCS#8; compact JWS using the RFC 9964
// algorithm names. Both are format and derivation only: no network, no licence.
export { seed, jws, backend } from 'kxco-pq-sdk'

// ── Encrypted channels ────────────────────────────────────────────────────
export {
  wrapStream,
  wrapWebSocket,
  PqTlsWebSocket,
  initiatorHandshake,
  responderHandshake,
  KxcoPqTlsError,
} from 'kxco-pq-tls'

// ── File / envelope encryption ────────────────────────────────────────────
export {
  encodePublicKey,
  decodePublicKey,
  serializeHeader,
  parseEnvelope,
  parseHeaderText,
  generateDek,
  generateNonce,
  computeKid,
  wrapDek,
  unwrapDek,
  encryptPayload,
  decryptPayload,
  resolveRecipient,
  readIdentity,
  KxcoVaultError,
} from 'kxco-pq-vault'

// ── Webhook signing ───────────────────────────────────────────────────────
export {
  createSigner,
  createVerifier,
  signedFetch,
  signedEnvelope,
  signResponse,
  isStreamingBody,
  verifiedFetch,
  KxcoResponseError,
  webhook,
} from 'kxco-post-quantum-webhook'

// ── Chain relay client ────────────────────────────────────────────────────
export {
  KxcoChain,
  KxcoChainError,
  buildIntent,
  buildSigningMessage,
  randomNonce,
  canonicalize,
} from 'kxco-pq-chain'

// ── Agent identity ────────────────────────────────────────────────────────
export {
  KxcoAgentIdentity,
  AgentChainClient,
  KxcoPqAgentError,
  validateScope,
  hashScope,
} from 'kxco-pq-agent'
