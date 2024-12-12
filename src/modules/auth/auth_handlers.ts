import { Hono } from "hono";
import type AppCtx from "../../interfaces/AppCtx.js";
import { jsonSchema } from "../../supports/validator.js";
import {
  loginDto,
  registerDto,
  type LoginDto,
  type RegisterDto
} from "./auth_dto.js";
import { checkUserByEmail, login, register } from "./auth_repo.js";
import BadRequestException from "../../exceptions/BadRequestException.js";

const auth_handler = new Hono<AppCtx>();

// login
auth_handler.post("/login", jsonSchema(loginDto), async c => {
  const body = await c.req.json<LoginDto>();

  const user = await login(body);
  if (!user) {
    throw new BadRequestException("Credentials doesn't match");
  }

  return c.json(user);
});

// register
auth_handler.post("/register", jsonSchema(registerDto), async c => {
  const body = await c.req.json<RegisterDto>();

  // Check if the email is already in use
  const existingUser = await checkUserByEmail(body.email);

  if (existingUser) {
    throw new BadRequestException("User with this email already exists.");
  }

  return c.json(await register(body));
});

// get current user
auth_handler.get("/api/user", async c => {
  return c.json(c.var.getUser());
});

export default auth_handler;
