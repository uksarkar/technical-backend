import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { logger } from "hono/logger";
import { requestId } from "hono/request-id";
import type AppCtx from "./interfaces/AppCtx.js";
import db from "./supports/db.js";
import { findUser } from "./modules/auth/auth_repo.js";
import UnauthorizedException from "./exceptions/UnauthorizedException.js";
import auth_handler from "./modules/auth/auth_handlers.js";
import {
  file_handler,
  public_file_handler
} from "./modules/files/file_handlers.js";
import tag_handler from "./modules/tags/tag_hanlders.js";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";

const app = new Hono<AppCtx>();

app.use("*", async (c, next) => {
  c.set("db", db);

  await next();
});
app.use(logger());
app.use("*", requestId());
app.use("*", cors({ origin: "*" }));
app.use(
  "/client/api/*",
  jwt({
    secret: process.env.JWT_SECRET!
  })
);
app.use("/client/api/*", async (c, next) => {
  const authUser = c.var.jwtPayload?.user_id
    ? await findUser(c.var.jwtPayload.user_id)
    : null;

  c.set("getUser", () => {
    if (!authUser) {
      throw new UnauthorizedException();
    }

    return authUser;
  });

  await next();
});

app.onError(async (err, c) => {
  if (err instanceof HTTPException) {
    const message = err.message;
    return c.json({ message }, err.status);
  }

  return c.json({ message: "Something went wrong" }, 501);
});

// register routes
app.route("/client/", auth_handler);
app.route("/client/files", public_file_handler);

// authenticated routes
app.route("/client/api/file", file_handler);
app.route("/client/api/tags", tag_handler);

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port
});
