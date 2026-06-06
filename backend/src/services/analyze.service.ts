import { downloadFromDrive } from "../api/gdrive.api";
import { analyzeWithGemini } from "../api/gemini.api";
import { DownloadError, GeminiError, ConfigError } from "../errors";
import type { AnalyzeResponse } from "../interfaces/analysis";

const toMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);

export const analyzeCreative = async (
  url: string,
  apiKey: string
): Promise<AnalyzeResponse> => {
  if (!apiKey) throw new ConfigError("GEMINI_API_KEY is not configured");

  const file = await downloadFromDrive(url).catch((err) => {
    throw new DownloadError(toMessage(err));
  });

  const result = await analyzeWithGemini(apiKey, file.buffer, file.mimeType).catch((err) => {
    throw new GeminiError(toMessage(err));
  });

  return {
    data: result,
    meta: {
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeKb: Math.round(file.buffer.byteLength / 1024),
    },
  };
};
