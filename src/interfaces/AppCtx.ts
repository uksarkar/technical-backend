import { drizzle } from "drizzle-orm/libsql";
import type { JwtVariables } from "hono/jwt";
import type { RequestIdVariables } from "hono/request-id";

type Variables = JwtVariables &
  RequestIdVariables & {
    db: ReturnType<typeof drizzle>;
    getUser: () => { id: number; email: string; name: string };
  };

export default interface AppCtx {
  Variables: Variables;
}
