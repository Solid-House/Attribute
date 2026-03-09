import type { ElementData } from './types'

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

function formatSelector(el: ElementData): string {
  let sel = el.tagName
  if (el.id) sel += `#${el.id}`
  if (el.classList.length) sel += '.' + el.classList.join('.')
  return sel
}

// ── Per-group style suggestion prompts ──

export function buildGroupSystemPrompt(): string {
  return `You are a CSS assistant. Given a target element, its current styles, and a user instruction, return ONLY a JSON object mapping camelCase CSS property names to their new values.

Rules:
- Only use properties from the allowed list provided
- Return valid CSS values
- Return ONLY the properties that need to change
- Do NOT include explanations, just the JSON object`
}

export function buildGroupUserPrompt(
  element: ElementData,
  groupLabel: string,
  groupKeys: string[],
  currentStyles: Record<string, string>,
  instruction: string
): string {
  const selector = formatSelector(element)
  const textSnippet = element.textContent?.slice(0, 100) ?? ''

  const currentValues = groupKeys
    .map((key) => {
      const val = currentStyles[key]
      return val ? `  ${camelToKebab(key)}: ${val}` : null
    })
    .filter(Boolean)
    .join('\n')

  const allowedProps = groupKeys.map(camelToKebab).join(', ')

  return `Element: ${selector}${textSnippet ? `\nText: "${textSnippet}"` : ''}
Group: ${groupLabel}
Allowed properties: ${allowedProps}

Current values:
${currentValues}

Instruction: ${instruction}`
}

// ── Prompt enhancement prompts ──

export function buildEnhanceSystemPrompt(): string {
  return `You are a design assistant. Given before/after CSS changes on an element, write a concise, intent-focused natural language prompt that a developer could give to an AI to reproduce these changes.

Focus on the design intent (e.g. "make the button more prominent", "add subtle depth") rather than listing specific CSS values. Keep it to 1-2 sentences. Return ONLY the prompt text, nothing else.`
}

export function buildEnhanceUserPrompt(
  element: ElementData,
  initialStyles: Record<string, string>,
  modifiedStyles: Record<string, string>
): string {
  const selector = formatSelector(element)
  const textSnippet = element.textContent?.slice(0, 100) ?? ''

  const changes: string[] = []
  for (const [prop, newVal] of Object.entries(modifiedStyles)) {
    const oldVal = initialStyles[prop] ?? ''
    if (newVal !== oldVal) {
      changes.push(`${camelToKebab(prop)}: ${oldVal} → ${newVal}`)
    }
  }

  return `Element: ${selector}${textSnippet ? `\nText: "${textSnippet}"` : ''}

CSS changes:
${changes.map((c) => `  ${c}`).join('\n')}`
}
