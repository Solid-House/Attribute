// Encrypted API-key store backed by Electron safeStorage.
//
// Extracted from index.ts so the fail-closed logic is unit-testable without
// pulling in Electron (Project Principle 7: if production can't be tested,
// extract it). All collaborators are injected.

/** Minimal slice of Electron's safeStorage that this module depends on. */
export interface SafeStorageLike {
  isEncryptionAvailable(): boolean
  encryptString(plainText: string): Buffer
  decryptString(encrypted: Buffer): string
}

/** Settings persistence collaborators. */
export interface SettingsStore {
  read(): Record<string, unknown>
  write(key: string, value: unknown): void
  delete(key: string): void
}

const STORAGE_KEY = 'gemini-api-key'
const LEGACY_PLAINTEXT_KEY = 'gemini-api-key-plain'

export interface ApiKeyStore {
  save(key: string): void
  load(): string | undefined
  remove(): void
}

/**
 * Build an API-key store from injected dependencies.
 *
 * Fail-closed invariants:
 *  - When encryption is unavailable, save writes nothing and load returns
 *    undefined (never falls back to plaintext).
 *  - When a stored value cannot be decrypted, it is deleted and load returns
 *    undefined (no plaintext fallback, no stale ciphertext left behind).
 */
export function createApiKeyStore(
  safeStorage: SafeStorageLike,
  settings: SettingsStore
): ApiKeyStore {
  function save(key: string): void {
    if (!safeStorage.isEncryptionAvailable()) {
      console.error('safeStorage encryption not available — refusing to store API key in plaintext')
      return
    }
    const encrypted = safeStorage.encryptString(key)
    settings.write(STORAGE_KEY, encrypted.toString('base64'))
    // Remove any legacy plaintext key
    settings.delete(LEGACY_PLAINTEXT_KEY)
  }

  function load(): string | undefined {
    const stored = settings.read()[STORAGE_KEY] as string | undefined
    if (!stored) return undefined
    if (safeStorage.isEncryptionAvailable()) {
      try {
        return safeStorage.decryptString(Buffer.from(stored, 'base64'))
      } catch {
        console.warn('Discarding unreadable Gemini API key instead of returning plaintext fallback')
        settings.delete(STORAGE_KEY)
        return undefined
      }
    }
    console.warn('safeStorage encryption not available — refusing to load stored API key')
    return undefined
  }

  function remove(): void {
    settings.delete(STORAGE_KEY)
  }

  return { save, load, remove }
}
