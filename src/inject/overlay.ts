// Self-contained IIFE injected into target page via CDP Runtime.evaluate
// No imports — runs in page context

;(function () {
  if ((window as any).__ATTRIBUTE_INSPECT__) return
  ;(window as any).__ATTRIBUTE_INSPECT__ = true

  // ── State ──
  let inspectActive = false
  let enabled = true
  let currentEl: Element | null = null
  let selectedEl: Element | null = null

  // ── Overlay root ──
  const root = document.createElement('div')
  root.id = '__attribute-overlay__'
  root.style.cssText =
    'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483647;'
  document.documentElement.appendChild(root)

  // ── Highlight layer ──
  const highlight = document.createElement('div')
  highlight.style.cssText =
    'position:absolute;pointer-events:none;border-radius:2px;transition:opacity 0.1s;opacity:0;'
  root.appendChild(highlight)

  // ── Tooltip ──
  const tooltip = document.createElement('div')
  tooltip.style.cssText =
    'position:absolute;background:#1a1a2e;color:#fff;font:11px/1.4 SFMono-Regular,Menlo,monospace;' +
    'padding:4px 8px;border-radius:4px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 0.1s;'
  root.appendChild(tooltip)

  function updateHighlight(el: Element): void {
    const rect = el.getBoundingClientRect()
    const isSelected = el === selectedEl

    highlight.style.left = rect.left + 'px'
    highlight.style.top = rect.top + 'px'
    highlight.style.width = Math.max(0, rect.width) + 'px'
    highlight.style.height = Math.max(0, rect.height) + 'px'
    highlight.style.opacity = '1'

    if (isSelected) {
      // Selected: blue outline + white inset outline for contrast
      highlight.style.background = 'transparent'
      highlight.style.outline = '2px solid #6366f1'
      highlight.style.outlineOffset = '0px'
      highlight.style.boxShadow = 'inset 0 0 0 2px #fff'
    } else {
      // Hover: solid blue fill
      highlight.style.background = 'rgba(99,102,241,0.25)'
      highlight.style.outline = 'none'
      highlight.style.boxShadow = 'none'
    }

    // Tooltip
    tooltip.textContent = `${Math.round(rect.width)}×${Math.round(rect.height)}`

    const tw = tooltip.offsetWidth
    let tx = rect.left + (rect.width - tw) / 2
    if (tx < 4) tx = 4
    let ty = rect.top - 28
    if (ty < 4) ty = rect.bottom + 4
    tooltip.style.left = tx + 'px'
    tooltip.style.top = ty + 'px'
    tooltip.style.opacity = '1'
  }

  function hideHighlight(): void {
    highlight.style.opacity = '0'
    highlight.style.width = '0'
    highlight.style.height = '0'
    tooltip.style.opacity = '0'
  }

  // ── Style keys (must match STYLE_KEYS in types.ts) ──

  const styleKeys = [
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
    'width',
    'minWidth',
    'maxWidth',
    'height',
    'minHeight',
    'maxHeight',
    'overflow',
    'overflowX',
    'overflowY',
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
    'color',
    'backgroundColor',
    'backgroundImage',
    'backgroundSize',
    'backgroundPosition',
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

  // ── Extract element data ──

  function extractData(el: Element): string {
    const rect = el.getBoundingClientRect()
    const cs = getComputedStyle(el)

    const computedStyles: Record<string, string> = {}
    for (const k of styleKeys) {
      computedStyles[k] = cs.getPropertyValue(
        // camelCase → kebab-case
        k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
      )
    }

    const attributes: Record<string, string> = {}
    for (const attr of Array.from(el.attributes)) {
      attributes[attr.name] = attr.value
    }

    let textContent: string | null = null
    if (el.childNodes.length > 0) {
      const text = el.textContent?.trim() ?? null
      if (text) textContent = text.slice(0, 200)
    }

    // Walk up parent chain for DOM context (up to 3 ancestors)
    const parentChain: Array<{ tagName: string; id: string | null; classList: string[] }> = []
    let ancestor = el.parentElement
    for (let i = 0; i < 3 && ancestor && ancestor !== document.documentElement; i++) {
      parentChain.push({
        tagName: ancestor.tagName.toLowerCase(),
        id: ancestor.id || null,
        classList: Array.from(ancestor.classList)
      })
      ancestor = ancestor.parentElement
    }

    return JSON.stringify({
      tagName: el.tagName.toLowerCase(),
      id: el.id || null,
      classList: Array.from(el.classList),
      parentChain,
      boundingRect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height)
      },
      computedStyles,
      attributes,
      textContent
    })
  }

  // ── Style setter (called from renderer via CDP) ──

  ;(window as any).__attributeSetStyle__ = function (prop: string, value: string): string {
    if (!selectedEl || !('style' in selectedEl)) return 'no-element'
    const kebab = prop.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
    ;(selectedEl as HTMLElement).style.setProperty(kebab, value, 'important')
    // Refresh highlight — element size/position may have changed
    updateHighlight(selectedEl)
    return 'ok'
  }

  // ── Select parent (called from renderer via CDP) ──

  ;(window as any).__attributeSelectParent__ = function (): string {
    if (!selectedEl || !selectedEl.parentElement || selectedEl.parentElement === document.documentElement) {
      return ''
    }
    const parent = selectedEl.parentElement
    selectedEl = parent
    currentEl = parent
    navParent = null
    navIndex = 0
    updateHighlight(parent)
    return extractData(parent)
  }

  // ── Select child (called from renderer via CDP) ──
  // Tracks the parent whose children we're cycling through
  let navParent: Element | null = null
  let navIndex = 0

  ;(window as any).__attributeSelectChild__ = function (): string {
    if (!selectedEl) return ''

    // If we're already cycling at a level, advance to next sibling
    if (navParent && selectedEl.parentElement === navParent) {
      const siblings = Array.from(navParent.children).filter(
        (c) => c !== root && !root.contains(c)
      )
      if (siblings.length === 0) return ''
      if (navIndex >= siblings.length) navIndex = 0
      const sibling = siblings[navIndex]
      navIndex++
      selectedEl = sibling
      currentEl = sibling
      updateHighlight(sibling)
      return extractData(sibling)
    }

    // Otherwise, enter children of current element
    const children = Array.from(selectedEl.children).filter(
      (c) => c !== root && !root.contains(c)
    )
    if (children.length === 0) return ''
    navParent = selectedEl
    navIndex = 1
    const child = children[0]
    selectedEl = child
    currentEl = child
    updateHighlight(child)
    return extractData(child)
  }

  // Reset child index when selection changes via click
  // ── Text setter (called from renderer via CDP) ──

  ;(window as any).__attributeSetText__ = function (text: string): string {
    if (!selectedEl || !('textContent' in selectedEl)) return 'no-element'
    ;(selectedEl as HTMLElement).textContent = text
    return 'ok'
  }

  // ── Event handlers ──

  function onMouseMove(e: MouseEvent): void {
    if (!inspectActive || !enabled) return
    if (selectedEl) return // highlight locked to selected element
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el === root || root.contains(el)) return
    if (el === currentEl) return
    currentEl = el
    updateHighlight(el)
  }

  function onMouseDown(e: MouseEvent): void {
    if (!inspectActive || !enabled) return
    const el = document.elementFromPoint(e.clientX, e.clientY)
    if (!el || el === root || root.contains(el)) return

    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()

    selectedEl = el
    navParent = null
    navIndex = 0
    updateHighlight(el)

    const data = extractData(el)
    ;(window as any).__attributeSelect__(data)
  }

  function onClick(e: MouseEvent): void {
    if (!inspectActive || !enabled) return
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Meta' || e.key === 'Control') {
      enabled = false
      root.style.display = 'none'
      hideHighlight()
    }
  }

  function onKeyUp(e: KeyboardEvent): void {
    if (e.key === 'Meta' || e.key === 'Control') {
      enabled = true
      root.style.display = ''
      if (selectedEl) {
        updateHighlight(selectedEl)
      }
    }
  }

  function onBlur(): void {
    // Handle Meta/Ctrl held during window switch
    enabled = true
    root.style.display = ''
    currentEl = null
    hideHighlight()
  }

  function onScroll(): void {
    if (selectedEl) {
      updateHighlight(selectedEl)
    } else if (currentEl && enabled) {
      updateHighlight(currentEl)
    }
  }

  function onResize(): void {
    if (selectedEl) {
      updateHighlight(selectedEl)
    } else if (currentEl && enabled) {
      updateHighlight(currentEl)
    }
  }

  // ── Attach listeners ──

  function attachListeners(): void {
    document.addEventListener('mousemove', onMouseMove, true)
    document.addEventListener('mousedown', onMouseDown, true)
    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', onBlur)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
  }

  function detachListeners(): void {
    document.removeEventListener('mousemove', onMouseMove, true)
    document.removeEventListener('mousedown', onMouseDown, true)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('keydown', onKeyDown, true)
    document.removeEventListener('keyup', onKeyUp, true)
    window.removeEventListener('blur', onBlur)
    window.removeEventListener('scroll', onScroll, true)
    window.removeEventListener('resize', onResize)
  }

  // Always attach listeners — inspectActive flag controls behavior
  attachListeners()

  ;(window as any).__attributeEnableInspect__ = function (): void {
    inspectActive = true
    root.style.display = ''
  }

  ;(window as any).__attributeDisableInspect__ = function (): void {
    inspectActive = false
    hideHighlight()
    selectedEl = null
    currentEl = null
    root.style.display = 'none'
  }

  // ── Cleanup function ──

  ;(window as any).__attributeHideSelection__ = function (): void {
    enabled = false
    root.style.display = 'none'
    hideHighlight()
  }

  ;(window as any).__attributeShowSelection__ = function (): void {
    enabled = true
    root.style.display = ''
    if (selectedEl) {
      updateHighlight(selectedEl)
    }
  }

  ;(window as any).__attributeCleanup__ = function (): void {
    detachListeners()
    root.remove()
    delete (window as any).__ATTRIBUTE_INSPECT__
    delete (window as any).__attributeCleanup__
    delete (window as any).__attributeSelect__
    delete (window as any).__attributeSetStyle__
    delete (window as any).__attributeSetText__
    delete (window as any).__attributeSelectParent__
    delete (window as any).__attributeSelectChild__
    delete (window as any).__attributeEnableInspect__
    delete (window as any).__attributeDisableInspect__
    delete (window as any).__attributeHideSelection__
    delete (window as any).__attributeShowSelection__
  }
})()
