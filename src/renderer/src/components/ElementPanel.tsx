import { useState, useRef, useCallback, useEffect } from 'react'
import type { ElementData, StyleGroup, StyleKey } from '../lib/types'
import { STYLE_GROUPS, SHORTHAND_MAP, getInputKind, getSelectOptions } from '../lib/types'
import { buildGroupSystemPrompt, buildGroupUserPrompt } from '../lib/aiPrompts'

interface ElementPanelProps {
  element: ElementData
  initialStyles: Record<string, string>
  modifiedStyles: Record<string, string>
  onStyleChange: (prop: string, value: string) => void
  onRevertStyle: (prop: string) => void
  onCopyPrompt: () => void
  onReset: () => void
  onTextChange: (text: string) => void
  copied: boolean
  modificationCount: number
  hasApiKey: boolean
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
}

// ── Helpers ──

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return '#000000'
  const r = parseInt(match[1], 10)
  const g = parseInt(match[2], 10)
  const b = parseInt(match[3], 10)
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

function stepNumericValue(current: string, delta: number): string {
  // Match number + optional unit, e.g. "16px", "1.5em", "0", "100%"
  const match = current.match(/^(-?\d*\.?\d+)(.*)$/)
  if (!match) return current
  const num = parseFloat(match[1])
  const unit = match[2] || ''
  const stepped = Math.round((num + delta) * 100) / 100
  return stepped + unit
}

const NOISE_VALUES = new Set(['', 'none', 'normal', 'auto', 'static', 'visible', '0px', 'start'])

function isNoiseValue(value: string): boolean {
  return NOISE_VALUES.has(value)
}

// ── CSS value tokenizer (splits on spaces, respects parens and quotes) ──

function tokenizeCssValue(value: string): string[] {
  const tokens: string[] = []
  let current = ''
  let depth = 0
  let inQuote: string | null = null
  for (const char of value) {
    if (inQuote) {
      current += char
      if (char === inQuote) inQuote = null
      continue
    }
    if (char === '"' || char === "'") {
      inQuote = char
      current += char
      continue
    }
    if (char === '(') depth++
    if (char === ')') depth--
    if (char === ' ' && depth === 0) {
      if (current) tokens.push(current)
      current = ''
    } else {
      current += char
    }
  }
  if (current) tokens.push(current)
  return tokens
}

// ── TokenInput sub-component (single token in a multi-value row) ──

function TokenInput({ value, onCommit }: { value: string; onCommit: (val: string) => void }) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const displayValue = editing ? draft : value

  const commit = (val: string) => {
    const trimmed = val.trim()
    if (trimmed && trimmed !== value) {
      onCommit(trimmed)
    }
    setEditing(false)
  }

  return (
    <input
      ref={inputRef}
      className="style-token"
      type="text"
      value={displayValue}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => { setDraft(value); setEditing(true) }}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { commit(draft); inputRef.current?.blur() }
        if (e.key === 'Escape') { setDraft(value); setEditing(false); inputRef.current?.blur() }
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          const match = displayValue.match(/^(-?\d*\.?\d+)(.*)$/)
          if (match) {
            e.preventDefault()
            const delta = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1)
            const stepped = stepNumericValue(displayValue, delta)
            setDraft(stepped)
            onCommit(stepped)
          }
        }
      }}
      spellCheck={false}
    />
  )
}

// ── StyleInput sub-component ──

interface StyleInputProps {
  propKey: string
  value: string
  isModified: boolean
  onCommit: (prop: string, value: string) => void
  onRevert?: (prop: string) => void
}

