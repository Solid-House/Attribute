const test = require('node:test')
const assert = require('node:assert/strict')

const { isAllowedScheme } = require('../out-test/schemeGuard.js')

test('isAllowedScheme allows http and https', () => {
  assert.equal(isAllowedScheme('http://localhost:3000'), true)
  assert.equal(isAllowedScheme('https://example.com/path?q=1'), true)
  assert.equal(isAllowedScheme('HTTP://EXAMPLE.COM'), true, 'scheme parsing is case-insensitive')
})

test('isAllowedScheme blocks dangerous and non-web schemes', () => {
  assert.equal(isAllowedScheme('file:///etc/passwd'), false)
  assert.equal(isAllowedScheme('javascript:alert(1)'), false)
  assert.equal(isAllowedScheme('data:text/html,<script>1</script>'), false)
  assert.equal(isAllowedScheme('ftp://example.com'), false)
  assert.equal(isAllowedScheme('chrome://settings'), false)
})

test('isAllowedScheme fails closed on unparseable input', () => {
  assert.equal(isAllowedScheme('not a url'), false)
  assert.equal(isAllowedScheme(''), false)
  assert.equal(isAllowedScheme('//no-scheme.com'), false)
})
