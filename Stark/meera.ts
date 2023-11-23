import jwt from "jsonwebtoken";
import { Baggage, Package, TokenStruct } from "./book.js";

export async function Meera(
  name: string,
  baggage?: Baggage,
  tokenStruct?: TokenStruct
): Promise<Package> {
  let ret: Package = { name: name };
  if (baggage) {
    ret.baggage = baggage;
  }
  if (tokenStruct) {
    switch (tokenStruct.type) {
      case "asymmetry":
        ret.token = jwt.sign(
          { name: name },
          Buffer.from(tokenStruct.key, "base64").toString(), // base64 encoded PAM format
          {
            expiresIn: tokenStruct.exp,
            algorithm: "ES256",
            noTimestamp: true,
          }
        );
        break;
      case "symmetry":
        ret.token = jwt.sign({ name: name }, tokenStruct.key, {
          expiresIn: tokenStruct.key,
          algorithm: "HS256",
        });
        break;
      case "session":
        ret.token = ""; // TODO
        break;
    }
  }
  return ret;
}
