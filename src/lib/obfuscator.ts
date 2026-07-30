import Sqids from "sqids";

// Custom alphabet from environment variables, or fallback to default
const alphabet = process.env.SQIDS_ALPHABET;

// Instantiate Sqids. We set a minimum length of 6 characters for a professional appearance in URLs.
const sqids = new Sqids({
  alphabet,
  minLength: 6,
});

/**
 * Obfuscates a single positive integer ID (or array of integers) into a short, unique, and URL-friendly string.
 * Useful for hiding database auto-increment IDs.
 * 
 * @param id A single number or array of numbers to obfuscate
 * @returns An obfuscated string (e.g., "8g9a5k")
 * @throws Error if input contains negative numbers
 */
export function obfuscateId(id: number | number[]): string {
  try {
    const ids = Array.isArray(id) ? id : [id];
    
    // Sqids only supports non-negative integers
    if (ids.some((val) => val < 0 || !Number.isInteger(val))) {
      throw new Error("Sqids only supports non-negative integers.");
    }
    
    return sqids.encode(ids);
  } catch (error) {
    console.error("[Obfuscate ID Error]:", error);
    throw error;
  }
}

/**
 * Deobfuscates a Sqids string back into its original positive integer ID (or array of integers).
 * 
 * @param hash The obfuscated string to decode
 * @returns The original number ID, an array of number IDs, or null if the hash is invalid
 */
export function deobfuscateId(hash: string): number | null {
  try {
    if (!hash || typeof hash !== "string") return null;
    
    const result = sqids.decode(hash);
    
    if (result.length === 0) {
      return null;
    }
    
    return result[0];
  } catch (error) {
    console.error("[Deobfuscate ID Error]:", error);
    return null;
  }
}

/**
 * Deobfuscates a Sqids string back into its original array of integers.
 * 
 * @param hash The obfuscated string to decode
 * @returns An array of decoded integers, or an empty array if invalid
 */
export function deobfuscateIds(hash: string): number[] {
  try {
    if (!hash || typeof hash !== "string") return [];
    return sqids.decode(hash);
  } catch (error) {
    console.error("[Deobfuscate IDs Error]:", error);
    return [];
  }
}
