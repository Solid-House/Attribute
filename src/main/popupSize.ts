// Popup size parser for window.open() feature strings.
//
// width/height arrive from the (untrusted) target page's window.open() call.
// We restrict to digits and clamp to sane bounds so a page cannot request an
// absurd popup size (e.g. width=999999) as a UX-disruption vector.

const DEFAULT_WIDTH = 500
const DEFAULT_HEIGHT = 600
const MIN_DIMENSION = 200
const MAX_DIMENSION = 2000

function clampDimension(parsed: number, fallback: number): number {
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, MIN_DIMENSION), MAX_DIMENSION)
}

/**
 * Parse and clamp the width/height from a window.open() features string.
 * Missing values fall back to the defaults (500x600). Out-of-range values are
 * clamped to [200, 2000].
 */
export function parsePopupSize(features: string): { width: number; height: number } {
  const widthMatch = features.match(/width=(\d+)/)?.[1]
  const heightMatch = features.match(/height=(\d+)/)?.[1]
  const width =
    widthMatch === undefined ? DEFAULT_WIDTH : clampDimension(parseInt(widthMatch, 10), DEFAULT_WIDTH)
  const height =
    heightMatch === undefined ? DEFAULT_HEIGHT : clampDimension(parseInt(heightMatch, 10), DEFAULT_HEIGHT)
  return { width, height }
}
