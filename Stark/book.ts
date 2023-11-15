export type Baggage = null | (object & { id?: string, token?: string });
export type GuestRecord = {
  user: string;
  id: string;
  publicKey: string;
  origin: string;
  baggage?: Baggage;
};
