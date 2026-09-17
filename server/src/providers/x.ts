import { TwitterApi } from 'twitter-api-v2';
import type { XCreds } from '../config.js';

/**
 * X / Twitter API v2 dispatch via OAuth 1.0a user context (Basic tier required
 * to create tweets). Supports single posts, delayed replies (the link
 * quarantine), and real multi-part threads.
 */
function client(creds: XCreds) {
  return new TwitterApi({
    appKey: creds.appKey,
    appSecret: creds.appSecret,
    accessToken: creds.accessToken,
    accessSecret: creds.accessSecret,
  }).readWrite;
}

export async function postTweet(creds: XCreds, text: string): Promise<string> {
  const { data } = await client(creds).v2.tweet(text);
  return data.id;
}

export async function replyTweet(creds: XCreds, text: string, parentId: string): Promise<string> {
  const { data } = await client(creds).v2.reply(text, parentId);
  return data.id;
}

/** Posts a thread as a reply chain, returning every resulting tweet id. */
export async function postThread(creds: XCreds, parts: string[]): Promise<string[]> {
  const api = client(creds);
  const ids: string[] = [];
  let parentId: string | undefined;
  for (const part of parts) {
    const { data } = parentId
      ? await api.v2.reply(part, parentId)
      : await api.v2.tweet(part);
    ids.push(data.id);
    parentId = data.id;
  }
  return ids;
}
