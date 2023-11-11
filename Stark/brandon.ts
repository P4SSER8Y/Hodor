import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { Baggage, GuestRecord } from "./book.js";

type Invitation = object;
type GreetingPresent = {
  response: any;
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
}

export class Brandon implements Lord, Secretary {
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

  async visit(): Promise<Invitation | null> {
    if (!(await this.is_waiting())) {
      console.log(`invalid user=${this.name}`);
      return null;
    }
    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userID: this.name,
      userName: this.name,
      authenticatorSelection: {
        userVerification: "discouraged",
      },
    });

    let challenge = options.challenge;
    this.book(challenge);
    return options;
  }

  async greet(present: GreetingPresent): Promise<string | null> {
    let challenge = await this.check();

    let verification = await verifyRegistrationResponse({
      response: present.response,
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
        user: this.name,
        id: credentialID,
        publicKey: publickey,
        origin: this.origin,
      },
      present.baggage ?? null
    );

    return "Winter is comming";
  }
}
