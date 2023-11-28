import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";

import { Hodor, Words } from "../../Stark/hodor.js";
import { GuestRecord } from "../../Stark/book.js";
import { kv } from "@vercel/kv";

const FAILED_COUNT_KEY = 'gate/failed_count';

class HoldTheDoor extends Hodor {
  constructor(
    rpName: string,
    rpID: string,
    origin: string,
    name: string,
    family: string
  ) {
    super(rpName, rpID, origin, name, family);
  }

  async have_meet(): Promise<string[]> {
    let res = await sql.query(
      `SELECT json_agg(id) as id
        FROM gate_id
        WHERE name=$1 AND origin=$2 AND enabled=TRUE AND family=$3`,
      [this.name, this.origin, this.family]
    );
    return res.rows[0].id;
  }

  async book(words: Words): Promise<void> {
    let key = `gate/challenge/${this.name}`;
    await kv.set(key, words);
    await kv.expire(key, 60);
  }

  async check(): Promise<Words> {
    let key = `gate/challenge/${this.name}`;
    let words = (await kv.get(key)) as Words | null;
    if (!words) {
      throw Error(`challenge for ${this.name} not found`);
    }
    await kv.del(key);
    return words;
  }

  async getGuestRecord(id: string): Promise<GuestRecord> {
    let query = await sql`SELECT * FROM gate_id
                                        NATURAL FULL JOIN gate_stable
                                        NATURAL FULL JOIN gate_token
                          WHERE id = ${id}
                                AND name = ${this.name}
                                AND origin = ${this.origin}
                                AND family = ${this.family}
                          LIMIT 1`;
    if (query.rowCount == 0) {
      throw Error("Credential ID not found");
    }
    return {
      family: this.family,
      name: this.name,
      id: id,
      publicKey: query.rows[0].publickey,
      origin: this.origin,
      baggage: query.rows[0].baggage,
      token: query.rows[0].token,
    };
  }
}

export default async function (
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    if ((await kv.get<number>(FAILED_COUNT_KEY) ?? 0) >= 5) {
      throw Error('blocking');
    }
    if (
      typeof request.query.name !== "string" ||
      request.query.name.length == 0
    ) {
      throw Error("empty name");
    }
    if (
      typeof request.query.family !== "string" ||
      request.query.family.length == 0
    ) {
      throw Error("empty family");
    }
    let url = new URL(request.headers.referer ?? request.headers.origin ?? "");
    let rpID = url.hostname;
    let origin = url.origin;
    let hodor = new HoldTheDoor(
      process.env.RP_NAME!,
      rpID,
      origin,
      request.query.name,
      request.query.family
    );
    let answer: any;
    switch (request.method) {
      case "GET":
        answer = await hodor.meet();
        response.status(200).json(answer);
        break;
      case "POST":
        answer = await hodor.offer(request.body);
        response.status(200).json(answer);
        break;
      default:
        throw Error(`invalid method ${request.method}`);
    }
  } catch (error) {
    console.log(`error: ${error}`);
    await kv.incr(FAILED_COUNT_KEY);
    await kv.expire(FAILED_COUNT_KEY, 60 * 5);
    response.status(404).send(null);
  }
}
