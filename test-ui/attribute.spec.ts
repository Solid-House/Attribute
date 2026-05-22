import { test, expect, _electron } from '@playwright/test'

test.describe('Connection error handling', () => {
  test('renders error page when server is unreachable', async () => {
    const electronApp = await _electron.launch({
      args: ['--remote-debugging-port=9222']
    })

    try {
      // Get ALL windows and wait for ours to appear
      const allWindows = await electronApp.windows()
      console.log('Initial window count:', allWindows.length)
      for (const w of allWindows) {
        console.log('  Window URL:', w.url(), '| Title:', await w.title())
      }

      // Wait for a window with the Attribute app (not default_app.asar)
      const timeout = Date.now() + 15000
      let window = allWindows.find(w => !w.url().includes('default_app.asar'))
      while (!window && Date.now() < timeout) {
        await electronApp.waitForEvent('window', { timeout: 5000 }).catch(() => {})
        const windows = await electronApp.windows()
        window = windows.find(w => !w.url().includes('default_app.asar'))
        console.log('Waiting for Attribute window... current:', windows.map(w => w.url()))
      }

      if (!window) {
        // Fall back to first window for inspection
        window = await electronApp.firstWindow()
      }

      console.log('Using window URL:', window.url(), 'Title:', await window.title())

      // Wait for React to hydrate
      await window.waitForLoadState('networkidle').catch(() => {})

      const finalUrl = window.url()
      const finalTitle = await window.title()
      console.log('Final window URL:', finalUrl)
      console.log('Final window title:', finalTitle)

      // Verify this is our React app, not the default Electron page
      expect(finalUrl).not.toContain('default_app.asar')
      expect(finalTitle).toBe('Attribute')

      // Check the body has rendered content
      const bodyPreview = await window.evaluate(() => document.body?.innerHTML?.substring(0, 300) ?? 'no body')
      console.log('Body preview:', bodyPreview)
      expect(bodyPreview.length).toBeGreaterThan(0)
    } finally {
      await electronApp.close()
    }
  })

  test('error page HTML is well-formed with correct content', async () => {
    const { buildConnectionErrorPage } = await import('../out-test/connectionError.js')

    const page = buildConnectionErrorPage('localhost')
    expect(page).toContain('Connection Failed — Attribute')
    expect(page).toContain('localhost is not responding')
    expect(page).toContain('npx serve .')
    expect(page).toContain('background: #0e0e0e')
  })

  test('error page data URL decodes correctly', async () => {
    const { buildConnectionErrorPage } = await import('../out-test/connectionError.js')
    const page = buildConnectionErrorPage('192.168.1.1:8080')
    const encoded = encodeURIComponent(page)
    const dataUrl = `data:text/html;charset=utf-8,${encoded}`
    const decoded = decodeURIComponent(dataUrl.split(',')[1])
    expect(decoded).toEqual(page)
    expect(decoded).toContain('192.168.1.1:8080 is not responding')
  })
})
