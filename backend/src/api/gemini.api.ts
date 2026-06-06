import { toBase64 } from "../helpers/base64.helper";
import { fetchWithRetry } from "../helpers/fetch.helper";
import { parseGeminiError, extractResponseText, parseAnalysisResult } from "../helpers/gemini.helper";
import type { AnalysisResult } from "../interfaces/analysis";
import {
  GEMINI_API_URL,
  GEMINI_TEMPERATURE,
  RETRYABLE_STATUSES,
  RETRY_DELAYS_MS,
  RESPONSE_SCHEMA,
} from "../constants/gemini.constants";
import { ANALYSIS_PROMPT } from "../constants/prompt.constants";

const OVERLOAD_ERROR = `Сервери Google AI зараз перевантажені. Ми зробили ${RETRY_DELAYS_MS.length + 1} спроби — спробуйте ще раз через хвилину.`;

export const analyzeWithGemini = async (
  apiKey: string,
  buffer: ArrayBuffer,
  mimeType: string
): Promise<AnalysisResult> => {
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: ANALYSIS_PROMPT },
            { inline_data: { mime_type: mimeType, data: toBase64(buffer) } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: GEMINI_TEMPERATURE,
      },
    }),
  };

  const response = await fetchWithRetry(
    `${GEMINI_API_URL}?key=${apiKey}`,
    init,
    RETRY_DELAYS_MS,
    RETRYABLE_STATUSES,
    OVERLOAD_ERROR
  );

  if (!response.ok) {
    throw new Error(parseGeminiError(await response.text(), `Gemini API error ${response.status}`));
  }

  const rawText = extractResponseText(await response.json());
  if (!rawText) throw new Error("Gemini повернув порожню відповідь");

  return parseAnalysisResult(rawText);
};
