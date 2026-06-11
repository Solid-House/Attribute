const test = require('node:test')
const assert = require('node:assert/strict')

const { sanitizeElementData } = require('../out-test/elementData.js')

// A well-formed payload mirroring what the overlay's extractData produces.
function legitPayload() {
  return {
    tagName: 'div',
    id: 'hero',
    classList: ['card', 'card--featured'],
    parentChain: [
      { tagName: 'section', id: 'main', classList: ['wrap'] },
      { tagName: 'body', id: null, classList: [] }
    ],
    boundingRect: { x: 10, y: 20, w: 300, h: 150 },
    computedStyles: { color: 'rgb(0, 0, 0)', display: 'flex' },
    attributes: { 'data-test': 'x', role: 'button' },
    textContent: 'Hello world'
  }
}

test('sanitizeElementData passes a legitimate overlay payload through unchanged', () => {
  const input = legitPayload()
  const out = sanitizeElementData(input)
  assert.deepEqual(out, input, 'legitimate payload should be preserved exactly')
})

test('sanitizeElementData drops payloads that are not objects', () => {
  for (const bad of [null, undefined, 42, 'div', true, ['div'], NaN]) {
    assert.equal(sanitizeElementData(bad), null, `should drop ${String(bad)}`)
  }
})

test('sanitizeElementData drops payloads with a missing or non-string tagName', () => {
  assert.equal(sanitizeElementData({ id: 'x' }), null, 'missing tagName → drop')
  assert.equal(sanitizeElementData({ tagName: 123 }), null, 'numeric tagName → drop')
  assert.equal(sanitizeElementData({ tagName: null }), null, 'null tagName → drop')
})

test('sanitizeElementData strips unexpected fields', () => {
  const out = sanitizeElementData({
    tagName: 'span',
    evil: '<img onerror=alert(1)>',
    __proto__hack: true,
    onclick: 'doBadThings()'
  })
  assert.ok(out)
  assert.deepEqual(Object.keys(out).sort(), [
    'attributes',
    'boundingRect',
    'classList',
    'computedStyles',
    'id',
    'parentChain',
    'tagName',
    'textContent'
  ])
  assert.equal('evil' in out, false)
  assert.equal('onclick' in out, false)
})

test('sanitizeElementData coerces missing optional fields to safe defaults', () => {
  const out = sanitizeElementData({ tagName: 'p' })
  assert.ok(out)
  assert.equal(out.id, null)
  assert.deepEqual(out.classList, [])
  assert.deepEqual(out.parentChain, [])
  assert.deepEqual(out.boundingRect, { x: 0, y: 0, w: 0, h: 0 })
  assert.deepEqual(out.computedStyles, {})
  assert.deepEqual(out.attributes, {})
  assert.equal(out.textContent, null)
})

test('sanitizeElementData type-checks each field, dropping wrong-typed entries', () => {
  const out = sanitizeElementData({
    tagName: 'div',
    id: 99, // non-string → null
    classList: ['ok', 123, { bad: 1 }, 'also-ok'], // non-strings dropped
    boundingRect: { x: 1, y: 2, w: 'wide', h: 4 }, // non-numeric → default rect
    computedStyles: { color: 'red', size: 42 }, // non-string value dropped
    attributes: 'not-an-object', // wrong type → empty record
    textContent: { not: 'a string' } // wrong type → null
  })
  assert.ok(out)
  assert.equal(out.id, null)
  assert.deepEqual(out.classList, ['ok', 'also-ok'])
  assert.deepEqual(out.boundingRect, { x: 0, y: 0, w: 0, h: 0 })
  assert.deepEqual(out.computedStyles, { color: 'red' })
  assert.deepEqual(out.attributes, {})
  assert.equal(out.textContent, null)
})

test('sanitizeElementData rejects non-finite numbers in boundingRect', () => {
  const out = sanitizeElementData({
    tagName: 'div',
    boundingRect: { x: Infinity, y: 0, w: 1, h: 1 }
  })
  assert.ok(out)
  assert.deepEqual(out.boundingRect, { x: 0, y: 0, w: 0, h: 0 })
})

test('sanitizeElementData caps textContent at 200 chars', () => {
  const long = 'a'.repeat(5000)
  const out = sanitizeElementData({ tagName: 'div', textContent: long })
  assert.ok(out)
  assert.equal(out.textContent.length, 200)
})

test('sanitizeElementData caps oversized strings, class lists, parent chain, and records', () => {
  const out = sanitizeElementData({
    tagName: 'x'.repeat(5000),
    classList: Array.from({ length: 500 }, (_, i) => `c${i}`),
    parentChain: Array.from({ length: 50 }, () => ({ tagName: 'div', id: null, classList: [] })),
    computedStyles: Object.fromEntries(Array.from({ length: 2000 }, (_, i) => [`k${i}`, 'v']))
  })
  assert.ok(out)
  assert.equal(out.tagName.length, 1000, 'tagName capped to MAX_STRING')
  assert.equal(out.classList.length, 100, 'classList capped to MAX_CLASS_LIST')
  assert.equal(out.parentChain.length, 3, 'parentChain capped to MAX_PARENT_CHAIN')
  assert.equal(Object.keys(out.computedStyles).length, 500, 'record capped to MAX_RECORD_ENTRIES')
})

test('sanitizeElementData shapes parentChain entries and drops malformed ancestors', () => {
  const out = sanitizeElementData({
    tagName: 'div',
    parentChain: [
      { tagName: 'section', id: 'a', classList: ['w'], extra: 'drop-me' },
      { id: 'no-tag' }, // missing tagName → dropped
      'not-an-object', // → dropped
      { tagName: 'body', id: null, classList: [] }
    ]
  })
  assert.ok(out)
  assert.deepEqual(out.parentChain, [
    { tagName: 'section', id: 'a', classList: ['w'] },
    { tagName: 'body', id: null, classList: [] }
  ])
})
