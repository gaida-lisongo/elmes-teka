"use client";

import React, { useEffect, useCallback } from "react";
import { CloseIcon } from "@/icons";
import { ProgressBar } from "@/components/ui/spinner/Spinner";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: "lg" | "xl";
  /** Action en cours : barre de progression, contenu non cliquable, fermeture bloquée. */
  loading?: boolean;
}

/**
 * Fenêtre de formulaire : boîte centrée et compacte sur ordinateur,
 * feuille ancrée en bas de l'écran sur mobile.
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "",
  size = "lg",
  loading = false,
}: DrawerProps) {
  const close = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    },
    [close]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizeClass = size === "xl" ? "sm:max-w-3xl" : "sm:max-w-lg";

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center sm:items-center sm:p-6">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px]" onClick={close} />

      <div
        role="dialog"
        aria-modal="true"
        aria-busy={loading}
        className={`relative flex max-h-[92vh] w-full ${sizeClass} flex-col overflow-hidden rounded-t-2xl bg-white shadow-theme-xl dark:bg-gray-900 sm:rounded-2xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {loading && <ProgressBar className="absolute left-0 top-0 z-20" />}

        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">{title}</h3>
            {description && (
              <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            disabled={loading}
            aria-label="Fermer"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        <div className={`overflow-y-auto px-5 py-5 sm:px-6 ${loading ? "pointer-events-none opacity-60" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
