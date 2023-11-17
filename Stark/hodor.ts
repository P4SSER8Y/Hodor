import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { GuestRecord, Baggage } from "./book.js";
import { Meera } from "./meera.js";

type Answer = object;
type Paper = object & { id: string };
export type Words = string;

interface Stableboy {
  meet(): Promise<Answer>;
  offer(paper: Paper): Promise<Baggage>;
}

interface Kid {
  have_meet(): Promise<string[]>;
  book(words: Words): Promise<void>;
  check(): Promise<Words>;
  getGuestRecord(id: string): Promise<GuestRecord>;
}

export class Hodor implements Stableboy, Kid {
  readonly rpName: string;
  readonly rpID: string;
  readonly origin: string;
  readonly name: string;

  constructor(rpName: string, rpID: string, origin: string, name: string) {
    this.rpName = rpName;
    this.rpID = rpID;
    this.origin = origin;
    this.name = name;
  }

  have_meet(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }

  book(words: Words): Promise<void> {
    throw new Error("Method not implemented.");
  }

  check(): Promise<Words> {
    throw new Error("Method not implemented.");
  }

  getGuestRecord(id: string): Promise<GuestRecord> {
    throw new Error("Method not implemented.");
  }

  async meet(): Promise<Answer> {
    let id = await this.have_meet();
    if ((id?.length ?? 0) == 0) {
      throw Error(`invalid name=${this.name}`);
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials: id.map((x) => ({
        id: Buffer.from(x, "base64url"),
        type: "public-key",
      })),
      userVerification: "discouraged",
      timeout: 60000,
    });

    await this.book(options.challenge);
    return options;
  }

  async offer(paper: Paper): Promise<Baggage> {
    let challenge = await this.check();
    if (!challenge) {
      throw Error(`challenge for ${this.name} not found`);
    }

    let guest = await this.getGuestRecord(paper.id);
    if (!guest) {
      throw Error(`${this.name} not found in guest book`);
    }

    let verification = await verifyAuthenticationResponse({
      response: paper as any,
      expectedChallenge: challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      authenticator: {
        credentialID: Buffer.from(guest.id, "base64url"),
        credentialPublicKey: Buffer.from(guest.publicKey, "base64url"),
        counter: -1,
      },
      requireUserVerification: false,
    });

    return Meera(this.name, guest.baggage);
  }
}
