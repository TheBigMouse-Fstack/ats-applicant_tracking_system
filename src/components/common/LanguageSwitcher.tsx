"use client";

import { useLanguage } from "@/lib/i18n";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold ${className}`}
      title={locale === "vi" ? "Chuyển sang Tiếng Anh (Switch to English)" : "Switch to Vietnamese (Chuyển sang Tiếng Việt)"}
    >
      <button
        type="button"
        onClick={() => setLocale("vi")}
        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
          locale === "vi"
            ? "bg-white text-slate-900 shadow-2xs font-bold"
            : "text-slate-500 hover:text-slate-700 font-semibold"
        }`}
      >
        <span>🇻🇳</span>
        <span>VI</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
          locale === "en"
            ? "bg-white text-slate-900 shadow-2xs font-bold"
            : "text-slate-500 hover:text-slate-700 font-semibold"
        }`}
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}
