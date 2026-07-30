"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

interface ThemeSwitcherProps {
  labels?: {
    light: string;
    dark: string;
    system: string;
  };
}

const emptySubscribe = () => () => {};

function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function ThemeSwitcher({ labels }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const isMounted = useIsMounted();

  const lightLabel = labels?.light || "Light";
  const darkLabel = labels?.dark || "Dark";
  const systemLabel = labels?.system || "System";

  if (!isMounted) {
    return (
      <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-zinc-200 dark:border-zinc-700/60 shadow-xs h-[34px] w-[140px] animate-pulse" />
    );
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-zinc-200 dark:border-zinc-700/60 shadow-xs">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
          theme === "light"
            ? "bg-white text-zinc-900 shadow-xs scale-[1.02]"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
        aria-label={lightLabel}
        title={lightLabel}
      >
        <span>☀️</span>
        <span className="hidden sm:inline">{lightLabel}</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
          theme === "dark"
            ? "bg-zinc-900 text-zinc-100 shadow-xs scale-[1.02]"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
        aria-label={darkLabel}
        title={darkLabel}
      >
        <span>🌙</span>
        <span className="hidden sm:inline">{darkLabel}</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
          theme === "system"
            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs scale-[1.02]"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
        }`}
        aria-label={systemLabel}
        title={systemLabel}
      >
        <span>💻</span>
        <span className="hidden sm:inline">{systemLabel}</span>
      </button>
    </div>
  );
}
