import { GoogleProfile } from '@/lib/customers';

/**
 * Google sign-in over a plain OAuth 2.0 authorization-code flow.
 *
 * No library: `next-auth` would want to own sessions, users and callbacks, and
 * this app already has all three (scrypt passwords, HMAC-signed cookies, a JSON
 * customer store). Swapping them out to gain one button is the larger change,
 * not the smaller one.
 */

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export const GOOGLE_STATE_COOKIE = 'gg_oauth_state';

/** True once both halves of the credential are present in the environment. */
export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Must match an "Authorised redirect URI" on the Google credential exactly,
 * including scheme and host — Google compares it as a literal string.
 */
export function googleRedirectUri(requestUrl: string): string {
  const origin = new URL(requestUrl).origin;
  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  const base = isLocal ? origin : (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? origin);
  return `${base}/api/account/google/callback`;
}

export function googleAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    // Keeps the account chooser predictable rather than silently reusing
    // whichever Google account happens to be signed in.
    prompt: 'select_account',
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

interface IdTokenClaims {
  iss?: string;
  aud?: string;
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
}

/** Reads a JWT payload without verifying it. Only safe on a token we fetched. */
function decodeClaims(idToken: string): IdTokenClaims | null {
  const payload = idToken.split('.')[1];
  if (!payload) return null;

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as IdTokenClaims;
  } catch {
    return null;
  }
}

export type GoogleExchange =
  | { ok: true; profile: GoogleProfile }
  | { ok: false; error: string };

/**
 * Trades the one-time code for the user's identity.
 *
 * The id_token comes straight back from Google's token endpoint over TLS, on a
 * request authenticated with the client secret — so its signature does not need
 * separate verification here. The claims inside it still do: a token minted for
 * a different `aud` is a valid Google token and an invalid one for this site.
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleExchange> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) return { ok: false, error: 'Google rejected the sign-in attempt.' };

  const tokens = (await response.json().catch(() => null)) as { id_token?: string } | null;
  const claims = tokens?.id_token ? decodeClaims(tokens.id_token) : null;

  if (!claims?.sub || !claims.email) {
    return { ok: false, error: 'Google did not return an account.' };
  }

  if (!ISSUERS.includes(claims.iss ?? '')) {
    return { ok: false, error: 'Unexpected token issuer.' };
  }

  if (claims.aud !== process.env.GOOGLE_CLIENT_ID) {
    return { ok: false, error: 'That token was issued for a different site.' };
  }

  if (!claims.exp || claims.exp * 1000 <= Date.now()) {
    return { ok: false, error: 'That sign-in has expired. Please try again.' };
  }

  // Google sends this as a boolean, but has historically also sent the string.
  const verified = claims.email_verified === true || claims.email_verified === 'true';
  if (!verified) {
    // Linking on an unverified address would let anyone who can add an
    // unconfirmed email to a Google account take over the matching customer.
    return { ok: false, error: 'Please verify your email address with Google first.' };
  }

  return {
    ok: true,
    profile: {
      googleId: claims.sub,
      email: claims.email,
      name: claims.name ?? '',
      picture: claims.picture,
    },
  };
}
