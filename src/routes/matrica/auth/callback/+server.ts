import { MatricaOAuthClient } from '@matrica/oauth-sdk';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sessionStore } from '$lib/sessionStore';

export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get('code');
  const sessionId = url.searchParams.get('state');

  if (!code || !sessionId) {
    return new Response(`
      <html><body>
        <h1>OAuth Error</h1>
        <p>Missing <code>code</code> or <code>sessionId</code>.</p>
        <p><strong>code:</strong> ${code ?? 'null'}</p>
        <p><strong>sessionId:</strong> ${sessionId ?? 'null'}</p>
      </body></html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 400
    });
  }

  const sessionData = sessionStore.get(sessionId);
  const codeVerifier = sessionData && (sessionData as any).codeVerifier;

  if (!codeVerifier) {
    return new Response(`
      <html><body>
        <h1>OAuth Error</h1>
        <p><strong>codeVerifier</strong> not found in sessionStore.</p>
        <pre>sessionId: ${sessionId}</pre>
        <pre>sessionData: ${JSON.stringify(sessionData)}</pre>
      </body></html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 400
    });
  }

  const client = new MatricaOAuthClient({
    clientId:     env.MATRICA_CLIENT_ID,
    clientSecret: env.MATRICA_CLIENT_SECRET,
    redirectUri:  'https://solciety-auth.vercel.app/matrica/auth/callback'
  });

  try {
    const session = await client.createSession(code, codeVerifier);
    const tokens = session["tokens"]; // <- Matrica requires bracket access

    const accessToken = tokens.access_token;
    const expiresIn = tokens.expires_in ?? 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    sessionStore.set(sessionId, {
      accessToken,
      expiresAt
    });

    console.log('[MatricaCallback] Token stored for session:', sessionId);

    return new Response(`
      <html><body>
        <h1>Authentication successful</h1>
        <p>You may now return to the game and close this tab.</p>
        <script>window.close();</script>
      </body></html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (err) {
    console.error('[MatricaCallback] Session creation failed:', err);
    return new Response(`
      <html><body>
        <h1>Authentication failed</h1>
        <p>${String(err)}</p>
      </body></html>
    `, {
      headers: { 'Content-Type': 'text/html' },
      status: 500
    });
  }
};
