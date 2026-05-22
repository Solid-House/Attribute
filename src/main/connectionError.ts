export function buildConnectionErrorPage(host: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Connection Failed — Attribute</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: #0e0e0e;
    color: #d4d4d4;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    padding: 24px;
  }
  .icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
  h1 { font-size: 20px; font-weight: 500; margin-bottom: 8px; color: #d4d4d4; }
  p { font-size: 14px; color: #888; max-width: 400px; line-height: 1.6; }
  code {
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 6px;
    padding: 2px 8px;
    font-size: 13px;
    color: #c0c0c0;
  }
  .cmd {
    background: #1e1e1e;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    padding: 12px 20px;
    margin-top: 16px;
    font-family: 'SF Mono', Menlo, 'Courier New', monospace;
    font-size: 13px;
    color: #c0c0c0;
  }
</style>
</head>
<body>
  <div class="icon">⚠</div>
  <h1>${host} is not responding</h1>
  <p>Make sure the dev server is running.<br>The address might be wrong, or the site could be temporarily unavailable.</p>
  <div class="cmd">npx serve .</div>
</body>
</html>`
}
