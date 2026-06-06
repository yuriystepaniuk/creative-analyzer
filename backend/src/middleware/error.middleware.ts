import type { Context } from "hono";
import { AppError, type HttpStatus } from "../errors";

export const errorMiddleware = (err: Error, c: Context) => {
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.status);
  }
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500 satisfies HttpStatus);
};
