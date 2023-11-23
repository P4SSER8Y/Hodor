export type Baggage = object;

export type GuestRecord = {
  name: string;
  id: string;
  publicKey: string;
  origin: string;
  family: string;
  baggage?: Baggage;
  token?: TokenStruct;
};

export type TokenStruct =
  | { type: "asymmetry"; key: string; exp: number }
  | { type: "symmetry"; key: string; exp: number }
  | { type: "session" };

export type Package = { name: string; baggage?: object; token?: string };
