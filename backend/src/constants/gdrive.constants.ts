export const GDRIVE_DOWNLOAD_URL = "https://drive.google.com/uc?export=download&id=";
export const GDRIVE_USERCONTENT_URL = "https://drive.usercontent.google.com/download";

export const SUPPORTED_MIME_TYPES = new Set([
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

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const DEFAULT_MIME_TYPE = "image/jpeg";
export const USER_AGENT = "Mozilla/5.0 (compatible; creative-analyzer/1.0)";
