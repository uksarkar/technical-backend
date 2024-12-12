import { Hono } from "hono";
import type AppCtx from "../../interfaces/AppCtx.js";
import { searchTag } from "./tag_repo.js";

const tag_handler = new Hono<AppCtx>();

tag_handler.get("/", async c => {
  const name = c.req.query("name");
  const except = c.req.queries("except") || [];

  if (!name) {
    return c.json([]);
  }

  const tags = await searchTag(name, except);

  return c.json(tags);
});

export default tag_handler;
