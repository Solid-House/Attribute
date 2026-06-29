const test = require('node:test')
const assert = require('node:assert/strict')

const { parsePopupSize } = require('../out-test/main/popupSize.js')

test('parsePopupSize clamps absurdly large requests to 2000', () => {
  assert.deepEqual(parsePopupSize('width=999999,height=999999'), { width: 2000, height: 2000 })
})

test('parsePopupSize clamps undersized requests up to 200', () => {
  assert.deepEqual(parsePopupSize('width=10,height=10'), { width: 200, height: 200 })
})

test('parsePopupSize falls back to defaults when features are missing', () => {
  assert.deepEqual(parsePopupSize(''), { width: 500, height: 600 })
})

test('parsePopupSize passes in-range values through unchanged', () => {
  assert.deepEqual(parsePopupSize('width=800,height=640'), { width: 800, height: 640 })
})

test('parsePopupSize clamps one dimension while passing the other', () => {
  assert.deepEqual(parsePopupSize('width=999999,height=700'), { width: 2000, height: 700 })
})
