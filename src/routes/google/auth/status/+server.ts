import type { RequestHandler } from '@sveltejs/kit';
import { sessionStore } from '$lib/sessionStore';

export const GET: RequestHandler = async ({ url }) => {
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) {
    return new Response('Missing session', {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const session = sessionStore.get(sessionId);
  const isValid = session && Date.now() < session.expiresAt;

  const responsePayload = {
    status: isValid ? 'authenticated' : 'pending',
    accessToken: isValid ? session!.accessToken : null,
    expiresAt: isValid ? session!.expiresAt : null
  };

  return new Response(JSON.stringify(responsePayload), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*' // Replace with your domain in prod
    }
  });
};
