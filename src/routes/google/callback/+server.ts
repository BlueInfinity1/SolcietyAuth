import { env } from "$env/dynamic/private";
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  let debugOutput = "OAuth Callback Phase Log:\n";

  const serverTime = new Date().toISOString();
  debugOutput += `\nPhase T: Server clock at callback: ${serverTime}\n`;

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

    debugOutput += "Phase D: Preparing POST request to Google token endpoint\n";

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
      debugOutput += `Phase E: Google returned an error (status ${tokenResponse.status})\n`;
      debugOutput += `Raw response:\n${JSON.stringify(tokenData, null, 2)}\n`;
      throw new Error(tokenData.error_description || "Unknown error from Google");
    }

    debugOutput += "Phase F: Token exchange succeeded\n";
    debugOutput += `Access Token: ${tokenData.access_token}\n`;
    debugOutput += `Expires In: ${tokenData.expires_in}\n`;
    debugOutput += `Refresh Token: ${tokenData.refresh_token || '(not returned)'}\n`;

    return new Response(`
      <html><body>
        <h1>Authentication successful</h1>
        <p>You may now return to the game and close this tab.</p>
        <pre>${debugOutput}</pre>
        <pre>Raw Token Response:\n${JSON.stringify(tokenData, null, 2)}</pre>
        <script>window.close();</script>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (err: any) {
    debugOutput += "Phase G: Token exchange failed\n";
    debugOutput += `Error: ${err?.message || 'Unknown error'}\n`;

    console.log("OAuth Failed:\n" + debugOutput);

    return new Response(`
      <html><body>
        <h1>OAuth Failed</h1>
        <pre>${debugOutput}</pre>
      </body></html>
    `, { headers: { 'Content-Type': 'text/html' }, status: 500 });
  }
};
