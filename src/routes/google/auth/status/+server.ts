import type { RequestHandler } from '@sveltejs/kit';
import { sessionStore } from '$lib/sessionStore';

export const GET: RequestHandler = async ({ url }) => {
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) {
    return new Response('Missing session', { status: 400 });
  }

  const session = sessionStore.get(sessionId);
  const isValid = session && Date.now() < session.expiresAt;

  return new Response(JSON.stringify({ authenticated: !!isValid }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
