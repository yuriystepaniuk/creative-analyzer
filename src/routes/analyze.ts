import { Hono } from "hono";
import { downloadFromDrive } from "../gdrive";
import { analyzeWithGemini } from "../gemini";
import type { Env } from "../index";

const analyze = new Hono<{ Bindings: Env }>();

analyze.post("/", async (c) => {
  const body = await c.req.json<{ url?: string }>().catch(() => null);

  if (!body?.url || typeof body.url !== "string") {
    return c.json({ error: "Missing required field: url" }, 400);
  }

  if (!body.url.includes("drive.google.com")) {
    return c.json(
      { error: "URL must be a Google Drive link (drive.google.com)" },
      400
    );
  }

  if (!c.env.GEMINI_API_KEY) {
    return c.json(
      { error: "Server configuration error: GEMINI_API_KEY not set" },
      500
    );
  }

  let file;
  try {
    file = await downloadFromDrive(body.url);
  } catch (err) {
    return c.json(
      { error: `Failed to download file: ${(err as Error).message}` },
      422
    );
  }

  let result;
  try {
    result = await analyzeWithGemini(c.env.GEMINI_API_KEY, file.buffer, file.mimeType);
  } catch (err) {
    return c.json(
      { error: `Analysis failed: ${(err as Error).message}` },
      502
    );
  }

  return c.json({
    data: result,
    meta: {
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeKb: Math.round(file.buffer.byteLength / 1024),
    },
  });
});

export default analyze;
