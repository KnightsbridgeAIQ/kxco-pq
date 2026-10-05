// kxco-pq — full post-quantum stack declarations

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

// ── Category 5 parameter sets ─────────────────────────────────────────────
//
// ML-DSA-87 and ML-KEM-1024, the kxco-post-quantum modules, for callers given
// either as a requirement. ML-DSA-65 and ML-KEM-768 (mlDsa, mlKem above) stay
// the default everywhere in the stack.
export { mlDsa87, mlKem1024 } from 'kxco-post-quantum'

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
