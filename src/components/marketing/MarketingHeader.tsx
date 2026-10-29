"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`et-header ${scrolled ? "et-header-scrolled" : "et-header-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex-shrink-0 flex items-center gap-2.5">
          <Image
            src="/images/logo/logo-icon.svg"
            alt=""
            width={30}
            height={30}
            priority
            className="h-[30px] w-[30px]"
          />
          <span
            className="text-white font-bold text-lg tracking-tight"
            style={{ fontFamily: "var(--font-poppins, Poppins, system-ui)" }}
          >
            ELMES<span style={{ color: "#93C5FD" }}>-TEKA</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#benefices"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Bénéfices
          </Link>
          <Link
            href="/#comment"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Comment ça marche
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            À propos
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="text-sm font-medium text-white/80 hover:text-white transition-colors hidden sm:block"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="et-badge-shine rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              boxShadow: "0 0 0 1px rgba(245,158,11,0.4)",
            }}
          >
            Commencer
          </Link>
        </div>
      </div>
    </header>
  );
}
