import { zValidator } from "@hono/zod-validator";

export const jsonSchema = (schema: Parameters<typeof zValidator>[1]) => {
  return zValidator("json", schema);
};
