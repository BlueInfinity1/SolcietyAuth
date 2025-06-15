import { env } from "$env/dynamic/private";
import type { RequestHandler } from '@sveltejs/kit';
import { google } from 'googleapis';

export const GET: RequestHandler = async ({ url }) => {
  let debugOutput = "OAuth Callback Phase Log:\n";

  try {
    debugOutput += "Phase A: Reached handler\n";

    const code = url.searchParams.get('code');
    const sessionId = "Mock"; // hardcoded for now

    debugOutput += `Phase B: Parsed query params\ncode: ${code}\nsessionId: ${sessionId}\n`;

    if (!code || !sessionId) {
      debugOutput += "Phase C: Missing code or session ID\n";
      return new Response(`
        <html><body>
          <h1>OAuth Error</h1>
          <pre>${debugOutput}</pre>
        </body></html>
      `, { headers: { 'Content-Type': 'text/html' }, status: 400 });
    }

    debugOutput += "Phase D: Initializing OAuth2 client\n";
    const oAuth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      'https://solciety-auth.vercel.app/google/callback'
    );

    debugOutput += "Phase E: Attempting to exchange code for tokens...\n";
    const { tokens } = await oAuth2Client.getToken(code);

    debugOutput += "Phase F: Token exchange succeeded\n";
    debugOutput += `Access Token: ${tokens.access_token}\n`;
    debugOutput += `Expiry: ${tokens.expiry_date}\n`;

    return new Response(`
      <html><body>
        <h1>Authentication successful</h1>
        <p>You may close this tab.</p>
        <pre>${debugOutput}</pre>
        <pre>Raw Tokens:\n${JSON.stringify(tokens, null, 2)}</pre>
        <script>window.close();</script>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (err: any) {
    debugOutput += "Phase G: Token exchange failed\n";
    debugOutput += `Error: ${err?.message || 'Unknown error'}\n`;
    debugOutput += `Raw:\n${JSON.stringify(err, Object.getOwnPropertyNames(err), 2)}\n`;

    return new Response(`
      <html><body>
        <h1>OAuth Failed</h1>
        <pre>${debugOutput}</pre>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
};
