// ── Style property keys (source of truth) ──

export const STYLE_KEYS = [
  // Layout
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'float',
  'clear',
  'zIndex',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'alignContent',
  'alignSelf',
  'order',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'gap',
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridColumn',
  'gridRow',
  // Sizing
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'overflow',
  'overflowX',
  'overflowY',
  // Spacing
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  // Typography
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'textDecoration',
  'textTransform',
  'whiteSpace',
  'wordBreak',
  // Color & Background
  'color',
  'backgroundColor',
  'backgroundImage',
  'backgroundSize',
  'backgroundPosition',
  // Border
  'border',
  'borderTop',
  'borderRight',
  'borderBottom',
  'borderLeft',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
  'outline',
  // Effects
  'opacity',
  'boxShadow',
  'textShadow',
  'transform',
  'transition',
  'cursor',
  'pointerEvents',
  'visibility',
  'filter',
  'backdropFilter',
  'mixBlendMode'
] as const

export type StyleKey = (typeof STYLE_KEYS)[number]

// ── Style groups for panel display ──

export interface StyleGroup {
  label: string
  keys: StyleKey[]
}

export const STYLE_GROUPS: StyleGroup[] = [
  {
    label: 'Layout',
    keys: [
      'display',
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'float',
      'clear',
      'zIndex',
      'flexDirection',
      'flexWrap',
      'justifyContent',
      'alignItems',
      'alignContent',
      'alignSelf',
      'order',
      'flexGrow',
      'flexShrink',
      'flexBasis',
      'gap',
      'gridTemplateColumns',
      'gridTemplateRows',
      'gridColumn',
      'gridRow'
    ]
  },
  {
    label: 'Sizing',
    keys: ['width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight', 'overflow', 'overflowX', 'overflowY']
  },
  {
    label: 'Spacing',
    keys: [
      'margin',
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
      'padding',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft'
    ]
  },
  {
    label: 'Typography',
    keys: [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'fontStyle',
      'lineHeight',
      'letterSpacing',
      'textAlign',
      'textDecoration',
      'textTransform',
      'whiteSpace',
      'wordBreak'
    ]
  },
  {
    label: 'Color & Background',
    keys: ['color', 'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition']
  },
  {
    label: 'Border',
    keys: [
      'border',
      'borderTop',
      'borderRight',
      'borderBottom',
      'borderLeft',
      'borderRadius',
      'borderTopLeftRadius',
      'borderTopRightRadius',
      'borderBottomRightRadius',
      'borderBottomLeftRadius',
      'outline'
    ]
  },
  {
    label: 'Effects',
    keys: [
      'opacity',
      'boxShadow',
      'textShadow',
      'transform',
      'transition',
      'cursor',
      'pointerEvents',
      'visibility',
      'filter',
      'backdropFilter',
      'mixBlendMode'
    ]
  }
]

// ── Input kind classification ──

const COLOR_KEYS = new Set<string>(['color', 'backgroundColor'])

const NUMERIC_KEYS = new Set<string>([
  'top',
  'right',
  'bottom',
  'left',
  'zIndex',
  'order',
  'flexGrow',
  'flexShrink',
  'width',
  'minWidth',
  'maxWidth',
  'height',
  'minHeight',
  'maxHeight',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
  'opacity',
  'gap'
])

const SELECT_OPTIONS: Record<string, string[]> = {
  display: ['none', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'contents'],
  position: ['static', 'relative', 'absolute', 'fixed', 'sticky'],
  float: ['none', 'left', 'right'],
  clear: ['none', 'left', 'right', 'both'],
  flexDirection: ['row', 'row-reverse', 'column', 'column-reverse'],
  flexWrap: ['nowrap', 'wrap', 'wrap-reverse'],
  justifyContent: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly', 'stretch'],
  alignItems: ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'],
  alignContent: ['stretch', 'flex-start', 'flex-end', 'center', 'space-between', 'space-around'],
  alignSelf: ['auto', 'stretch', 'flex-start', 'flex-end', 'center', 'baseline'],
  overflow: ['visible', 'hidden', 'scroll', 'auto', 'clip'],
  overflowX: ['visible', 'hidden', 'scroll', 'auto', 'clip'],
  overflowY: ['visible', 'hidden', 'scroll', 'auto', 'clip'],
  fontStyle: ['normal', 'italic', 'oblique'],
  fontWeight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  textAlign: ['left', 'center', 'right', 'justify', 'start', 'end'],
  textDecoration: ['none', 'underline', 'overline', 'line-through'],
  textTransform: ['none', 'capitalize', 'uppercase', 'lowercase'],
  whiteSpace: ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces'],
  wordBreak: ['normal', 'break-all', 'keep-all', 'break-word'],
  backgroundSize: ['auto', 'cover', 'contain'],
  backgroundPosition: ['top', 'center', 'bottom', 'left', 'right'],
  cursor: ['auto', 'default', 'pointer', 'text', 'move', 'not-allowed', 'grab', 'grabbing', 'crosshair', 'wait'],
  pointerEvents: ['auto', 'none'],
  visibility: ['visible', 'hidden', 'collapse'],
  mixBlendMode: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion']
}

export function getSelectOptions(key: string): string[] | null {
  return SELECT_OPTIONS[key] ?? null
}

export function getInputKind(key: string): 'color' | 'numeric' | 'select' | 'text' {
  if (COLOR_KEYS.has(key)) return 'color'
  if (SELECT_OPTIONS[key]) return 'select'
  if (NUMERIC_KEYS.has(key)) return 'numeric'
  return 'text'
}

// ── Shorthand property mapping ──

export const SHORTHAND_MAP: Partial<Record<StyleKey, StyleKey[]>> = {
  margin: ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'],
  padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
  border: ['borderTop', 'borderRight', 'borderBottom', 'borderLeft'],
  borderRadius: ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius']
}

export const SHORTHAND_CHILDREN = new Set<string>(
  Object.values(SHORTHAND_MAP).flat()
)

// ── Element data from overlay ──

export interface ElementData {
  tagName: string
  id: string | null
  classList: string[]
  parentChain: Array<{ tagName: string; id: string | null; classList: string[] }>
  boundingRect: { x: number; y: number; w: number; h: number }
  computedStyles: Record<string, string>
  attributes: Record<string, string>
  textContent: string | null
}
