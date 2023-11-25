import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Baggage, GuestRecord } from "../../Stark/book.js";
import { Brandon } from "../../Stark/brandon.js";
import { kv } from "@vercel/kv";
import { sql } from "@vercel/postgres";

class LordBrandon extends Brandon {
  constructor(rpName: string, rpID: string, origin: string, name: string, family: string) {
    super(rpName, rpID, origin, name, family);
  }

  async is_waiting(code: string): Promise<boolean> {
    let query = await sql`SELECT (code = crypt(${code}, code)) AS m FROM gate_body WHERE name = ${this.name}`;
    if ((query.rowCount != 1) || (!query.rows[0].m)) {
      console.log(`invalid user=${this.name}`);
      return false;
    }
    return true;
  }

  async book(challenge: string): Promise<void> {
    let key = `gate/challenge/${this.name}`;
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
    await sql`INSERT INTO gate_id(name, family, id, publickey, origin, enabled)
            VALUES(${record.name},
                   ${record.family},
                   ${record.id},
                   ${record.publicKey},
                   ${record.origin},
                   TRUE)`;
    if (baggage) {
      await sql.query(
        `INSERT INTO gate_stable(name, baggage, family) VALUES($1, $2, $3)`,
        [record.name, baggage, this.family]
      );
    }
  }

  async get_previous_id(): Promise<string[]> {
    let query =
      await sql.query(`SELECT id FROM gate_id WHERE name=$1 AND origin=$2 AND family=$3`, [this.name, this.origin, this.family]);
    return query.rows.map((x) => x.id as string);
  }
}

export default async function bran(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    if (typeof request.query.name !== 'string' || request.query.name.length == 0) {
      console.log("empty name");
      response.status(404).send(null);
      return;
    }
    if (typeof request.query.family !== 'string' || request.query.family.length == 0) {
      console.log("empty family");
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
      request.query.name,
      request.query.family,
    );
    let answer: any;
    switch (request.method) {
      case "POST":
        if ('code' in request.body) {
          answer = await bran.visit(request.body.code);
        }
        else {
          answer = await bran.greet(request.body);
        }
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
