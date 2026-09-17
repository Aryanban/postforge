import type { LinkedInCreds } from '../config.js';

/**
 * LinkedIn dispatch via OAuth 2.0 and the ugcPosts API.
 *
 * The client secret can never live in the browser, so the whole flow is
 * server-side: authorize -> callback -> encrypted token storage -> post.
 */
export interface StoredLinkedInToken {
  accessToken: string;
  memberId: string;
  name?: string;
  expiresAt?: string;
}

export function authorizationUrl(creds: LinkedInCreds, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: creds.clientId,
    redirect_uri: creds.redirectUri,
    scope: 'openid profile email w_member_social',
    state,
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeCode(
  creds: LinkedInCreds,
  code: string
): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: creds.redirectUri,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
    }),
  });
  if (!res.ok) {
    throw new Error(`linkedin token exchange failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!json.access_token) {
    throw new Error(`linkedin token error: ${json.error ?? 'no access_token'}`);
  }
  return { access_token: json.access_token, expires_in: json.expires_in ?? 0 };
}

export async function getUserInfo(accessToken: string): Promise<{ sub: string; name?: string }> {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`linkedin userinfo failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as { sub: string; name?: string };
}

export async function createTextPost(
  accessToken: string,
  memberId: string,
  text: string
): Promise<string> {
  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: `urn:li:person:${memberId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });
  if (!res.ok) {
    throw new Error(`linkedin post failed (${res.status}): ${await res.text()}`);
  }
  return res.headers.get('x-restli-id') ?? 'unknown';
}
