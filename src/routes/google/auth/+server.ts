import { env } from "$env/dynamic/private";
import type { RequestHandler } from '@sveltejs/kit';
import { google } from 'googleapis';

export const GET: RequestHandler = ({ url }) => {
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) return new Response('Missing session', { status: 400 });
  
  const oAuth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    'https://solciety-auth.vercel.app/google/callback' //  fixed, static callback,
  );
  
  const urlToGoogle = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/presentations.readonly'],
    state: sessionId
  });

  console.log("URL to Google:", urlToGoogle);
  
  return Response.redirect(urlToGoogle, 302);
  
};