"use client";

import React from "react";

interface BrandLogoProps {
  variant?: "public" | "internal";
  size?: "sm" | "md";
}

/**
 * Swiss Minimalist Geometric Logo (ELCA-inspired)
 * Zero purple gradients, zero generic Lucide briefcase-in-a-box.
 * Uses strict two-tone palette: Charcoal (#111827) + Brand Crimson (#D92027).
 */
export default function BrandLogo({ variant = "internal", size = "md" }: BrandLogoProps) {
  const iconDim = size === "sm" ? "w-6 h-6" : "w-7 h-7";
  const textClass = size === "sm" ? "text-base" : "text-lg";

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconDim} shrink-0`}
        aria-hidden="true"
      >
        <rect x="2" y="2" width="11" height="24" rx="1.5" fill="#111827" />
        <rect x="15" y="2" width="11" height="11" rx="1.5" fill="#D92027" />
        <rect x="15" y="15" width="11" height="11" rx="1.5" fill="#E5E7EB" />
      </svg>
      <span className="flex items-baseline gap-2 leading-none">
        <span className={`font-semibold tracking-tight text-zinc-900 ${textClass}`}>
          {variant === "public" ? "RecoverX" : "ATS"}
        </span>
        {variant === "public" ? (
          <span className="text-xs font-medium text-zinc-400">Careers</span>
        ) : (
          <span className="text-xs font-normal text-zinc-400 hidden sm:inline">
            Applicant Tracking
          </span>
        )}
      </span>
    </span>
  );
}
