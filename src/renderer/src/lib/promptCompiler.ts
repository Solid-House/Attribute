import type { ElementData } from './types'

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

function formatElementSelector(el: ElementData): string {
  let sel = `<${el.tagName}`
  if (el.id) sel += ` id="${el.id}"`
  if (el.classList.length) sel += ` class="${el.classList.join(' ')}"`
  sel += '>'
  return sel
}

function formatTextContext(el: ElementData): string {
  if (!el.textContent) return ''
  const text = el.textContent.trim()
  if (!text) return ''
  // Include up to 120 chars of text content for identification
  const snippet = text.length > 120 ? text.slice(0, 120) + '...' : text
  return ` containing the text "${snippet}"`
}

function formatParentContext(chain: ElementData['parentChain']): string {
  if (!chain || chain.length === 0) return ''

  const parts = chain.map((ancestor) => {
    let sel = `<${ancestor.tagName}`
    if (ancestor.id) sel += ` id="${ancestor.id}"`
    if (ancestor.classList.length) sel += ` class="${ancestor.classList.join(' ')}"`
    sel += '>'
    return sel
  })

  return ' (inside ' + parts.join(' inside ') + ')'
}

/**
 * Compiles a natural language prompt from CSS diffs.
 * Returns null if there are no genuine changes.
 */
export function compilePrompt(
  element: ElementData,
  initialStyles: Record<string, string>,
  modifiedStyles: Record<string, string>
): string | null {
  // Build genuine diff — filter out no-ops where value was changed back
  const changes: Array<{ property: string; from: string; to: string }> = []

  for (const [prop, newValue] of Object.entries(modifiedStyles)) {
    const originalValue = initialStyles[prop] ?? ''
    if (newValue !== originalValue) {
      changes.push({
        property: camelToKebab(prop),
        from: originalValue,
        to: newValue
      })
    }
  }

  if (changes.length === 0) return null

  const selector = formatElementSelector(element)
  const parentContext = formatParentContext(element.parentChain)

  const changeDescriptions = changes.map(
    (c) => `change ${c.property} from ${c.from} to ${c.to}`
  )

  // Join with commas and "and" for the last item
  let changeList: string
  if (changeDescriptions.length === 1) {
    changeList = changeDescriptions[0]
  } else {
    const allButLast = changeDescriptions.slice(0, -1).join(', ')
    changeList = `${allButLast}, and ${changeDescriptions[changeDescriptions.length - 1]}`
  }

  const textContext = formatTextContext(element)

  return `Update the styling for the ${selector} element${textContext}${parentContext}. Apply the following CSS changes: ${changeList}.`
}
