// Shared URL scheme guard.
//
// The browser only permits navigation to http/https. This single predicate is
// reused by the address-bar navigate handler, the target view's will-navigate
// guard, the popup's will-navigate guard, and setWindowOpenHandler so the
// allow-list can never drift between them.

/**
 * Returns true only when `url` parses and uses the http: or https: scheme.
 * Any parse failure (malformed URL, missing scheme) returns false — fail closed.
 */
export function isAllowedScheme(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}
