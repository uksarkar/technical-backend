import { HTTPException } from "hono/http-exception";

export default class UnauthorizedException extends HTTPException {
  constructor(message = "Unauthorized") {
    super(401, { message });
  }
}
