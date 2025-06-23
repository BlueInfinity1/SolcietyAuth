// src/routes/matrica/auth/callback/+server.ts
import { MatricaOAuthClient } from '@matrica/oauth-sdk';
import type { RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { sessionStore } from '$lib/sessionStore';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  const sessionId = cookies.get('matrica_session_id');
  const codeVerifier = cookies.get('matrica_code_verifier');

  if (!code || !sessionId || !codeVerifier)
    return new Response('Missing data', { status: 400 });

  const client = new MatricaOAuthClient({
    clientId:     env.MATRICA_CLIENT_ID,
    clientSecret: env.MATRICA_CLIENT_SECRET,
    redirectUri:  'https://solciety-auth.vercel.app/matrica/auth/callback'
  });

  try {
    const session = await client.createSession(code, codeVerifier);
    const tokens = session["tokens"];

    const accessToken = tokens.access_token;
    const expiresIn = tokens.expires_in ?? 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    sessionStore.set(sessionId, {
      accessToken,
      expiresAt
    });

    console.log('[MatricaCallback] Token stored for session:', sessionId);

    // Optional: clear temp cookies
    cookies.delete('matrica_code_verifier', { path: '/' });
    cookies.delete('matrica_session_id', { path: '/' });

    // Notify parent window and close
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
    return new Response('Auth failed', { status: 500 });
  }
};
