"use client";

import React, { useEffect } from "react";
import { HiX } from "react-icons/hi";
import MinimalPdfPreview from "@/components/ui/MinimalPdfPreview";

type InfluencerSidebarShellProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  previewUrl?: string;
  previewBlob?: Blob | null;
  sidebarOffset?: number;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  pdfOnly?: boolean;
};

export default function InfluencerSidebarShell({
  isOpen,
  onClose,
  title,
  subtitle,
  previewUrl,
  previewBlob,
  sidebarOffset = 0,
  footer,
  children,
  pdfOnly = false,
}: InfluencerSidebarShellProps) {
  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  console.log("pdfOnly",pdfOnly)
  return (
    // Full-screen overlay
    <div
      className="fixed inset-0 z-[50] flex"
      style={{ left: sidebarOffset }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Shell panel — slides in from right, covers area to the right of the sidebar */}
      <div
        className="relative z-[51] ml-auto flex h-full w-full flex-col bg-white shadow-2xl"
        style={{ maxWidth: "calc(100vw - " + sidebarOffset + "px)" }}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="flex min-w-0 flex-col">
            {title && (
              <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                {title}
              </span>
            )}
            {subtitle && (
              <span className="truncate text-base font-semibold text-gray-900">
                {subtitle}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close"
          >
            <HiX size={20} />
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* Left panel — form fields (hidden when pdfOnly) */}
          {!pdfOnly && children && (
            <div className="flex w-1/2 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-[#FAFAFA]">
              <div className="flex-1 space-y-4 p-5">
                {children}
              </div>
            </div>
          )}

          {/* Right panel — PDF preview (full width when pdfOnly, else other half) */}
          <div className={`flex flex-col overflow-hidden ${pdfOnly ? "w-full" : "w-1/2"}`}>
            {previewBlob ? (
              <MinimalPdfPreview file={previewBlob} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#FFF9E6] text-gray-400">
                <svg
                  className="h-12 w-12 opacity-30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm">Loading contract preview…</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────── */}
        {footer && (
          <div className="flex h-16 shrink-0 items-center gap-3 border-t border-gray-200 bg-white px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}