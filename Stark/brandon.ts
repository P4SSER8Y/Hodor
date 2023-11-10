import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

type Invitation = object;
export type Baggage = object | undefined;
type GreetingPresent = {
  response: {
    id: any;
    rawId: any;
    response: any;
    clientExtensionResults: any;
    type: any;
  };
  baggage: Baggage;
};
type Words = string;
export type GuestRecord = {
  user: string;
  id: string;
  publicKey: string;
  origin: string;
};

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
  protected rpName: string;
  protected rpID: string;
  protected origin: string;
  name: string;

  constructor(rpName: string, rpID: string, origin: string, name: string) {
    this.rpName = rpName;
    this.rpID = rpID;
    this.origin = origin;
    this.name = name;
    console.log(`${rpName} ${rpID} ${origin} ${name}`)
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
    console.log(challenge);

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
      present.baggage
    );

    return "Winter is comming";
  }
}
