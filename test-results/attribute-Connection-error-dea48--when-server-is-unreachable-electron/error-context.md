# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: attribute.spec.ts >> Connection error handling >> renders error page when server is unreachable
- Location: test-ui/attribute.spec.ts:4:7

# Error details

```
Error: expect(received).not.toContain(expected) // indexOf

Expected substring: not "default_app.asar"
Received string:        "file:///Users/russmatsuo/Desktop/Solid%20House/Attribute/node_modules/electron/dist/Electron.app/Contents/Resources/default_app.asar/index.html"
```

# Test source

```ts
  1  | import { test, expect, _electron } from '@playwright/test'
  2  | 
  3  | test.describe('Connection error handling', () => {
  4  |   test('renders error page when server is unreachable', async () => {
  5  |     const electronApp = await _electron.launch({
  6  |       args: ['--remote-debugging-port=9222']
  7  |     })
  8  | 
  9  |     try {
  10 |       // Get ALL windows and wait for ours to appear
  11 |       const allWindows = await electronApp.windows()
  12 |       console.log('Initial window count:', allWindows.length)
  13 |       for (const w of allWindows) {
  14 |         console.log('  Window URL:', w.url(), '| Title:', await w.title())
  15 |       }
  16 | 
  17 |       // Wait for a window with the Attribute app (not default_app.asar)
  18 |       const timeout = Date.now() + 15000
  19 |       let window = allWindows.find(w => !w.url().includes('default_app.asar'))
  20 |       while (!window && Date.now() < timeout) {
  21 |         await electronApp.waitForEvent('window', { timeout: 5000 }).catch(() => {})
  22 |         const windows = await electronApp.windows()
  23 |         window = windows.find(w => !w.url().includes('default_app.asar'))
  24 |         console.log('Waiting for Attribute window... current:', windows.map(w => w.url()))
  25 |       }
  26 | 
  27 |       if (!window) {
  28 |         // Fall back to first window for inspection
  29 |         window = await electronApp.firstWindow()
  30 |       }
  31 | 
  32 |       console.log('Using window URL:', window.url(), 'Title:', await window.title())
  33 | 
  34 |       // Wait for React to hydrate
  35 |       await window.waitForLoadState('networkidle').catch(() => {})
  36 | 
  37 |       const finalUrl = window.url()
  38 |       const finalTitle = await window.title()
  39 |       console.log('Final window URL:', finalUrl)
  40 |       console.log('Final window title:', finalTitle)
  41 | 
  42 |       // Verify this is our React app, not the default Electron page
> 43 |       expect(finalUrl).not.toContain('default_app.asar')
     |                            ^ Error: expect(received).not.toContain(expected) // indexOf
  44 |       expect(finalTitle).toBe('Attribute')
  45 | 
  46 |       // Check the body has rendered content
  47 |       const bodyPreview = await window.evaluate(() => document.body?.innerHTML?.substring(0, 300) ?? 'no body')
  48 |       console.log('Body preview:', bodyPreview)
  49 |       expect(bodyPreview.length).toBeGreaterThan(0)
  50 |     } finally {
  51 |       await electronApp.close()
  52 |     }
  53 |   })
  54 | 
  55 |   test('error page HTML is well-formed with correct content', async () => {
  56 |     const { buildConnectionErrorPage } = await import('../out-test/connectionError.js')
  57 | 
  58 |     const page = buildConnectionErrorPage('localhost')
  59 |     expect(page).toContain('Connection Failed — Attribute')
  60 |     expect(page).toContain('localhost is not responding')
  61 |     expect(page).toContain('npx serve .')
  62 |     expect(page).toContain('background: #0e0e0e')
  63 |   })
  64 | 
  65 |   test('error page data URL decodes correctly', async () => {
  66 |     const { buildConnectionErrorPage } = await import('../out-test/connectionError.js')
  67 |     const page = buildConnectionErrorPage('192.168.1.1:8080')
  68 |     const encoded = encodeURIComponent(page)
  69 |     const dataUrl = `data:text/html;charset=utf-8,${encoded}`
  70 |     const decoded = decodeURIComponent(dataUrl.split(',')[1])
  71 |     expect(decoded).toEqual(page)
  72 |     expect(decoded).toContain('192.168.1.1:8080 is not responding')
  73 |   })
  74 | })
  75 | 
```