import { MatricaOAuthClient } from '@matrica/oauth-sdk';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sessionStore } from '$lib/sessionStore';

export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get('code');
  const sessionId = url.searchParams.get('sessionId');

  if (!code || !sessionId) {
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h2>Missing required query params</h2>
        <p><strong>code:</strong> ${code ?? 'null'}</p>
        <p><strong>sessionId:</strong> ${sessionId ?? 'null'}</p>
      </body></html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html' }, status: 400 });
  }

  const sessionData = sessionStore.get(sessionId);
  const codeVerifier = sessionData && (sessionData as any).codeVerifier;

  if (!codeVerifier) {
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h2>Session data missing or invalid</h2>
        <p><strong>sessionId:</strong> ${sessionId}</p>
        <p><strong>codeVerifier:</strong> ${codeVerifier ?? 'null'}</p>
        <p><strong>sessionData:</strong> ${JSON.stringify(sessionData)}</p>
      </body></html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html' }, status: 400 });
  }

  const client = new MatricaOAuthClient({
    clientId:     env.MATRICA_CLIENT_ID,
    clientSecret: env.MATRICA_CLIENT_SECRET,
    redirectUri:  'https://solciety-auth.vercel.app/matrica/auth/callback'
  });

  try {
    const session = await client.createSession(code, codeVerifier);
    const tokens = session.tokens;

    const accessToken = tokens.access_token;
    const expiresIn = tokens.expires_in ?? 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    sessionStore.set(sessionId, {
      accessToken,
      expiresAt
    });

    console.log('[MatricaCallback] Token stored for session:', sessionId);

    const html = `
      <!DOCTYPE html>
      <html><body>
        <script>
          window.opener?.postMessage('oauth_success', window.location.origin);
          window.close();
        </script>
      </body></html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (err) {
    console.error('[MatricaCallback] Session creation failed:', err);
    const html = `
      <!DOCTYPE html>
      <html><body>
        <h2>Session creation failed</h2>
        <p><strong>Error:</strong> ${String(err)}</p>
      </body></html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
};
