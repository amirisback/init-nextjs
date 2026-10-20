import { describe, it, expect } from "vitest";
import { obfuscateId, deobfuscateId, deobfuscateIds } from "../obfuscator";

describe("Sqids Obfuscator Utility", () => {
  it("should obfuscate and deobfuscate single IDs correctly", () => {
    const id = 42;
    const hash = obfuscateId(id);

    expect(typeof hash).toBe("string");
    expect(hash.length).toBeGreaterThanOrEqual(6);

    const decoded = deobfuscateId(hash);
    expect(decoded).toBe(id);
  });

  it("should obfuscate and deobfuscate multiple IDs correctly", () => {
    const ids = [10, 20, 30];
    const hash = obfuscateId(ids);

    expect(typeof hash).toBe("string");
    const decoded = deobfuscateIds(hash);
    expect(decoded).toEqual(ids);
  });

  it("should throw error for negative numbers or non-integers", () => {
    expect(() => obfuscateId(-1)).toThrow();
    expect(() => obfuscateId(3.14)).toThrow();
    expect(() => obfuscateId([])).toThrow();
  });

  it("should return null or empty array for invalid hashes", () => {
    expect(deobfuscateId("")).toBeNull();
    expect(deobfuscateId("!@#$%^&*()")).toBeNull();
    expect(deobfuscateIds("")).toEqual([]);
  });
});
