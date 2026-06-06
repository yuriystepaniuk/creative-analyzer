import { GDRIVE_DOWNLOAD_URL, USER_AGENT } from "../constants/gdrive.constants";
import type { DriveFile } from "../interfaces/analysis";
import { extractFileId, parseMimeType, buildConfirmedUrl, parseFileName, extractConfirmToken } from "../helpers/gdrive.helper";
import { validateBuffer } from "../validation/gdrive.validation";

const FETCH_HEADERS = { "User-Agent": USER_AGENT };

const resolveConfirmationPage = async (response: Response, fileId: string): Promise<Response> => {
  const token = extractConfirmToken(await response.text());

  if (!token) {
    throw new Error(
      "Файл потребує підтвердження Google Drive, але токен не знайдено. Файл може бути приватним або недоступним."
    );
  }

  const confirmed = await fetch(buildConfirmedUrl(fileId, token.token, token.matchStr), {
    redirect: "follow",
    headers: FETCH_HEADERS,
  });

  if (!confirmed.ok) {
    throw new Error(`Підтверджене завантаження не вдалося зі статусом ${confirmed.status}`);
  }

  return confirmed;
};

export const downloadFromDrive = async (url: string): Promise<DriveFile> => {
  const fileId = extractFileId(url);

  const initial = await fetch(`${GDRIVE_DOWNLOAD_URL}${fileId}`, {
    redirect: "follow",
    headers: FETCH_HEADERS,
  });

  if (!initial.ok) {
    throw new Error(`Google Drive повернув статус ${initial.status}`);
  }

  const contentType = initial.headers.get("content-type") ?? "";
  const response = contentType.includes("text/html")
    ? await resolveConfirmationPage(initial, fileId)
    : initial;

  const mimeType = parseMimeType(response.headers.get("content-type"));
  const buffer = await response.arrayBuffer();

  validateBuffer(buffer, mimeType);

  return {
    buffer,
    mimeType,
    fileName: parseFileName(response, fileId),
  };
};
