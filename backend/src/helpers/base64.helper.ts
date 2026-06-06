export const toBase64 = (buffer: ArrayBuffer): string =>
  btoa(new Uint8Array(buffer).reduce((acc, byte) => acc + String.fromCharCode(byte), ""));
