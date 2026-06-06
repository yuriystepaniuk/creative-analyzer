import { ValidationError } from "../errors";
import type { AnalyzeRequest } from "../interfaces/analysis";

export const validateAnalyzeBody = (body: unknown): AnalyzeRequest => {
  if (!body || typeof body !== "object") {
    throw new ValidationError("Request body must be a JSON object");
  }

  const { url } = body as Record<string, unknown>;

  if (typeof url !== "string" || !url.trim()) {
    throw new ValidationError("Missing required field: url");
  }

  const trimmedUrl = url.trim();

  if (!trimmedUrl.includes("drive.google.com")) {
    throw new ValidationError("URL must be a Google Drive link (drive.google.com)");
  }

  return { url: trimmedUrl };
};
