import "server-only";
import type { Locale } from "@/i18n/config";

const dictionaries = {
  id: () => import("@/dictionaries/id.json").then((module) => module.default),
  en: () => import("@/dictionaries/en.json").then((module) => module.default),
};

export const hasLocale = (locale: string): locale is Locale =>
  locale in dictionaries;

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["id"]>>;

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]();
