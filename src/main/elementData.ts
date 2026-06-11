// Sanitizer for element-selection data crossing from the target page into the
// trusted side panel.
//
// The `__attributeSelect__` CDP binding lives in the target page's main world,
// so any loaded web content — not just our injected overlay — can call it with
// an arbitrary JSON payload. Extracted from index.ts so this shaping logic is
// unit-testable without Electron (Project Principle 7: if production can't be
// tested, extract it).
//
// The shape mirrors the ElementData interface the renderer consumes
// (src/renderer/src/lib/types.ts) and the payload the overlay produces
// (src/inject/overlay.ts § extractData). We rebuild a fresh object containing
// ONLY the expected fields, each type-checked, so spoofed or malformed input is
// dropped rather than forwarded.

/** Sanitized element data forwarded to the renderer. Mirrors ElementData. */
export interface SanitizedElementData {
  tagName: string
  id: string | null
  classList: string[]
  parentChain: Array<{ tagName: string; id: string | null; classList: string[] }>
  boundingRect: { x: number; y: number; w: number; h: number }
  computedStyles: Record<string, string>
  attributes: Record<string, string>
  textContent: string | null
}

// Length caps. Strings are capped rather than rejected so a single oversized
// value can't be used to bloat the panel, while legitimate overlay payloads
// (which are well within these bounds) pass through unchanged.
const MAX_STRING = 1000
// The overlay caps textContent at 200 chars; match it so legitimate payloads
// are identical and longer spoofed values are truncated, not dropped.
const MAX_TEXT_CONTENT = 200
const MAX_CLASS_LIST = 100
const MAX_PARENT_CHAIN = 3
const MAX_RECORD_ENTRIES = 500

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function cleanString(value: unknown, max = MAX_STRING): string | null {
  if (typeof value !== 'string') return null
  return value.slice(0, max)
}

/** A required string field: must be a string, coerced to capped length. */
function cleanRequiredString(value: unknown, max = MAX_STRING): string | null {
  return cleanString(value, max)
}

/** An optional string field: a string (capped) or null; anything else → null. */
function cleanNullableString(value: unknown, max = MAX_STRING): string | null {
  if (value === null || value === undefined) return null
  return cleanString(value, max)
}

function cleanStringArray(value: unknown, maxItems: number): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    if (out.length >= maxItems) break
    if (typeof item === 'string') out.push(item.slice(0, MAX_STRING))
  }
  return out
}

function cleanFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function cleanBoundingRect(value: unknown): SanitizedElementData['boundingRect'] | null {
  if (!isObject(value)) return null
  const x = cleanFiniteNumber(value.x)
  const y = cleanFiniteNumber(value.y)
  const w = cleanFiniteNumber(value.w)
  const h = cleanFiniteNumber(value.h)
  if (x === null || y === null || w === null || h === null) return null
  return { x, y, w, h }
}

function cleanStringRecord(value: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!isObject(value)) return out
  let count = 0
  for (const [key, raw] of Object.entries(value)) {
    if (count >= MAX_RECORD_ENTRIES) break
    if (typeof raw !== 'string') continue
    out[key.slice(0, MAX_STRING)] = raw.slice(0, MAX_STRING)
    count++
  }
  return out
}

function cleanParentChain(value: unknown): SanitizedElementData['parentChain'] {
  if (!Array.isArray(value)) return []
  const out: SanitizedElementData['parentChain'] = []
  for (const item of value) {
    if (out.length >= MAX_PARENT_CHAIN) break
    if (!isObject(item)) continue
    const tagName = cleanRequiredString(item.tagName)
    if (tagName === null) continue
    out.push({
      tagName,
      id: cleanNullableString(item.id),
      classList: cleanStringArray(item.classList, MAX_CLASS_LIST)
    })
  }
  return out
}

/**
 * Validate and shape an arbitrary parsed payload into SanitizedElementData,
 * containing only the fields the renderer consumes. Returns null when the
 * payload is not a usable element selection (the only required signal is a
 * string `tagName`), in which case the caller should drop the message rather
 * than forward spoofed data into the trusted side panel.
 */
export function sanitizeElementData(parsed: unknown): SanitizedElementData | null {
  if (!isObject(parsed)) return null

  const tagName = cleanRequiredString(parsed.tagName)
  if (tagName === null) return null

  const boundingRect = cleanBoundingRect(parsed.boundingRect) ?? { x: 0, y: 0, w: 0, h: 0 }

  return {
    tagName,
    id: cleanNullableString(parsed.id),
    classList: cleanStringArray(parsed.classList, MAX_CLASS_LIST),
    parentChain: cleanParentChain(parsed.parentChain),
    boundingRect,
    computedStyles: cleanStringRecord(parsed.computedStyles),
    attributes: cleanStringRecord(parsed.attributes),
    textContent: cleanNullableString(parsed.textContent, MAX_TEXT_CONTENT)
  }
}
