// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // API routes require API key OR authenticated session
  if (url.pathname.startsWith('/api/')) {
    const apiKey = process.env.API_KEY;
    const providedKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
    const authenticated = request.cookies.get('authenticated');

    // Skip auth for public-upload (it requires user's own GitHub token)
    if (url.pathname === '/api/public-upload') {
      return NextResponse.next();
    }

    // Allow if user is authenticated via PIN (browser session)
    if (authenticated?.value === 'true') {
      return NextResponse.next();
    }

    // Otherwise require API key (external API access)
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured on server' }, { status: 500 });
    }

    if (!providedKey || providedKey !== apiKey) {
      return NextResponse.json({ error: 'Invalid or missing API key. Use header: x-api-key or Authorization: Bearer <key>' }, { status: 401 });
    }

    return NextResponse.next();
  }

  // Get PIN from environment variable
  const YOUR_PIN = process.env.PIN;

  if (!YOUR_PIN) {
    return new Response("Error: PIN not configured", { status: 500 });
  }

  // Handle PIN verification
  if (request.method === 'POST' && url.pathname === '/verify-pin') {
    const formData = await request.formData();
    const enteredPin = formData.get('pin');

    if (enteredPin === YOUR_PIN) {
      const response = NextResponse.redirect(new URL('/', request.url), 303);
      response.cookies.set('authenticated', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 86400, // 24 hours
        path: '/'
      });
      return response;
    } else {
      return new Response(getLoginPage('Incorrect PIN. Please try again.'), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }

  // Check authentication
  const authenticated = request.cookies.get('authenticated');

  if (!authenticated || authenticated.value !== 'true') {
    return new Response(getLoginPage(), {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sw.js|workbox-.*\\.js|icons/.*|og/.*).*)'],
};

function getLoginPage(errorMessage = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CloudSnap &bull; Access</title>
  <link rel="icon" href="/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700;800&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Space Grotesk', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      padding: 1.5rem;
    }

    .topbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #0a0a0a;
      border-bottom: 3px solid #FFE500;
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      height: 56px;
      gap: 10px;
    }
    .topbar-logo {
      width: 32px; height: 32px;
      background: #FFE500;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 0.85rem; color: #0a0a0a;
    }
    .topbar-name {
      color: #ffffff;
      font-weight: 800;
      font-size: 1rem;
      letter-spacing: -0.02em;
    }
    .topbar-tag {
      font-family: 'Space Mono', monospace;
      font-size: 0.6rem;
      color: #555;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-left: 4px;
    }

    .card {
      width: 100%;
      max-width: 400px;
      background: #ffffff;
      border: 3px solid #0a0a0a;
      box-shadow: 6px 6px 0 #FFE500;
      margin-top: 72px;
    }

    .card-header {
      background: #FFE500;
      border-bottom: 3px solid #0a0a0a;
      padding: 1.5rem 2rem;
    }

    .access-label {
      font-family: 'Space Mono', monospace;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      opacity: 0.6;
      margin-bottom: 6px;
    }

    .access-title {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.05;
      color: #0a0a0a;
    }

    .card-body { padding: 2rem; }

    label {
      display: block;
      font-family: 'Space Mono', monospace;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 0.625rem;
      color: #777;
    }

    input {
      width: 100%;
      padding: 1rem;
      font-size: 2rem;
      font-family: 'Space Mono', monospace;
      letter-spacing: 0.6em;
      text-align: center;
      background: #F5F0E8;
      border: 3px solid #0a0a0a;
      color: #0a0a0a;
      box-shadow: 3px 3px 0 #0a0a0a;
      outline: none;
      -webkit-text-security: disc;
      transition: box-shadow 0.1s ease, transform 0.1s ease;
      margin-bottom: 1.25rem;
    }

    input:focus {
      box-shadow: 4px 4px 0 #FFE500;
      transform: translate(-1px, -1px);
    }

    input::placeholder {
      color: #ccc;
      letter-spacing: 0.4em;
    }

    button {
      width: 100%;
      padding: 1rem;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.95rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: #0a0a0a;
      color: #FFE500;
      border: 3px solid #0a0a0a;
      box-shadow: 4px 4px 0 #0a0a0a;
      cursor: pointer;
      transition: background 0.1s ease, color 0.1s ease, transform 0.1s ease, box-shadow 0.1s ease;
    }

    button:hover {
      background: #FFE500;
      color: #0a0a0a;
      box-shadow: 6px 6px 0 #0a0a0a;
      transform: translate(-2px, -2px);
    }

    button:active {
      transform: translate(4px, 4px);
      box-shadow: none;
    }

    .error {
      background: #FF3535;
      border: 3px solid #0a0a0a;
      color: #ffffff;
      padding: 0.75rem 1rem;
      font-family: 'Space Mono', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-align: center;
      margin-top: 1rem;
      animation: shake 0.4s ease;
      box-shadow: 3px 3px 0 #0a0a0a;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }

    .footer {
      font-family: 'Space Mono', monospace;
      font-size: 0.6rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #333;
      text-align: center;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="topbar-logo">CS</div>
    <span class="topbar-name">CLOUDSNAP</span>
    <span class="topbar-tag">v2</span>
  </div>

  <div class="card">
    <div class="card-header">
      <p class="access-label">Restricted Area</p>
      <h1 class="access-title">ACCESS<br>REQUIRED</h1>
    </div>
    <div class="card-body">
      <form method="POST" action="/verify-pin">
        <label for="pin">Enter Access PIN</label>
        <input
          type="password"
          name="pin"
          id="pin"
          placeholder="&bull;&bull;&bull;&bull;"
          maxlength="20"
          autofocus
          required
          autocomplete="off"
        />
        <button type="submit">UNLOCK &rarr;</button>
      </form>
      ${errorMessage ? `<div class="error">&#9888; ${errorMessage}</div>` : ''}
    </div>
  </div>

  <p class="footer">CloudSnap &middot; Image &amp; Video Hosting</p>
</body>
</html>`;
}