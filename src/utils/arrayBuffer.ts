/**
 * Converts Uint8Array buffer to ArrayBuffer
 * This is needed because Uint8Array.buffer returns ArrayBufferLike
 * which TypeScript doesn't always accept as ArrayBuffer
 */
export function getArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
  // Create a copy of the buffer to ensure it's a true ArrayBuffer
  const arrayBuffer = new ArrayBuffer(uint8Array.byteLength);
  new Uint8Array(arrayBuffer).set(uint8Array);
  return arrayBuffer;
}

/**
 * Converts base64 data URL to Uint8Array
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  // Remove data URL prefix (e.g., "data:image/png;base64,")
  const base64Data = base64.split(',')[1] || base64;

  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
