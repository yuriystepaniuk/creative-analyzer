import { SUPPORTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "../constants/gdrive.constants";

export const validateBuffer = (buffer: ArrayBuffer, mimeType: string): void => {
  if (buffer.byteLength === 0) {
    throw new Error("Завантажений файл порожній");
  }
  if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
    const mb = Math.round(buffer.byteLength / (1024 * 1024));
    throw new Error(`Файл занадто великий: ${mb}MB. Максимум — 50MB.`);
  }
  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    throw new Error(`Непідтримуваний тип файлу: ${mimeType}. Підтримуються лише зображення та відео.`);
  }
};
