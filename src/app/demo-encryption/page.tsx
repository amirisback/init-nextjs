import type { Metadata } from "next";
import { getCurrentDictionary } from "@/lib/i18n-server";
import DemoClient from "./DemoClient";
import { LanguageSwitcher } from "../_components/language-switcher";

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getCurrentDictionary();

  return {
    title: `${dict.demo.title} — ${dict.metadata.title}`,
    description: dict.demo.subtitle,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function EncryptionDemoPage() {
  const { locale, dict } = await getCurrentDictionary();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col justify-center items-center py-8">
      <div className="w-full max-w-6xl px-4 flex justify-end">
        <LanguageSwitcher currentLocale={locale} />
      </div>
      <DemoClient
        dict={dict.demo}
        common={dict.common}
      />
    </div>
  );
}
