import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Baggage, GuestRecord } from "../../Stark/book.js";
import { Brandon } from "../../Stark/brandon.js";
import { kv } from "@vercel/kv";
import { sql } from "@vercel/postgres";

class LordBrandon extends Brandon {
  constructor(rpName: string, rpID: string, origin: string, name: string) {
    super(rpName, rpID, origin, name);
  }

  async is_waiting(): Promise<boolean> {
    let valid = await kv.get(`gate/waiting/${this.name}`);
    if (!valid) {
      console.log(`invali user=${this.name}`);
      return false;
    }
    return true;
  }

  async book(challenge: string): Promise<void> {
    let key = `gate/challenge/${this.name}`;
    console.log(`remember ${challenge} for ${this.name}`);
    await kv.set(key, challenge);
    await kv.expire(key, 60);
  }

  async check(): Promise<string> {
    let key = `gate/challenge/${this.name}`;
    let challenge = (await kv.get(key)) as string;
    await kv.del(key);
    return challenge;
  }

  async register(record: GuestRecord, baggage: Baggage): Promise<void> {
    await sql`INSERT INTO gate(username, id, publickey, origin, enabled)
            VALUES(${record.user},
                   ${record.id},
                   ${record.publicKey},
                   ${record.origin},
                   TRUE)`;
    if (baggage) {
      await sql.query(
        `INSERT INTO stable(username, baggage, origin) VALUES($1, $2, $3)`,
        [record.user, baggage, this.origin]
      );
    }
  }
}

export default async function bran(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    if (!request.query.name) {
      console.log("empty name");
      response.status(404).send(null);
      return;
    }
    let url = new URL(request.headers.referer ?? request.headers.origin ?? "");
    let rpID = url.hostname;
    let origin = url.origin;
    let bran = new LordBrandon(
      process.env.RP_NAME!,
      rpID,
      origin,
      request.query.name as string
    );
    let answer: any;
    switch (request.method) {
      case "GET":
        answer = await bran.visit();
        response.status(200).json(answer);
        break;
      case "POST":
        answer = await bran.greet(request.body);
        response.status(200).send(answer);
        break;
      default:
        response.status(404).send(null);
        break;
    }
  } catch (error) {
    console.log(`error: ${error}`);
    response.status(404).send(null);
  }
}
