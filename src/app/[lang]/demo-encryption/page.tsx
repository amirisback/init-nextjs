import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import DemoClient from "./DemoClient";
import type { Locale } from "@/i18n/config";

interface PageParams {
  lang: string;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { lang } = await params;

  if (!hasLocale(lang)) {
    return { title: "Encryption Demo — Amir App" };
  }

  const dict = await getDictionary(lang as Locale);

  return {
    title: `${dict.demo.title} — ${dict.metadata.title}`,
    description: dict.demo.subtitle,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function EncryptionDemoPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { lang } = await params;

  // Validate that the language route segment is correct
  if (!hasLocale(lang)) {
    notFound();
  }

  // Load translations on the server
  const dict = await getDictionary(lang as Locale);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex flex-col justify-center items-center py-8">
      <DemoClient
        dict={dict.demo}
        common={dict.common}
        lang={lang}
      />
    </div>
  );
}
