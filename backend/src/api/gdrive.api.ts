import {
  GDRIVE_DOWNLOAD_URL,
  GDRIVE_USERCONTENT_URL,
  SUPPORTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  DEFAULT_MIME_TYPE,
  USER_AGENT,
} from "../constants/gdrive.constants";
import type { DriveFile } from "../interfaces/analysis";

const FETCH_HEADERS = { "User-Agent": USER_AGENT };

function extractFileId(url: string): string {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error("Cannot extract file ID from Google Drive URL");
  return match[1];
}

function parseMimeType(contentType: string | null): string {
  if (!contentType) return DEFAULT_MIME_TYPE;
  const base = contentType.split(";")[0].trim().toLowerCase();
  return SUPPORTED_MIME_TYPES.has(base) ? base : DEFAULT_MIME_TYPE;
}

function buildConfirmedUrl(fileId: string, token: string, matchStr: string): string {
  if (matchStr.startsWith('"downloadUrl"')) {
    return token.replace(/\\u003d/g, "=").replace(/\\u0026/g, "&");
  }
  if (matchStr.startsWith("name=")) {
    return `${GDRIVE_USERCONTENT_URL}?id=${fileId}&export=download&confirm=${token}`;
  }
  return `${GDRIVE_DOWNLOAD_URL}${fileId}&confirm=${token}`;
}

async function resolveConfirmationPage(response: Response, fileId: string): Promise<Response> {
  const html = await response.text();
  const match =
    html.match(/name="uuid"\s+value="([^"]+)"/) ||
    html.match(/confirm=([a-zA-Z0-9_-]+)/) ||
    html.match(/"downloadUrl":"([^"]+)"/);

  if (!match) {
    throw new Error(
      "File requires Google Drive confirmation but token not found. File may be private or unavailable."
    );
  }

  const confirmedUrl = buildConfirmedUrl(fileId, match[1], match[0]);
  const confirmed = await fetch(confirmedUrl, { redirect: "follow", headers: FETCH_HEADERS });

  if (!confirmed.ok) {
    throw new Error(`Confirmed download failed with status ${confirmed.status}`);
  }

  return confirmed;
}

function validateBuffer(buffer: ArrayBuffer, mimeType: string): void {
  if (buffer.byteLength === 0) {
    throw new Error("Downloaded file is empty");
  }
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    const mb = Math.round(buffer.byteLength / (1024 * 1024));
    throw new Error(`File too large: ${mb}MB. Maximum is 50MB.`);
  }
  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Only images and videos are supported.`);
  }
}

function parseFileName(response: Response, fallback: string): string {
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename[^;=\n]*=(?:(['"])([^'"]*)\1|([^\s;]*))/);
  return match?.[2] ?? match?.[3] ?? fallback;
}

export async function downloadFromDrive(url: string): Promise<DriveFile> {
  const fileId = extractFileId(url);

  let response = await fetch(`${GDRIVE_DOWNLOAD_URL}${fileId}`, {
    redirect: "follow",
    headers: FETCH_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Google Drive returned status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) {
    response = await resolveConfirmationPage(response, fileId);
  }

  const mimeType = parseMimeType(response.headers.get("content-type"));
  const buffer = await response.arrayBuffer();

  validateBuffer(buffer, mimeType);

  return {
    buffer,
    mimeType,
    fileName: parseFileName(response, fileId),
  };
}
