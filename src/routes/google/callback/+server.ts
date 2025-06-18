import { env } from "$env/dynamic/private";
import { sessionStore } from '$lib/sessionStore';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const code = url.searchParams.get('code');
    const sessionId =  url.searchParams.get('state');

    if (!code || !sessionId) {
      return new Response(`
        <html><body>
          <h1>OAuth Error</h1>
          <p>Missing code or session ID.</p>
        </body></html>
      `, { headers: { 'Content-Type': 'text/html' }, status: 400 });
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code: code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: "https://solciety-auth.vercel.app/google/callback",
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      throw new Error(tokenData.error_description || "OAuth token exchange failed.");
    }

    console.log("Setting session in store: " + sessionId + " with token: " + tokenData.access_token + " and expires in: " + tokenData.expires_in);

    sessionStore.set(sessionId, {
        accessToken: tokenData.access_token,
        expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000
      });

    return new Response(`
      <html><body>
        <h1>Authentication successful</h1>
        <p>You may now return to the game and close this tab.</p>
        <script>window.close();</script>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (err: any) {
    return new Response(`
      <html><body>
        <h1>Authentication failed</h1>
        <p>${err?.message || 'Unknown error occurred.'}</p>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
};
