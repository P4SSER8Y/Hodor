import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";

import { Hodor, Words } from "../../Stark/hodor.js";
import { GuestRecord } from "../../Stark/book.js";
import { kv } from "@vercel/kv";

class HoldTheDoor extends Hodor {
  constructor(rpName: string, rpID: string, origin: string, name: string) {
    super(rpName, rpID, origin, name);
  }

  async have_meet(): Promise<string[]> {
    let res = await sql.query(
      `SELECT json_agg(id) as id FROM gate WHERE username=$1 AND origin=$2 AND enabled=TRUE`,
      [this.name, this.origin]
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
    let query = await sql`SELECT * FROM gate NATURAL FULL JOIN stable
                          WHERE gate.id = ${id}
                                AND gate.username = ${this.name}
                                AND gate.origin = ${this.origin}
                          LIMIT 1`;
    if (query.rowCount == 0) {
      throw Error("Credential ID not found");
    }
    return {
      user: query.rows[0].username,
      id: id,
      publicKey: query.rows[0].publickey,
      origin: this.origin,
      baggage: query.rows[0].baggage,
    };
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
    if (typeof request.query.origin !== 'string')
    {
      console.log("empty origin");
      response.status(404).send(null);
      return;
    }
    let url = new URL(request.headers.referer ?? request.headers.origin ?? "");
    let rpID = url.hostname;
    let origin = request.query.origin;
    let hodor = new HoldTheDoor(
      process.env.RP_NAME!,
      rpID,
      origin,
      request.query.name as string
    );
    let answer: any;
    switch (request.method) {
      case "GET":
        answer = await hodor.meet();
        response.status(200).json(answer);
        break;
      case "POST":
        answer = await hodor.offer(request.body);
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
