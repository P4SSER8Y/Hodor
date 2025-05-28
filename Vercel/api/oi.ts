import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

export default async function (
  request: VercelRequest,
  response: VercelResponse
) {
  let now = new Date().toISOString();
  await kv.set("ping", now);
  response.status(200).send(now);
}