function StyleInput({ propKey, value, isModified, onCommit, onRevert }: StyleInputProps) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const kind = getInputKind(propKey)
  const tokens = tokenizeCssValue(value)
  const isMultiValue = tokens.length > 1 && kind === 'text'

  const displayValue = editing ? draft : value

  const commit = useCallback(
    (val: string) => {
      const trimmed = val.trim()
      if (trimmed && trimmed !== value) {
        onCommit(propKey, trimmed)
      }
      setEditing(false)
    },
    [propKey, value, onCommit]
  )

  const handleFocus = () => {
    setDraft(value)
    setEditing(true)
  }

  const handleBlur = () => {
    commit(draft)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit(draft)
      inputRef.current?.blur()
    } else if (e.key === 'Escape') {
      setDraft(value)
      setEditing(false)
      inputRef.current?.blur()
    } else if (kind === 'numeric' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      const delta = (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1)
      const currentVal = editing ? draft : value
      const stepped = stepNumericValue(currentVal, delta)
      setDraft(stepped)
      onCommit(propKey, stepped)
    }
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    setDraft(hex)
    onCommit(propKey, hex)
  }

  const kebab = camelToKebab(propKey)
  const selectOptions = getSelectOptions(propKey)

  return (
    <div className={`style-row${isModified ? ' style-row--modified' : ''}`}>
      {isModified && onRevert && (
        <button className="style-revert" onClick={() => onRevert(propKey)} title="Revert">
          <span className="material-symbols-rounded">close</span>
        </button>
      )}
      <span className="style-key">{kebab.replace(/,/g, '')}</span>
      <div className={`style-input-wrapper${isMultiValue ? ' style-input-wrapper--multi' : ''}`}>
        {kind === 'color' && (
          <input
            type="color"
            className="color-swatch"
            value={rgbToHex(value)}
            onChange={handleColorChange}
          />
        )}
        {isMultiValue ? (
          tokens.map((token, i) => (
            <TokenInput
              key={i}
              value={token}
              onCommit={(newToken) => {
                const updated = [...tokens]
                updated[i] = newToken
                onCommit(propKey, updated.join(' '))
              }}
            />
          ))
        ) : kind === 'select' && selectOptions ? (
          <select
            className="style-select"
            value={value}
            onChange={(e) => onCommit(propKey, e.target.value)}
          >
            {!selectOptions.includes(value) && (
              <option value={value}>{value}</option>
            )}
            {selectOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef}
            className="style-input"
            type="text"
            value={displayValue}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
}

// ── AI Group Input sub-component ──

interface AiGroupInputProps {
  element: ElementData
  group: StyleGroup
  currentStyles: Record<string, string>
  onStyleChange: (prop: string, value: string) => void
}

function AiGroupInput({ element, group, currentStyles, onStyleChange }: AiGroupInputProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(async () => {
    const instruction = value.trim()
    if (!instruction || loading) return

    setLoading(true)
    try {
      const systemPrompt = buildGroupSystemPrompt()
      const userPrompt = buildGroupUserPrompt(
        element,
        group.label,
        group.keys,
        currentStyles,
        instruction
      )
      const res = await window.api.geminiStyleSuggest(systemPrompt, userPrompt)
      if (res.success && res.result) {
        for (const [prop, val] of Object.entries(res.result)) {
          onStyleChange(prop, val)
        }
        setValue('')
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setLoading(false)
    }
  }, [value, loading, element, group, currentStyles, onStyleChange])

  return (
    <div className="ai-group-input">
      <input
        ref={inputRef}
        className="ai-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit()
        }}
        placeholder={`Ask AI about ${group.label.toLowerCase()}...`}
        spellCheck={false}
        disabled={loading}
      />
      {loading && <div className="ai-loading" />}
    </div>
  )
}

// ── Main panel ──

export default function ElementPanel({
  element,
  initialStyles,
  modifiedStyles,
  onStyleChange,
  onRevertStyle,
  onCopyPrompt,
  onReset,
  onTextChange,
  copied,
  modificationCount,
  hasApiKey
}: ElementPanelProps) {
  const { computedStyles: cs } = element

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // On new element: collapse all, then open groups with modifications
  useEffect(() => {
    const state: Record<string, boolean> = {}
    for (const group of STYLE_GROUPS) {
      const hasModified = group.keys.some((k) => modifiedStyles[k] !== undefined)
      state[group.label] = !hasModified
    }
    state['Text Content'] = true
    setCollapsed(state)
  }, [element])

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <div className="element-panel">
      {STYLE_GROUPS.map((group) => {
        // Build set of children that belong to shorthands in this group
        const groupChildSet = new Set<string>(
          group.keys.flatMap((k) => SHORTHAND_MAP[k as StyleKey] ?? [])
        )

        const visibleKeys = group.keys.filter((key) => {
          // Skip children of shorthands — they render inside their parent
          if (groupChildSet.has(key)) return false

          // For shorthand keys, show if shorthand or any child is non-noise/modified
          const children = SHORTHAND_MAP[key as StyleKey]
          if (children) {
            if (modifiedStyles[key] !== undefined) return true
            if (!isNoiseValue(cs[key] ?? '')) return true
            return children.some(
              (ck) => modifiedStyles[ck] !== undefined || !isNoiseValue(cs[ck] ?? '')
            )
          }

          if (modifiedStyles[key] !== undefined) return true
          const val = cs[key] ?? ''
          return !isNoiseValue(val)
        })

        if (visibleKeys.length === 0) return null

        const isCollapsed = collapsed[group.label] ?? true

        return (
          <div key={group.label} className={`style-group${isCollapsed ? ' style-group--collapsed' : ''}`}>
            <button className="style-group-header" onClick={() => toggleGroup(group.label)}>
              <span className="style-group-label">{group.label}</span>

              <span className={`style-group-chevron${isCollapsed ? '' : ' style-group-chevron--open'}`}>
                <span className="material-symbols-rounded">chevron_right</span>
              </span>
            </button>
            {!isCollapsed && (
              <div className="style-group-body">
                {visibleKeys.map((key) => {
                  const isModified = modifiedStyles[key] !== undefined
                  const displayVal = isModified ? modifiedStyles[key] : (cs[key] ?? '')
                  return (
                    <StyleInput
                      key={key}
                      propKey={key}
                      value={displayVal}
                      isModified={isModified}
                      onCommit={onStyleChange}
                      onRevert={onRevertStyle}
                    />
                  )
                })}
                {hasApiKey && (
                  <AiGroupInput
                    element={element}
                    group={group}
                    currentStyles={
                      Object.fromEntries(
                        group.keys.map((k) => [k, modifiedStyles[k] ?? cs[k] ?? ''])
                      )
                    }
                    onStyleChange={onStyleChange}
                  />
                )}
              </div>
            )}
          </div>
        )
      })}

      {element.textContent && (
        <div className={`style-group${(collapsed['Text Content'] ?? true) ? ' style-group--collapsed' : ''}`}>
          <button className="style-group-header" onClick={() => toggleGroup('Text Content')}>
            <span className="style-group-label">Text Content</span>
            <span className={`style-group-chevron${(collapsed['Text Content'] ?? true) ? '' : ' style-group-chevron--open'}`}>
              <span className="material-symbols-rounded">chevron_right</span>
            </span>
          </button>
          {!(collapsed['Text Content'] ?? true) && (
            <div className="style-group-body">
              <textarea
                className="text-content-edit"
                value={element.textContent ?? ''}
                onChange={(e) => onTextChange(e.target.value)}
                spellCheck={false}
                rows={3}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
