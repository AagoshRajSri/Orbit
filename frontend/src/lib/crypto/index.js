/**
 * Orbit Crypto Module — Barrel export
 *
 * Single import point for all cryptographic subsystems.
 * Usage: import { initializeMEK, signWithDeviceKey, ... } from "../lib/crypto";
 */

// ── MEK Engine (Key lifecycle) ────────────────────────────────────────────────
export {
  deriveKEK,
  generateMEK,
  wrapMEK,
  unwrapMEK,
  deriveCVK,
  encryptForVault,
  decryptFromVault,
  initializeMEK,
  restoreMEK,
  rotateMEK,
  getCachedMEK,
  getCurrentEpoch,
  clearMEK,
} from "./mekEngine.js";

// ── Device Trust (Identity & Signing) ─────────────────────────────────────────
export {
  initDeviceIdentity,
  getDeviceIdentity,
  deriveDeviceId,
  signWithDeviceKey,
  verifyDeviceSignature,
  generateLinkEphemeralKey,
  deriveLinkSharedSecret,
  encryptVaultTransfer,
  decryptVaultTransfer,
  destroyDeviceIdentity,
} from "./deviceTrust.js";

// ── Sync Engine (Multi-device vault synchronization) ──────────────────────────
export {
  loadRemoteVault,
  writeVault,
  persistSenderKey,
  loadSenderKey,
  reconcileStaleDevice,
  verifyManifestChain,
  fullSyncCycle,
  getSyncState,
} from "./syncEngine.js";

// ── Recovery Engine (Passphrase-to-message restoration) ───────────────────────
export {
  executeRecovery,
  secureCryptoLogout,
  provisionNewVault,
} from "./recoveryEngine.js";
