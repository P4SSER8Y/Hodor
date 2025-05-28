import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

interface Result {
  status: string;
  last: string;
  now: string;
}

export default async function (
  request: VercelRequest,
  response: VercelResponse
) {
  let now = new Date().toISOString();
  let last = await kv.get<string>("ping");
  let t = await kv.set("ping", now);
  let result: Result = {
    status: t ? "ok": "error",
    last: last ?? "",
    now: now,
  };
  response.status(200).json(result);
}
