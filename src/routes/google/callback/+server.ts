import { env } from "$env/dynamic/private";
import type { RequestHandler } from '@sveltejs/kit';
import { google } from 'googleapis';

const sessionStore = new Map<string, { status: string; accessToken?: string; expiresAt?: number }>();

export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get('code');
  const sessionId = url.searchParams.get('state');
  console.log("Session ID:", sessionId);

  if (!code || !sessionId) {
    return new Response('Missing code or session ID', { status: 400 });
  }

  const oAuth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    'https://solciety-auth.vercel.app/google/callback'
  );

  try {
    const { tokens } = await oAuth2Client.getToken(code);

    console.log(`[OAuth] Success for session ${sessionId}`);
    console.log("Tokens:", tokens);

    // store token in in-memory session store
    sessionStore.set(sessionId, {
      status: 'authenticated',
      accessToken: tokens.access_token || undefined,
      expiresAt: tokens.expiry_date || Date.now() + 3600 * 1000
    });

    // simple response page (can be improved later)
    const html = `
      <!DOCTYPE html>
      <html><body>
        <p>Login successful. You may close this tab and return to the game.</p>
        <script>
          window.close();
        </script>
      </body></html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (err) {
    console.error(`[OAuth] Token exchange failed for session ${sessionId}`, err);
    return new Response('OAuth failed', { status: 500 });
  }
};
