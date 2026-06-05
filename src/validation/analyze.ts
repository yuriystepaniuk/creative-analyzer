import { ValidationError } from "../errors";

export interface AnalyzeRequest {
  url: string;
}

export function validateAnalyzeBody(body: unknown): AnalyzeRequest {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be a JSON object");
  }

  const { url } = body as Record<string, unknown>;

  if (!url || typeof url !== "string" || url.trim() === "") {
    throw new ValidationError("Missing required field: url");
  }

  if (!url.includes("drive.google.com")) {
    throw new ValidationError("URL must be a Google Drive link (drive.google.com)");
  }

  return { url: url.trim() };
}
