export type Baggage = null | (object & { name?: string, token?: string });
export type GuestRecord = {
  user: string;
  id: string;
  publicKey: string;
  origin: string;
  baggage?: Baggage;
};
