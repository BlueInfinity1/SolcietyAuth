import { env } from "$env/dynamic/private";
import type { RequestHandler } from '@sveltejs/kit';
import { google } from 'googleapis';

export const GET: RequestHandler = ({ url }) => {
  const sessionId = "mockSession"; //url.searchParams.get('session');
  if (!sessionId) return new Response('Missing session', { status: 400 });
  
  const oAuth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    'https://solciety-auth.vercel.app/google/callback' //  fixed, static callback,
  );
  
  const urlToGoogle = oAuth2Client.generateAuthUrl({
    access_type: 'online',
    scope: ['https://www.googleapis.com/auth/presentations.readonly'],
    //state: sessionId //  embed sessionId here,
  });

  console.log("URL to Google:", urlToGoogle);
  
  return Response.redirect(urlToGoogle, 302);
  
};



 

    // Testing message sending back to Discord
    /*const html = `
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
  });*/