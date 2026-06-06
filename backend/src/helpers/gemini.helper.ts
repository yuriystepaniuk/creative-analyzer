import type { AnalysisResult } from "../interfaces/analysis";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message: string };
}

export const parseGeminiError = (text: string, fallback: string): string => {
  try {
    return (JSON.parse(text) as GeminiResponse)?.error?.message ?? fallback;
  } catch {
    return fallback;
  }
};

export const extractResponseText = (raw: unknown): string | null =>
  (raw as GeminiResponse)?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

export const parseAnalysisResult = (text: string): AnalysisResult => {
  try {
    return JSON.parse(text) as AnalysisResult;
  } catch {
    throw new Error("Не вдалося розпарсити відповідь Gemini як JSON");
  }
};
