"use client";

import { useState } from "react";
import {
  obfuscateAction,
  deobfuscateAction,
  encryptAction,
  decryptAction,
} from "./actions";

interface DemoClientProps {
  dict: {
    title: string;
    subtitle: string;
    intro: string;
    obfuscationTitle: string;
    obfuscationDesc: string;
    obfuscationPlaceholder: string;
    obfuscateButton: string;
    deobfuscateButton: string;
    encryptionTitle: string;
    encryptionDesc: string;
    encryptionPlaceholder: string;
    encryptButton: string;
    decryptButton: string;
    result: string;
    original: string;
    processed: string;
    errorInvalidNumber: string;
    errorEmptyText: string;
    success: string;
  };
  common: {
    back: string;
    loading: string;
    appName: string;
  };
  lang: string;
}

export default function DemoClient({ dict, common, lang }: DemoClientProps) {
  // Sqids States
  const [sqidInput, setSqidInput] = useState<string>("");
  const [sqidResult, setSqidResult] = useState<{
    original?: string;
    processed?: string;
    type?: "encode" | "decode";
    success: boolean;
    error?: string;
  } | null>(null);
  const [sqidLoading, setSqidLoading] = useState<boolean>(false);

  // AES States
  const [aesInput, setAesInput] = useState<string>("");
  const [aesResult, setAesResult] = useState<{
    original?: string;
    processed?: string;
    type?: "encrypt" | "decrypt";
    success: boolean;
    error?: string;
  } | null>(null);
  const [aesLoading, setAesLoading] = useState<boolean>(false);

  // General Notification State
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // 1. Sqids Obfuscate
  const handleSqidObfuscate = async () => {
    if (!sqidInput.trim()) return;
    const num = parseInt(sqidInput, 10);
    if (isNaN(num) || num < 0) {
      setSqidResult({ success: false, error: dict.errorInvalidNumber });
      return;
    }

    setSqidLoading(true);
    const res = await obfuscateAction(num);
    setSqidLoading(false);

    if (res.success && res.result) {
      setSqidResult({
        success: true,
        type: "encode",
        original: sqidInput,
        processed: res.result,
      });
    } else {
      setSqidResult({ success: false, error: res.error });
    }
  };

  // 2. Sqids Deobfuscate
  const handleSqidDeobfuscate = async () => {
    if (!sqidInput.trim()) return;
    
    setSqidLoading(true);
    const res = await deobfuscateAction(sqidInput.trim());
    setSqidLoading(false);

    if (res.success && res.result !== undefined) {
      setSqidResult({
        success: true,
        type: "decode",
        original: sqidInput,
        processed: res.result.toString(),
      });
    } else {
      setSqidResult({ success: false, error: res.error });
    }
  };

  // 3. AES Encrypt
  const handleAesEncrypt = async () => {
    if (!aesInput.trim()) {
      setAesResult({ success: false, error: dict.errorEmptyText });
      return;
    }

    setAesLoading(true);
    const res = await encryptAction(aesInput);
    setAesLoading(false);

    if (res.success && res.result) {
      setAesResult({
        success: true,
        type: "encrypt",
        original: aesInput,
        processed: res.result,
      });
    } else {
      setAesResult({ success: false, error: res.error });
    }
  };

  // 4. AES Decrypt
  const handleAesDecrypt = async () => {
    if (!aesInput.trim()) {
      setAesResult({ success: false, error: dict.errorEmptyText });
      return;
    }

    setAesLoading(true);
    const res = await decryptAction(aesInput);
    setAesLoading(false);

    if (res.success && res.result) {
      setAesResult({
        success: true,
        type: "decrypt",
        original: aesInput,
        processed: res.result,
      });
    } else {
      setAesResult({ success: false, error: res.error });
    }
  };

  return (
    <div className="w-full max-w-6xl px-4 py-12 mx-auto font-sans text-zinc-900 dark:text-zinc-100">
      
      {/* Header Section */}
      <div className="relative mb-12 text-center">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-zinc-500/10 dark:bg-white/5 rounded-full blur-3xl -z-10" />
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-white dark:via-zinc-300 dark:to-zinc-500">
          {dict.title}
        </h1>
        <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
          {dict.subtitle}
        </p>
        <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500 max-w-lg mx-auto">
          {dict.intro}
        </p>
      </div>

      {/* Grid Layout for Obfuscation & Encryption */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">

        {/* 1. Obfuscation Card (Sqids) */}
        <div className="flex flex-col p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-500/5 dark:hover:shadow-black/50 hover:border-zinc-300 dark:hover:border-zinc-700 relative overflow-hidden">
          
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
              <svg className="w-6 h-6 text-zinc-700 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">{dict.obfuscationTitle}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">Sqids Utility</span>
            </div>
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 flex-grow">
            {dict.obfuscationDesc}
          </p>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={sqidInput}
                onChange={(e) => setSqidInput(e.target.value)}
                placeholder={dict.obfuscationPlaceholder}
                className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all font-mono placeholder:font-sans"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSqidObfuscate}
                disabled={sqidLoading || !sqidInput.trim()}
                className="flex-1 py-3 px-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {sqidLoading ? (
                  <span className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                ) : (
                  dict.obfuscateButton
                )}
              </button>
              <button
                onClick={handleSqidDeobfuscate}
                disabled={sqidLoading || !sqidInput.trim()}
                className="flex-1 py-3 px-4 border border-zinc-200 dark:border-zinc-800 font-medium rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-950 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {dict.deobfuscateButton}
              </button>
            </div>
          </div>

          {/* Sqids Result Container */}
          {sqidResult && (
            <div className={`mt-6 p-5 rounded-2xl border transition-all duration-300 ${
              sqidResult.success 
                ? "bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200/60 dark:border-zinc-800/60" 
                : "bg-red-500/5 dark:bg-red-500/10 border-red-200/30 dark:border-red-800/30 text-red-600 dark:text-red-400"
            }`}>
              {sqidResult.success ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <span>{dict.result}</span>
                    <span className="text-zinc-500 dark:text-zinc-300 bg-zinc-200/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded">
                      {sqidResult.type === "encode" ? "Encoded" : "Decoded"}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-400">{dict.original}:</span>
                    <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800/40 truncate">
                      {sqidResult.original}
                    </p>
                  </div>

                  <div className="space-y-1 relative group">
                    <span className="text-xs text-zinc-400">{dict.processed}:</span>
                    <div className="flex gap-2 items-center">
                      <p className="flex-1 font-mono text-base font-bold text-zinc-800 dark:text-zinc-100 bg-zinc-200/50 dark:bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 truncate">
                        {sqidResult.processed}
                      </p>
                      <button
                        onClick={() => handleCopy(sqidResult.processed || "", "sqid")}
                        className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg active:scale-95 transition-all text-zinc-500 dark:text-zinc-400"
                        title="Copy to clipboard"
                      >
                        {copied === "sqid" ? (
                          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-center text-sm font-medium">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{sqidResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. Encryption Card (AES-256-GCM) */}
        <div className="flex flex-col p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-zinc-500/5 dark:hover:shadow-black/50 hover:border-zinc-300 dark:hover:border-zinc-700 relative overflow-hidden">
          
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
              <svg className="w-6 h-6 text-zinc-700 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold">{dict.encryptionTitle}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">AES-256-GCM (Secure)</span>
            </div>
          </div>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 flex-grow">
            {dict.encryptionDesc}
          </p>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={aesInput}
                onChange={(e) => setAesInput(e.target.value)}
                placeholder={dict.encryptionPlaceholder}
                className="w-full px-5 py-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-all font-mono placeholder:font-sans"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAesEncrypt}
                disabled={aesLoading || !aesInput.trim()}
                className="flex-1 py-3 px-4 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium rounded-2xl hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {aesLoading ? (
                  <span className="w-5 h-5 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
                ) : (
                  dict.encryptButton
                )}
              </button>
              <button
                onClick={handleAesDecrypt}
                disabled={aesLoading || !aesInput.trim()}
                className="flex-1 py-3 px-4 border border-zinc-200 dark:border-zinc-800 font-medium rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-950 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {dict.decryptButton}
              </button>
            </div>
          </div>

          {/* AES Result Container */}
          {aesResult && (
            <div className={`mt-6 p-5 rounded-2xl border transition-all duration-300 ${
              aesResult.success 
                ? "bg-zinc-50/50 dark:bg-zinc-950/50 border-zinc-200/60 dark:border-zinc-800/60" 
                : "bg-red-500/5 dark:bg-red-500/10 border-red-200/30 dark:border-red-800/30 text-red-600 dark:text-red-400"
            }`}>
              {aesResult.success ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    <span>{dict.result}</span>
                    <span className="text-zinc-500 dark:text-zinc-300 bg-zinc-200/60 dark:bg-zinc-800/60 px-2 py-0.5 rounded">
                      {aesResult.type === "encrypt" ? "Encrypted" : "Decrypted"}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-xs text-zinc-400">{dict.original}:</span>
                    <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800/40 truncate">
                      {aesResult.original}
                    </p>
                  </div>

                  <div className="space-y-1 relative group">
                    <span className="text-xs text-zinc-400">{dict.processed}:</span>
                    <div className="flex gap-2 items-center">
                      <p className="flex-1 font-mono text-sm bg-zinc-200/50 dark:bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 break-all select-all leading-relaxed">
                        {aesResult.processed}
                      </p>
                      <button
                        onClick={() => handleCopy(aesResult.processed || "", "aes")}
                        className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg active:scale-95 transition-all text-zinc-500 dark:text-zinc-400 flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        {copied === "aes" ? (
                          <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-center text-sm font-medium">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{aesResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Back Button */}
      <div className="mt-12 text-center">
        <a
          href={`/${lang}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {common.back}
        </a>
      </div>
    </div>
  );
}
