import type { Context, Next } from "hono";
import { AppError } from "../errors";

export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    if (err instanceof AppError) {
      return c.json({ error: err.message }, err.status as 400 | 422 | 500 | 502);
    }
    console.error("Unhandled error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
}
