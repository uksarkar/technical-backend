import { HTTPException } from "hono/http-exception";

export default class NotFoundException extends HTTPException {
  constructor(message = "Not found") {
    super(404, { message });
  }
}
