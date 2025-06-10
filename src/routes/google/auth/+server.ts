import { env } from "$env/dynamic/private";
import type { RequestHandler } from '@sveltejs/kit';
import { google } from 'googleapis';

export const GET: RequestHandler = () => {
    console.log("Svelte auth: " + env.GOOGLE_CLIENT_ID);

    const oAuth2Client = new google.auth.OAuth2(
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
  return Response.redirect(url, 302);
};
