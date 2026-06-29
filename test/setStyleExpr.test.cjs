const test = require('node:test')
const assert = require('node:assert/strict')

const { setStyleExpression } = require('../out-test/renderer/src/lib/cdpExpressions.js')

test('setStyleExpression builds the JSON-escaped binding call', () => {
  assert.equal(
    setStyleExpression('color', 'red'),
    'window.__attributeSetStyle__("color", "red")'
  )
})

test('setStyleExpression handles an empty value (revert/reset case)', () => {
  assert.equal(
    setStyleExpression('margin', ''),
    'window.__attributeSetStyle__("margin", "")'
  )
})

test('setStyleExpression escapes quotes and special characters in the value', () => {
  assert.equal(
    setStyleExpression('content', '"hi"\n'),
    'window.__attributeSetStyle__("content", "\\"hi\\"\\n")'
  )
})
