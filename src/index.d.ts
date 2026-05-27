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
