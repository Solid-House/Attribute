const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

// The main renderer gets a Content-Security-Policy on the dev (http) path via
// session.webRequest.onHeadersReceived. The packaged build loads the renderer
// from file://, which does not receive those response headers, so without a
// <meta http-equiv> tag the shipped app runs with NO CSP. These tests pin the
// meta tag's presence and keep it in sync with the policy in src/main/index.ts.

const rendererHtml = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'renderer', 'index.html'),
  'utf8'
)
const mainIndex = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'main', 'index.ts'),
  'utf8'
)

function mainProcessCsp() {
  const m = mainIndex.match(/const CSP = "([^"]+)"/)
  assert.ok(m, 'could not find the CSP constant in src/main/index.ts')
  return m[1]
}

function rendererMetaCsp() {
  // content is double-quoted so the inner 'self' single quotes are preserved.
  const m = rendererHtml.match(
    /<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"\s*\/?>/i
  )
  return m ? m[1] : null
}

test('packaged renderer ships a Content-Security-Policy meta tag', () => {
  assert.ok(
    rendererMetaCsp(),
    'src/renderer/index.html must include <meta http-equiv="Content-Security-Policy"> so the file:// build is covered'
  )
})

test('renderer meta CSP matches the policy enforced on the dev path', () => {
  assert.equal(
    rendererMetaCsp(),
    mainProcessCsp(),
    'the renderer meta CSP must stay in sync with the CSP constant in src/main/index.ts'
  )
})
