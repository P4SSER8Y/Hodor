import to from "await-to-js";

export type Err<T> = {
  v: T | undefined;
  err: null | Error;
};

export async function h<T>(promise: Promise<T>): Promise<Err<T>> {
  const [err, v] = await to(promise);
  return { v: v, err: err };
}
