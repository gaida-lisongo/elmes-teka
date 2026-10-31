"use client";

import { useState } from "react";
import { CopyIcon, GroupIcon, PaperPlaneIcon } from "@/icons";
import type { ReferralSummary } from "@/lib/payments/pricing";

/** Parrainage : partage du code par WhatsApp ou via le partage natif du téléphone. */
export default function ReferralCard({ referral }: { referral: ReferralSummary }) {
  const [copied, setCopied] = useState(false);
  const message = `Je gere mes boutiques avec ELMES-TEKA. Inscris-toi avec mon code ${referral.code} et profite de 10 % de reduction sur ton premier abonnement : ${referral.shareUrl}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "ELMES-TEKA", text: message, url: referral.shareUrl });
        return;
      } catch {
        // Partage annulé : rien à faire
        return;
      }
    }
    await copy();
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">
            <GroupIcon />
          </span>
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">Parrainez, payez moins</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Vos filleuls ont 10 % sur leur premier abonnement. Tous les 5 filleuls qui paient, vous gagnez +5 % (jusqu&apos;a 50 %).
            </p>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              Votre code : <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono font-semibold dark:bg-gray-800">{referral.code}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
            <p className="text-lg font-bold text-gray-800 dark:text-white/90">{referral.totalReferrals}</p>
            <p className="text-xs text-gray-500">Inscrits</p>
          </div>
          <div className="rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60">
            <p className="text-lg font-bold text-gray-800 dark:text-white/90">{referral.paidReferrals}</p>
            <p className="text-xs text-gray-500">Payants</p>
          </div>
          <div className="rounded-xl bg-success-50 px-3 py-2 dark:bg-success-500/15">
            <p className="text-lg font-bold text-success-600">-{referral.currentReduction} %</p>
            <p className="text-xs text-gray-500">Votre bonus</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {referral.maxReached
            ? "Bonus maximum atteint."
            : `Encore ${referral.nextStepIn} filleul(s) payant(s) pour gagner +5 %.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            <PaperPlaneIcon /> Partager sur WhatsApp
          </a>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
          >
            <PaperPlaneIcon /> Partager
          </button>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700"
          >
            <CopyIcon /> {copied ? "Copie !" : "Copier"}
          </button>
        </div>
      </div>
    </div>
  );
}
