import jwt from "jsonwebtoken";
import { Baggage } from "./book.js";

export async function Meera(baggage: Baggage): Promise<Baggage> {
  if (!baggage) {
    return null;
  }

  switch (baggage.token) {
    case "asymmetry":
      baggage.token = jwt.sign(
        {id: baggage.id},
        Buffer.from(process.env.JWT_PRIVATE_KEY!, "base64"),
        {
          expiresIn: parseInt(process.env.JWT_EXPIRED_TIME ?? "0"),
          algorithm: "ES256",
        }
      );
      break;
    case "symmetry":
      baggage.token = jwt.sign(
        {id: baggage.id},
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
