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
  const { url: baseAuthUrl, codeVerifier } = await client.getAuthorizationUrl(scopes);

  // Append sessionId as `state` parameter
  const authUrl = `${baseAuthUrl}&state=${encodeURIComponent(sessionId)}`;

  console.log("Store codeVerifier " + codeVerifier + " Redirect to " + authUrl);

  sessionStore.set(sessionId, {
    codeVerifier
  } as any); // Temporarily store codeVerifier until callback

  console.log("sessionStore for sessionId: ", sessionId);

  return Response.redirect(authUrl, 302);
};
