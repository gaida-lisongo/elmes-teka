import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-white/5 lg:grid items-center hidden">
            <div className="relative flex h-full items-center justify-center px-12">
              <div className="max-w-lg">
                <Link href="/" className="mb-8 inline-flex">
                  <Image
                    width={231}
                    height={48}
                    src="./images/logo/auth-logo.svg"
                    alt="Logo"
                  />
                </Link>
                <p className="mb-3 text-sm font-medium uppercase tracking-[0.12em] text-brand-200">
                  CRM made in Congo
                </p>
                <h2 className="text-3xl font-semibold text-white">
                  ELMES-TEKA
                </h2>
                <p className="mt-4 text-base leading-7 text-gray-300 dark:text-white/70">
                  Une plateforme de gestion commerciale adaptée aux TPE, PME et
                  activités informelles congolaises.
                </p>
                <ul className="mt-8 space-y-4 text-sm text-gray-300 dark:text-white/70">
                  <li className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                    Sachez exactement ce qui se vend — même à distance.
                  </li>
                  <li className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                    Identifiez vos meilleurs clients automatiquement.
                  </li>
                  <li className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                    Votre journal financier, exportable en un clic.
                  </li>
                </ul>
                <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5">
                  <p className="text-xs text-gray-400 leading-5 italic">
                    81 % des MPME congolaises n'ont pas encore d'outil de
                    gestion des stocks.{" "}
                    <span className="not-italic text-gray-500">
                      MicroSave 2025
                    </span>
                  </p>
                </div>
                <div className="mt-6">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-brand-300 hover:text-white transition-colors"
                  >
                    <span>←</span>
                    <span>Retour à l'accueil</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
