import jwt from "jsonwebtoken";
import { Baggage } from "./book.js";

export async function Meera(name?: string, baggage?: Baggage): Promise<Baggage> {
  if (!baggage) {
    return null;
  }

  let token = baggage.token;
  delete baggage.token;
  baggage.name = name;
  switch (token) {
    case "asymmetry":
      baggage.token = jwt.sign(
        baggage,
        Buffer.from(process.env.JWT_PRIVATE_KEY!, "base64"),
        {
          expiresIn: parseInt(process.env.JWT_EXPIRED_TIME ?? "0"),
          algorithm: "ES256",
          noTimestamp: true,
        }
      );
      break;
    case "symmetry":
      baggage.token = jwt.sign(
        baggage,
        process.env.JWT_SALT!,
        {
          expiresIn: parseInt(process.env.JWT_EXPIRED_TIME ?? "0"),
          algorithm: "HS256",
        }
      );
      break;
  }
  return baggage;
}
