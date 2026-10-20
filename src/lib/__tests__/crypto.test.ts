import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../crypto";

describe("AES-256-GCM Crypto Utility", () => {
  it("should encrypt and decrypt a string accurately", () => {
    const original = "secure-user-session-id-12345";
    const encrypted = encrypt(original);

    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe("string");
    expect(encrypted).not.toBe(original);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should return null when decrypting a tampered payload", () => {
    const original = "tamper-proof-data";
    const encrypted = encrypt(original);

    // Tamper with characters in the encrypted payload
    const tampered = encrypted.slice(0, -3) + "xyz";
    const result = decrypt(tampered);

    expect(result).toBeNull();
  });

  it("should return null for empty or invalid decrypt inputs", () => {
    expect(decrypt("")).toBeNull();
    expect(decrypt("short")).toBeNull();
    expect(decrypt("invalid-base64-!@#$%^")).toBeNull();
  });

  it("should throw error when encrypting empty string", () => {
    expect(() => encrypt("")).toThrow("Text to encrypt cannot be empty.");
  });

  it("should generate different ciphertexts for the same plaintext due to random IV", () => {
    const text = "repeatable-text";
    const cipher1 = encrypt(text);
    const cipher2 = encrypt(text);

    expect(cipher1).not.toBe(cipher2);
    expect(decrypt(cipher1)).toBe(text);
    expect(decrypt(cipher2)).toBe(text);
  });
});
