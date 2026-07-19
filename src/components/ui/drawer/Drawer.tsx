"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { CloseIcon } from "@/icons";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "",
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
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

  return (
    <div className="fixed inset-0 z-[99999] flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-gray-400/50 backdrop-blur-[4px]"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 h-full w-full max-w-[640px] overflow-y-auto bg-white shadow-xl transition-transform duration-300 ease-in-out dark:bg-gray-900 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex-1 pr-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}