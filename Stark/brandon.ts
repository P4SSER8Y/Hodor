import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { Baggage, GuestRecord } from "./book.js";

type Invitation = object;
type GreetingPresent = any & {
  baggage?: Baggage;
};
type Words = string;
interface Lord {
  name: string;
  visit(): Promise<Invitation | null>;
  greet(present: GreetingPresent): Promise<Words | null>;
}

interface Secretary {
  is_waiting(): Promise<boolean>;
  book(challenge: Words): Promise<void>;
  check(): Promise<Words>;
  register(record: GuestRecord, baggage: Baggage): Promise<void>;
  get_previous_id(): Promise<string[]>;
}

export class Brandon implements Lord, Secretary {
  readonly rpName: string;
  readonly rpID: string;
  readonly origin: string;
  readonly name: string;
  readonly family: string;

  constructor(rpName: string, rpID: string, origin: string, name: string, family: string) {
    this.rpName = rpName;
    this.rpID = rpID;
    this.origin = origin;
    this.name = name;
    this.family = family;
  }

  async is_waiting(): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  async book(challenge: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  async check(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  async register(record: GuestRecord, baggage: Baggage): Promise<void> {
    throw new Error("Method not implemented.");
  }
  get_previous_id(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }

  async visit(): Promise<Invitation | null> {
    if (!(await this.is_waiting())) {
      console.log(`invalid user=${this.name}`);
      return null;
    }
    const id = await this.get_previous_id();
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: this.name,
      userName: this.name,
      excludeCredentials: id
        .map((x) => Buffer.from(x, "base64url"))
        .map((x) => ({
          id: x,
          type: "public-key",
        })),
      authenticatorSelection: {
        userVerification: "discouraged",
      },
      timeout: 60000,
    });

    await this.book(options.challenge);
    return options;
  }

  async greet(present: GreetingPresent): Promise<string | null> {
    let challenge = await this.check();
    let verification = await verifyRegistrationResponse({
      response: present,
      expectedChallenge: challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      requireUserVerification: false,
    });
    if (!verification.verified) {
      return null;
    }

    let credentialID = Buffer.from(
      verification.registrationInfo?.credentialID!
    ).toString("base64url");
    let publickey = Buffer.from(
      verification.registrationInfo?.credentialPublicKey!
    ).toString("base64url");

    await this.register(
      {
        name: this.name,
        id: credentialID,
        publicKey: publickey,
        origin: this.origin,
        family: this.family,
      },
      present.baggage ?? null
    );

    return "Winter is comming";
  }
}
