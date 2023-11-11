import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";

import { Hodor, type Words } from "../../Stark/hodor.js";
import { Baggage, GuestRecord } from "../../Stark/book.js";
import { kv } from "@vercel/kv";

class HoldTheDoor extends Hodor {
  constructor(rpName: string, rpID: string, origin: string, name: string) {
    super(rpName, rpID, origin, name);
  }

  async have_meet(): Promise<string[]> {
    let res = await sql`SELECT json_agg(id) 
                        FROM gate 
                        WHERE username = ${this.name}
                              AND enabled = TRUE
                              AND origin = ${this.origin}`;
    return res.rows[0].json_agg;
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
    let query = await sql`SELECT * FROM gate
                          WHERE id = ${id}
                                AND username = ${this.name}
                                AND origin = ${this.origin}
                          LIMIT 1`;
    if (query.rowCount == 0) {
      throw Error("Credential ID not found");
    }
    return {
      user: query.rows[0].username,
      id: id,
      publicKey: query.rows[0].publickey,
      origin: this.origin,
    };
  }

  async fetchBaggage(): Promise<Baggage> {
    let query = await sql`SELECT baggage FROM guest
                          WHERE username = ${this.name} AND origin = ${this.origin}
                          LIMIT 1`;
    if (query.rowCount == 0) {
      return null;
    }
    return query.rows[0].baggage;
  }
}

export default async function (
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    if (!request.query.name) {
      console.log("empty name");
      response.status(404).send(null);
      return;
    }
    let hodor = new HoldTheDoor(
      process.env.RP_NAME!,
      request.headers.host!,
      request.headers.host!,
      request.query.name as string
    );
    let answer: any;
    switch (request.method) {
      case "GET":
        answer = await hodor.meet();
        response.status(200).json(answer);
        break;
      case "POST":
        answer = await hodor.offer(JSON.parse(request.body));
        response.status(200).json({
          name: hodor.name,
          baggage: answer,
        });
        break;
      default:
        throw Error(`invalid method ${request.method}`);
    }
  } catch (error) {
    console.log(`error: ${error}`);
    response.status(404).send(null);
  }
}
