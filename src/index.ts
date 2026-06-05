export interface Env {
  GEMINI_API_KEY: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/analyze" && request.method === "POST") {
      return handleAnalyze(request, env);
    }

    if (url.pathname === "/health") {
      return Response.json({ status: "ok" }, { headers: CORS_HEADERS });
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  try {
    const body = await request.json() as { url?: string };

    if (!body.url || !body.url.includes("drive.google.com")) {
      return Response.json(
        { error: "Invalid URL. Must be a Google Drive link." },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    return Response.json(
      { message: "Worker is alive. Full analysis coming in Step 4." },
      { headers: CORS_HEADERS }
    );
  } catch {
    return Response.json(
      { error: "Invalid request body." },
      { status: 400, headers: CORS_HEADERS }
    );
  }
}
