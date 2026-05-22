const test = require('node:test')
const assert = require('node:assert/strict')

const { buildConnectionErrorPage } = require('../out-test/connectionError.js')

test('buildConnectionErrorPage returns a complete HTML document', () => {
  const page = buildConnectionErrorPage('localhost')
  assert.ok(page.startsWith('<!DOCTYPE html>'), 'should be a valid HTML document')
  assert.ok(page.includes('<html lang="en">'), 'should have lang attribute')
  assert.ok(page.includes('</html>'), 'should close html tag')
  assert.ok(page.includes('</head>'), 'should have head tag')
  assert.ok(page.includes('</body>'), 'should have body tag')
})

test('buildConnectionErrorPage reflects the host in the title and heading', () => {
  const page = buildConnectionErrorPage('my-site.local')
  assert.ok(page.includes('<title>Connection Failed — Attribute</title>'), 'title should be set')
  assert.ok(page.includes('<h1>my-site.local is not responding</h1>'), 'h1 should contain the host')
})

test('buildConnectionErrorPage includes the dev server hint', () => {
  const page = buildConnectionErrorPage('localhost')
  assert.ok(page.includes('npx serve .'), 'should show the serve command')
  assert.ok(page.includes('Make sure the dev server is running'), 'should explain the issue')
})

test('buildConnectionErrorPage uses the dark theme background', () => {
  const page = buildConnectionErrorPage('localhost')
  assert.ok(page.includes('background: #0e0e0e'), 'should use dark background color')
})

test('buildConnectionErrorPage produces a decodable data:text/html URL', () => {
  const host = '127.0.0.1'
  const page = buildConnectionErrorPage(host)
  const encoded = encodeURIComponent(page)
  const dataUrl = `data:text/html;charset=utf-8,${encoded}`
  assert.ok(dataUrl.startsWith('data:text/html;charset=utf-8,'), 'should be a valid data URL prefix')
  const decoded = decodeURIComponent(dataUrl.split(',')[1])
  assert.equal(decoded, page, 'should decode back to the original HTML')
})

test('buildConnectionErrorPage works with arbitrary hosts', () => {
  const hosts = ['192.168.1.1:8080', 'dev.myapp.local', 'example.com']
  for (const host of hosts) {
    const page = buildConnectionErrorPage(host)
    assert.ok(page.includes(`<h1>${host} is not responding</h1>`), `h1 should contain host: ${host}`)
  }
})

test.afterEach(() => {
  delete global.fetch
})
