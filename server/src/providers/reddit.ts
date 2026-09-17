import type { RedditCreds } from '../config.js';

/**
 * Reddit dispatch using the script-app OAuth password grant and the
 * /api/submit endpoint. Self-posts keep content 9:1 compliant; the delayed
 * OP comment carries the quarantined link.
 */
function userAgent(creds: RedditCreds): string {
  return `postforge/2.0 (by /u/${creds.username})`;
}

async function fetchToken(creds: RedditCreds): Promise<string> {
  const auth = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64');
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': userAgent(creds),
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: creds.username,
      password: creds.password,
    }),
  });
  if (!res.ok) {
    throw new Error(`reddit auth failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!json.access_token) {
    throw new Error(`reddit auth error: ${json.error ?? 'no access_token'}`);
  }
  return json.access_token;
}

interface SubmitResponse {
  json?: { errors?: [string, string, string][]; data?: { id?: string; name?: string } };
}

async function submit(creds: RedditCreds, params: URLSearchParams): Promise<string> {
  const token = await fetchToken(creds);
  const res = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': userAgent(creds),
    },
    body: params,
  });
  if (!res.ok) {
    throw new Error(`reddit submit failed (${res.status}): ${await res.text()}`);
  }
  const json = (await res.json()) as SubmitResponse;
  const errors = json.json?.errors ?? [];
  if (errors.length > 0) {
    throw new Error(`reddit rejected post: ${errors.map(e => e[1]).join('; ')}`);
  }
  const id = json.json?.data?.name ?? json.json?.data?.id;
  if (!id) throw new Error('reddit submit returned no post id');
  return id;
}

export async function submitSelfPost(
  creds: RedditCreds,
  args: { subreddit: string; title: string; text: string }
): Promise<string> {
  return submit(
    creds,
    new URLSearchParams({
      kind: 'self',
      sr: args.subreddit,
      title: args.title,
      text: args.text,
      api_type: 'json',
    })
  );
}

export async function postComment(
  creds: RedditCreds,
  args: { parentId: string; text: string }
): Promise<string> {
  return submit(
    creds,
    new URLSearchParams({
      kind: 'comment',
      thing_id: args.parentId,
      text: args.text,
      api_type: 'json',
    })
  );
}
