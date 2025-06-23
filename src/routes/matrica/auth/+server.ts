// src/routes/matrica/auth/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { MatricaOAuthClient } from '@matrica/oauth-sdk';
import { env } from '$env/dynamic/private';
import { sessionStore } from '$lib/sessionStore';

export const GET: RequestHandler = async ({ url }) => {
  const sessionId = url.searchParams.get('sessionId');
  if (!sessionId) return new Response('Missing sessionId', { status: 400 });

  const client = new MatricaOAuthClient({
    clientId:     env.MATRICA_CLIENT_ID,
    clientSecret: env.MATRICA_CLIENT_SECRET,
    redirectUri:  'https://solciety-auth.vercel.app/matrica/auth/callback'
  });

  const scopes = 'profile wallets nfts';
  const { url: authUrl, codeVerifier } = await client.getAuthorizationUrl(scopes);

  // Store the codeVerifier in sessionStore using the sessionId
  sessionStore.set(sessionId, {
    accessToken: '',       // not yet available
    expiresAt: 0,          // not yet available
    codeVerifier           // custom field temporarily needed for callback
  } as any); // Type-cast because SessionData originally doesn't have codeVerifier

  return Response.redirect(authUrl, 302);
};
