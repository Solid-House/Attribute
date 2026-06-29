// Builders for the CDP `Runtime.evaluate` expression strings that drive the
// injected overlay bindings (defined in src/inject/overlay.ts). Centralizing
// them keeps the binding names and JSON escaping consistent across every call
// site, so the convention can never drift between handlers.

/**
 * Build the expression that applies a single CSS property/value to the
 * currently selected element via the injected `__attributeSetStyle__` binding.
 * Values are JSON-escaped so arbitrary strings cannot break out of the call.
 */
export function setStyleExpression(prop: string, value: string): string {
  return `window.__attributeSetStyle__(${JSON.stringify(prop)}, ${JSON.stringify(value)})`
}
