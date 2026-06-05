import { Hono } from "hono";
import { validateAnalyzeBody } from "../validation/analyze";
import { analyzeCreative } from "../services/analyze";
import type { Env } from "../index";

const analyze = new Hono<{ Bindings: Env }>();

analyze.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const { url } = validateAnalyzeBody(body);
  const result = await analyzeCreative(url, c.env.GEMINI_API_KEY);
  return c.json(result);
});

export default analyze;
