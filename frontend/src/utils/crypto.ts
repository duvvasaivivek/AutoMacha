/**
 * Web Crypto API (AES-256-GCM) End-to-End Encryption (E2EE) Utility for AutoMacha Chat.
 * Provides client-side zero-knowledge encryption & decryption.
 */

// Helper to convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a deterministic 256-bit AES-GCM CryptoKey using PBKDF2
 * from room metadata (rideRequestId + participant usernames).
 */
export async function deriveRoomKey(
  rideRequestId: number,
  requesterUsername: string,
  partnerUsername: string
): Promise<CryptoKey> {
  const sortedUsernames = [requesterUsername, partnerUsername].sort().join(':');
  const secretMaterialStr = `AutoMacha:E2EE:v1:Room#${rideRequestId}:${sortedUsernames}`;

  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(secretMaterialStr),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const salt = encoder.encode(`salt:AutoMacha:${rideRequestId}`);

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plain text message using AES-GCM-256 and returns base64 cipher + IV.
 */
export async function encryptMessage(
  plainText: string,
  key: CryptoKey
): Promise<{ cipherText: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);

  // Generate random 12-byte IV for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as unknown as BufferSource,
    },
    key,
    data as unknown as BufferSource
  );

  return {
    cipherText: arrayBufferToBase64(encryptedBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts base64 cipher text using AES-GCM-256 key and IV.
 * Falls back to returning cipher text if decryption fails or message is unencrypted.
 */
export async function decryptMessage(
  cipherText: string,
  ivBase64: string | undefined | null,
  key: CryptoKey | null
): Promise<string> {
  if (!cipherText || !ivBase64 || !key) {
    return cipherText;
  }

  try {
    const encryptedData = base64ToUint8Array(cipherText);
    const iv = base64ToUint8Array(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as unknown as BufferSource,
      },
      key,
      encryptedData as unknown as BufferSource
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    // If text was plaintext or decryption key failed, return original text safely
    return cipherText;
  }
}
