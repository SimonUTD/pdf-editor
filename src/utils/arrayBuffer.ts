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
