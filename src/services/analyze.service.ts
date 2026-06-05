import { downloadFromDrive } from "../helpers/gdrive.helper";
import { analyzeWithGemini } from "../helpers/gemini.helper";
import { DownloadError, GeminiError, ConfigError } from "../errors";
import type { AnalyzeResponse } from "../interfaces/analysis";

export async function analyzeCreative(
  url: string,
  apiKey: string
): Promise<AnalyzeResponse> {
  if (!apiKey) {
    throw new ConfigError("GEMINI_API_KEY is not configured");
  }

  let file;
  try {
    file = await downloadFromDrive(url);
  } catch (err) {
    throw new DownloadError((err as Error).message);
  }

  let result;
  try {
    result = await analyzeWithGemini(apiKey, file.buffer, file.mimeType);
  } catch (err) {
    throw new GeminiError((err as Error).message);
  }

  return {
    data: result,
    meta: {
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeKb: Math.round(file.buffer.byteLength / 1024),
    },
  };
}
