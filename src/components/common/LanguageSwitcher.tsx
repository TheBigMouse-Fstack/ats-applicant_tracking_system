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
      className={`inline-flex items-center gap-0.5 p-0.5 rounded-full bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 text-[11px] font-bold text-slate-600 transition-colors shadow-2xs ${className}`}
      title={locale === "vi" ? "Chuyển sang Tiếng Anh (English)" : "Switch to Vietnamese (Tiếng Việt)"}
    >
      <Globe className="w-3.5 h-3.5 ml-1.5 mr-0.5 text-slate-400 shrink-0" />
      <button
        type="button"
        onClick={() => setLocale("vi")}
        aria-label="Tiếng Việt"
        className={`px-2 py-0.5 rounded-full transition-all duration-150 cursor-pointer ${
          locale === "vi"
            ? "bg-white text-brand-700 shadow-2xs font-extrabold"
            : "text-slate-500 hover:text-slate-900 font-medium"
        }`}
      >
        VI
      </button>
      <span className="text-slate-300 text-[10px] select-none">•</span>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-label="English"
        className={`px-2 py-0.5 rounded-full transition-all duration-150 cursor-pointer ${
          locale === "en"
            ? "bg-white text-brand-700 shadow-2xs font-extrabold"
            : "text-slate-500 hover:text-slate-900 font-medium"
        }`}
      >
        EN
      </button>
    </div>
  );
}
