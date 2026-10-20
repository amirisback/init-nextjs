import "server-only";
import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard IV length for GCM (96 bits)
const TAG_LENGTH = 16; // Standard tag length for GCM (128 bits)

// Get the encryption key from env. Must be exactly 32 bytes (256 bits) for aes-256
const rawKey = process.env.ENCRYPTION_KEY || "";

let key: Buffer;
if (Buffer.byteLength(rawKey, "utf8") === 32) {
  key = Buffer.from(rawKey, "utf8");
} else {
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "⚠️ [Crypto Warning]: ENCRYPTION_KEY is not exactly 32 bytes long. Adjusting size via SHA-256 hash, but you should set a secure 32-byte key in production."
    );
  }
  // Fallback/adjustment to ensure it does not throw: create a 32-byte hash from the key
  key = crypto
    .createHash("sha256")
    .update(rawKey || "fallback-static-key-32-chars-long")
    .digest();
}

/**
 * Encrypts a string (e.g. an ID, string representation of object, UUID) using AES-256-GCM.
 * This is highly secure, tamper-proof, and can only run on the server.
 * 
 * @param text The plain text string to encrypt
 * @returns A URL-safe Base64 encoded string containing the encrypted payload, IV, and Auth Tag.
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error("Text to encrypt cannot be empty.");
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const ciphertext = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Pack iv, authTag, and ciphertext together into a single buffer
    const combinedBuffer = Buffer.concat([iv, authTag, ciphertext]);

    // Encode as URL-safe Base64
    return combinedBuffer
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (error) {
    console.error("[Encryption Error]:", error);
    throw new Error("Failed to encrypt the provided data.");
  }
}

/**
 * Decrypts a URL-safe Base64 encoded string back to its original plain text.
 * Authenticates the payload before decrypting to prevent tampering.
 * 
 * @param encryptedText The URL-safe Base64 string containing the encrypted payload
 * @returns The original plain text string, or null if decryption/authentication fails
 */
export function decrypt(encryptedText: string): string | null {
  if (!encryptedText) return null;

  try {
    // Restore standard Base64 padding and characters
    let base64 = encryptedText.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }

    const combinedBuffer = Buffer.from(base64, "base64");

    // Extract IV, Auth Tag, and Ciphertext
    if (combinedBuffer.length < IV_LENGTH + TAG_LENGTH) {
      throw new Error("Invalid or corrupted encrypted data payload length.");
    }

    const iv = combinedBuffer.subarray(0, IV_LENGTH);
    const tag = combinedBuffer.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const ciphertext = combinedBuffer.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");

    return decrypted;
  } catch (error) {
    // Graceful error logging - standard for cryptographically failed inputs (e.g. tampering, expired, wrong key)
    console.error(
      "[Decryption Error (Possibly Tampered or Invalid Key)]:",
      (error as Error).message
    );
    return null;
  }
}
