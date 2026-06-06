import { sleep } from "../helpers/sleep.helper";
import { fetchWithRetry } from "../helpers/fetch.helper";
import { parseGeminiError, extractResponseText, parseAnalysisResult, type GeminiFile } from "../helpers/gemini.helper";
import type { AnalysisResult } from "../interfaces/analysis";
import {
  GEMINI_API_URL,
  GEMINI_FILES_UPLOAD_URL,
  GEMINI_FILES_BASE_URL,
  GEMINI_TEMPERATURE,
  RETRYABLE_STATUSES,
  RETRY_DELAYS_MS,
  RESPONSE_SCHEMA,
  FILE_POLL_INTERVAL_MS,
  FILE_POLL_MAX_ATTEMPTS,
} from "../constants/gemini.constants";
import { ANALYSIS_PROMPT } from "../constants/prompt.constants";

const OVERLOAD_ERROR = `Сервери Google AI зараз перевантажені. Ми зробили ${RETRY_DELAYS_MS.length + 1} спроби — спробуйте ще раз через хвилину.`;

const buildMultipartBody = (buffer: ArrayBuffer, mimeType: string): { body: Uint8Array; boundary: string } => {
  const boundary = `gemini_${Date.now()}`;
  const metadata = JSON.stringify({ file: { display_name: "creative" } });
  const encoder = new TextEncoder();

  const metaPart = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`
  );
  const filePart = encoder.encode(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`);
  const closing = encoder.encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(metaPart.byteLength + filePart.byteLength + buffer.byteLength + closing.byteLength);
  let offset = 0;
  body.set(metaPart, offset); offset += metaPart.byteLength;
  body.set(filePart, offset); offset += filePart.byteLength;
  body.set(new Uint8Array(buffer), offset); offset += buffer.byteLength;
  body.set(closing, offset);

  return { body, boundary };
};

const uploadFileToGemini = async (apiKey: string, buffer: ArrayBuffer, mimeType: string): Promise<GeminiFile> => {
  const { body, boundary } = buildMultipartBody(buffer, mimeType);

  const response = await fetch(`${GEMINI_FILES_UPLOAD_URL}?uploadType=multipart&key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });

  if (!response.ok) {
    throw new Error(parseGeminiError(await response.text(), `File upload failed: ${response.status}`));
  }

  const data = (await response.json()) as { file: GeminiFile };
  return data.file;
};

const waitForFileActive = async (apiKey: string, fileName: string): Promise<void> => {
  for (let i = 0; i < FILE_POLL_MAX_ATTEMPTS; i++) {
    const response = await fetch(`${GEMINI_FILES_BASE_URL}/${fileName}?key=${apiKey}`);
    const data = (await response.json()) as GeminiFile;
    if (data.state === "ACTIVE") return;
    if (data.state === "FAILED") throw new Error("Gemini не зміг обробити файл");
    await sleep(FILE_POLL_INTERVAL_MS);
  }
  throw new Error("Файл не готовий до аналізу — перевищено час очікування");
};

const deleteGeminiFile = (apiKey: string, fileName: string): void => {
  fetch(`${GEMINI_FILES_BASE_URL}/${fileName}?key=${apiKey}`, { method: "DELETE" }).catch(() => {});
};

export const analyzeWithGemini = async (
  apiKey: string,
  buffer: ArrayBuffer,
  mimeType: string
): Promise<AnalysisResult> => {
  const file = await uploadFileToGemini(apiKey, buffer, mimeType);
  await waitForFileActive(apiKey, file.name);

  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: ANALYSIS_PROMPT },
            { file_data: { mime_type: mimeType, file_uri: file.uri } },
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

  deleteGeminiFile(apiKey, file.name);

  if (!response.ok) {
    throw new Error(parseGeminiError(await response.text(), `Gemini API error ${response.status}`));
  }

  const rawText = extractResponseText(await response.json());
  if (!rawText) throw new Error("Gemini повернув порожню відповідь");

  return parseAnalysisResult(rawText);
};
