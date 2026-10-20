import { describe, it, expect } from "vitest";
import { hasLocale, getDictionary } from "../dictionaries";
import { i18n } from "@/i18n/config";

describe("i18n & Dictionary Loader", () => {
  it("should validate supported locales properly", () => {
    expect(hasLocale("id")).toBe(true);
    expect(hasLocale("en")).toBe(true);
    expect(hasLocale("fr")).toBe(false);
    expect(hasLocale("")).toBe(false);
  });

  it("should load dictionaries for all configured locales", async () => {
    for (const locale of i18n.locales) {
      const dict = await getDictionary(locale);
      expect(dict).toBeDefined();
      expect(dict.common).toBeDefined();
      expect(dict.home).toBeDefined();
      expect(dict.metadata).toBeDefined();
      expect(dict.theme).toBeDefined();
      expect(dict.demo).toBeDefined();
    }
  });

  it("should have identical key structures across id and en dictionaries", async () => {
    const idDict = await getDictionary("id");
    const enDict = await getDictionary("en");

    function extractKeys(obj: Record<string, unknown>, prefix = ""): string[] {
      return Object.keys(obj).flatMap((key) => {
        const full = prefix ? `${prefix}.${key}` : key;
        const val = obj[key];
        return typeof val === "object" && val !== null
          ? extractKeys(val as Record<string, unknown>, full)
          : [full];
      });
    }

    const idKeys = extractKeys(idDict).sort();
    const enKeys = extractKeys(enDict).sort();

    expect(idKeys).toEqual(enKeys);
  });
});
