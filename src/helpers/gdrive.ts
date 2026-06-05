export interface DriveFile {
  buffer: ArrayBuffer;
  mimeType: string;
  fileName: string;
}

const SUPPORTED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/mpeg",
]);

function extractFileId(url: string): string {
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error("Cannot extract file ID from Google Drive URL");
  return match[1];
}

function guessMimeType(contentType: string | null, fileId: string): string {
  if (contentType) {
    const base = contentType.split(";")[0].trim().toLowerCase();
    if (SUPPORTED_MIME_TYPES.has(base)) return base;
  }
  return "image/jpeg";
}

export async function downloadFromDrive(url: string): Promise<DriveFile> {
  const fileId = extractFileId(url);

  // Try direct download URL first
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

  let response = await fetch(downloadUrl, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; creative-analyzer/1.0)",
    },
  });

  if (!response.ok) {
    throw new Error(`Google Drive returned ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  // Google shows a virus scan warning HTML page for large files
  if (contentType.includes("text/html")) {
    const html = await response.text();

    // Extract confirmation token from the warning page
    const tokenMatch =
      html.match(/name="uuid"\s+value="([^"]+)"/) ||
      html.match(/confirm=([a-zA-Z0-9_-]+)/) ||
      html.match(/"downloadUrl":"([^"]+)"/);

    if (!tokenMatch) {
      throw new Error(
        "File requires Google Drive confirmation but token not found. File may be private or unavailable."
      );
    }

    // Build confirmed download URL
    let confirmedUrl: string;
    if (tokenMatch[0].startsWith('"downloadUrl"')) {
      // Direct URL embedded in page
      confirmedUrl = tokenMatch[1].replace(/\\u003d/g, "=").replace(/\\u0026/g, "&");
    } else if (tokenMatch[0].startsWith("name=")) {
      confirmedUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${tokenMatch[1]}`;
    } else {
      confirmedUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${tokenMatch[1]}`;
    }

    response = await fetch(confirmedUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; creative-analyzer/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Confirmed download failed with ${response.status}`);
    }
  }

  const finalContentType = response.headers.get("content-type") ?? "";
  const mimeType = guessMimeType(finalContentType, fileId);

  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    throw new Error(
      `Unsupported file type: ${mimeType}. Only images and videos are supported.`
    );
  }

  const buffer = await response.arrayBuffer();

  if (buffer.byteLength === 0) {
    throw new Error("Downloaded file is empty");
  }

  // Rough size limit: 50MB (Gemini supports up to ~20MB inline)
  const MB = 1024 * 1024;
  if (buffer.byteLength > 50 * MB) {
    throw new Error(
      `File too large: ${Math.round(buffer.byteLength / MB)}MB. Maximum is 50MB.`
    );
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const nameMatch = disposition.match(/filename[^;=\n]*=(?:(['"])([^'"]*)\1|([^\s;]*))/);
  const fileName = nameMatch?.[2] ?? nameMatch?.[3] ?? fileId;

  return { buffer, mimeType, fileName };
}
