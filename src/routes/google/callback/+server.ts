import { env } from "$env/dynamic/private";
import type { RequestHandler } from '@sveltejs/kit';
import { google } from 'googleapis';

const sessionStore = new Map<string, { status: string; accessToken?: string; expiresAt?: number }>();

export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get('code');
  const sessionId = url.searchParams.get('state');

  console.log("[OAuth Callback] Received:", { code, sessionId });

  if (!code || !sessionId) {
    const html = `
      <html><body>
        <h1>OAuth Error</h1>
        <p><strong>Missing code or session ID.</strong></p>
        <pre>code = ${code}</pre>
        <pre>sessionId = ${sessionId}</pre>
      </body></html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html' }, status: 400 });
  }

  const oAuth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    'https://solciety-auth.vercel.app/google/callback'
  );

  try {
    const { tokens } = await oAuth2Client.getToken(code);

    sessionStore.set(sessionId, {
      status: 'authenticated',
      accessToken: tokens.access_token ?? undefined,
      expiresAt: tokens.expiry_date ?? Date.now() + 3600 * 1000
    });

    const html = `
      <html><body>
        <h1>Authentication successful</h1>
        <p>You may now return to the game and close this tab.</p>
        <pre><strong>Session ID:</strong> ${sessionId}</pre>
        <pre><strong>Access Token:</strong> ${tokens.access_token}</pre>
        <pre><strong>Expires At:</strong> ${tokens.expiry_date}</pre>
        <pre><strong>Raw Tokens:</strong> ${JSON.stringify(tokens, null, 2)}</pre>
        <script>window.close();</script>
      </body></html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (err: any) {
    console.error(`[OAuth Callback] Token exchange failed for session ${sessionId}:`, err);

    const html = `
      <html><body>
        <h1>OAuth Failed</h1>
        <p>Something went wrong during authentication.</p>
        <pre><strong>Session ID:</strong> ${sessionId}</pre>
        <pre><strong>Code:</strong> ${code}</pre>
        <pre><strong>Error:</strong> ${err?.message || 'Unknown error'}</pre>
        <pre><strong>Raw:</strong> ${JSON.stringify(err, Object.getOwnPropertyNames(err), 2)}</pre>
      </body></html>
    `;
    return new Response(html, { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
};
