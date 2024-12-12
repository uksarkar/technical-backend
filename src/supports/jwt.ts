import { sign } from "hono/jwt";

/**
 * Creates a JWT token.
 * @param payload - The payload to include in the JWT.
 * @returns The generated JWT token as a string.
 */
export function createToken(payload: { user_id: number }): Promise<string> {
  const exp =
    Math.floor(Date.now() / 1000) + Number(process.env.JWT_EXPIRE_TIME_SEC);

  // Define options such as expiration time
  const options = {
    exp,
    ...payload
  };

  // Sign the token using the payload and secret key
  return sign(options, process.env.JWT_SECRET!);
}
