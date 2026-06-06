import {
  GDRIVE_DOWNLOAD_URL,
  GDRIVE_USERCONTENT_URL,
  DEFAULT_MIME_TYPE,
  SUPPORTED_MIME_TYPES,
} from "../constants/gdrive.constants";

export const extractFileId = (url: string): string => {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error("Не вдалося отримати ID файлу з URL Google Drive");
  return match[1];
};

export const parseMimeType = (contentType: string | null): string => {
  if (!contentType) return DEFAULT_MIME_TYPE;
  const base = contentType.split(";")[0].trim().toLowerCase();
  return SUPPORTED_MIME_TYPES.has(base) ? base : DEFAULT_MIME_TYPE;
};

export const buildConfirmedUrl = (fileId: string, token: string, matchStr: string): string => {
  if (matchStr.startsWith('"downloadUrl"')) {
    return token.replace(/\\u003d/g, "=").replace(/\\u0026/g, "&");
  }
  if (matchStr.startsWith("name=")) {
    return `${GDRIVE_USERCONTENT_URL}?id=${fileId}&export=download&confirm=${token}`;
  }
  return `${GDRIVE_DOWNLOAD_URL}${fileId}&confirm=${token}`;
};

export const parseFileName = (response: Response, fallback: string): string => {
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename[^;=\n]*=(?:(['"])([^'"]*)\1|([^\s;]*))/);
  return match?.[2] ?? match?.[3] ?? fallback;
};

export const extractConfirmToken = (html: string): { token: string; matchStr: string } | null => {
  const match =
    html.match(/name="uuid"\s+value="([^"]+)"/) ||
    html.match(/confirm=([a-zA-Z0-9_-]+)/) ||
    html.match(/"downloadUrl":"([^"]+)"/);
  return match ? { token: match[1], matchStr: match[0] } : null;
};
