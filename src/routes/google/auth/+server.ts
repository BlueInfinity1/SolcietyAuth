import { env } from "$env/dynamic/private";
import type { RequestHandler } from '@sveltejs/kit';
import { google } from 'googleapis';

export const GET: RequestHandler = () => {
    console.log("Svelte auth: " + env.GOOGLE_CLIENT_ID);

    const html = `
    <html>
      <head><title>Test Message</title></head>
      <body>
        <h1>Message sent to opener</h1>
        <script>
          console.log("Sending test postMessage to opener");
          if (window.opener) {
            window.opener.postMessage('oauth_success', '*');
          } else {
            console.warn("No window.opener found");
          }
        </script>
      </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
    status: 200
  });

    /*const oAuth2Client = new google.auth.OAuth2(
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        //`http://localhost:5173/google/callback`
        "https://1349666074253197394.discordsays.com/google/callback"
        );

        // ${env.GOOGLE_BASE_URL}

  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    //prompt:      'consent select_account',  // force the consent dialog & account picker each time
    scope: ['https://www.googleapis.com/auth/presentations.readonly']
  });
  return Response.redirect(url, 302); */
};
