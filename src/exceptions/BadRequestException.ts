import { HTTPException } from "hono/http-exception";

export default class BadRequestException extends HTTPException {
  constructor(message = "Bad request") {
    super(400, { message });
  }
}
