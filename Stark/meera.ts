import jwt from "jsonwebtoken";
import { Baggage, Package, TokenStruct } from "./book.js";

export async function Meera(
  name: string,
  family: string,
  baggage?: Baggage,
  tokenStruct?: TokenStruct
): Promise<Package> {
  let ret: Package = { name: name, family: family };
  if (baggage) {
    ret.baggage = baggage;
  }
  let payload = { n: name, f: family };
  if (tokenStruct) {
    switch (tokenStruct.type) {
      case "asymmetry":
        ret.token = jwt.sign(
          payload,
          Buffer.from(tokenStruct.key, "base64"), // base64 encoded PAM format
          {
            expiresIn: tokenStruct.exp,
            algorithm: "ES256",
            noTimestamp: true,
          }
        );
        break;
      case "symmetry":
        ret.token = jwt.sign(payload, tokenStruct.key, {
          expiresIn: tokenStruct.key,
          algorithm: "HS256",
          noTimestamp: true,
        });
        break;
      case "session":
        ret.token = ""; // TODO
        break;
    }
  }
  return ret;
}
