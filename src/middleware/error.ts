import type { Context, Next } from "hono";

export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (err) {
    console.error("Unhandled error:", err);
    return c.json(
      { error: "Internal server error" },
      500
    );
  }
}
