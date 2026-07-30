"use server";

import { obfuscateId, deobfuscateId } from "@/lib/obfuscator";
import { encrypt, decrypt } from "@/lib/crypto";

/**
 * Server Action to safely obfuscate an integer ID on the server.
 * Keeps the Sqids configuration and alphabet hidden from the client bundle.
 */
export async function obfuscateAction(id: number): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    if (!Number.isInteger(id) || id < 0) {
      return { success: false, error: "Only non-negative integers can be obfuscated." };
    }
    const hash = obfuscateId(id);
    return { success: true, result: hash };
  } catch (error) {
    return { success: false, error: (error as Error).message || "Obfuscation failed." };
  }
}

/**
 * Server Action to safely deobfuscate a Sqids hash on the server.
 */
export async function deobfuscateAction(hash: string): Promise<{ success: boolean; result?: number; error?: string }> {
  try {
    if (!hash || typeof hash !== "string") {
      return { success: false, error: "Hash string is required." };
    }
    const id = deobfuscateId(hash.trim());
    if (id === null) {
      return { success: false, error: "Invalid or corrupted obfuscated hash." };
    }
    return { success: true, result: id };
  } catch {
    return { success: false, error: "Deobfuscation failed." };
  }
}

/**
 * Server Action to encrypt sensitive text using AES-256-GCM.
 */
export async function encryptAction(text: string): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    if (!text) {
      return { success: false, error: "Text to encrypt cannot be empty." };
    }
    const encrypted = encrypt(text);
    return { success: true, result: encrypted };
  } catch (error) {
    return { success: false, error: (error as Error).message || "Encryption failed." };
  }
}

/**
 * Server Action to decrypt AES-256-GCM encrypted text.
 */
export async function decryptAction(encryptedText: string): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    if (!encryptedText) {
      return { success: false, error: "Encrypted text cannot be empty." };
    }
    const decrypted = decrypt(encryptedText.trim());
    if (decrypted === null) {
      return { success: false, error: "Decryption failed. The data may be tampered with, expired, or encrypted with a different key." };
    }
    return { success: true, result: decrypted };
  } catch {
    return { success: false, error: "Decryption failed." };
  }
}
