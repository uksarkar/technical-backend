import { HTTPException } from "hono/http-exception";

export default class InternalErrorException extends HTTPException {
  constructor(message = "Server error") {
    super(501, { message });
  }
}
