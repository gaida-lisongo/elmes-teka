"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function MarketingDock() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="et-dock-nav">
      <nav className={`et-dock-pill${scrolled ? " et-dock-scrolled" : ""}`}>
        {/* Logo */}
        <Link href="/" className="et-dock-link gap-2 pr-3 pl-2" style={{ color: "#fff" }}>
          <Image
            src="/images/logo/logo-icon.svg"
            alt=""
            width={22}
            height={22}
            priority
            className="flex-shrink-0"
          />
          <span className="font-bold text-sm tracking-tight hidden sm:inline">
            ELMES<span style={{ color: "#3988FF" }}>-TEKA</span>
          </span>
        </Link>

        <div className="et-dock-sep" />

        <Link href="/#benefices" className="et-dock-link hidden md:flex">
          Bénéfices
        </Link>
        <Link href="/#comment" className="et-dock-link hidden md:flex">
          Comment ça marche
        </Link>
        <Link href="/about" className="et-dock-link hidden md:flex">
          À propos
        </Link>

        <div className="et-dock-sep hidden md:block" />

        <Link href="/signin" className="et-dock-link hidden sm:flex">
          Connexion
        </Link>
        <Link
          href="/signup"
          className="et-dock-cta"
        >
          Commencer
        </Link>
      </nav>
    </div>
  );
}
