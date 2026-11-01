"use client";

import { useState } from "react";
import { CopyIcon, GroupIcon, PaperPlaneIcon } from "@/icons";
import type { ReferralSummary } from "@/lib/payments/pricing";

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
        return;
      }
    }
    await copy();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-brand-100 bg-brand-25 dark:border-brand-500/20 dark:bg-brand-500/[0.06]">
      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between sm:p-5">
        {/* Left: icon + text */}
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
            <GroupIcon className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-800 dark:text-brand-300">
              Parrainez · payez moins
            </p>
            <p className="mt-0.5 text-xs text-brand-600/70 dark:text-brand-400/70">
              10 % pour vos filleuls · +5 % pour vous tous les 5 payants (max 50 %)
            </p>
          </div>
        </div>

        {/* Right: stats + actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Stats row */}
          <div className="flex items-center divide-x divide-brand-200 rounded-lg border border-brand-200 bg-white dark:divide-brand-700 dark:border-brand-700 dark:bg-brand-900/30">
            <div className="px-3 py-1.5 text-center">
              <p className="tabular-nums text-sm font-bold text-gray-900 dark:text-white">{referral.totalReferrals}</p>
              <p className="text-[10px] text-gray-400">Inscrits</p>
            </div>
            <div className="px-3 py-1.5 text-center">
              <p className="tabular-nums text-sm font-bold text-gray-900 dark:text-white">{referral.paidReferrals}</p>
              <p className="text-[10px] text-gray-400">Payants</p>
            </div>
            <div className="px-3 py-1.5 text-center">
              <p className="tabular-nums text-sm font-bold text-success-600">
                -{referral.currentReduction} %
              </p>
              <p className="text-[10px] text-gray-400">Bonus</p>
            </div>
          </div>

          {/* Code pill */}
          <div className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 dark:border-brand-700 dark:bg-brand-900/30">
            <span className="text-xs text-gray-500 dark:text-gray-400">Code</span>
            <span className="font-mono text-sm font-bold text-brand-700 dark:text-brand-300">
              {referral.code}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366] px-3 text-xs font-semibold text-white hover:opacity-90"
            >
              <PaperPlaneIcon className="size-3.5" /> WhatsApp
            </a>
            <button
              type="button"
              onClick={share}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/[0.04] dark:text-gray-300"
            >
              <PaperPlaneIcon className="size-3.5" /> Partager
            </button>
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/[0.04] dark:text-gray-400"
              aria-label="Copier le message"
            >
              <CopyIcon className={`size-3.5 ${copied ? "text-success-500" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {!referral.maxReached && (
        <div className="border-t border-brand-100 px-4 py-2 dark:border-brand-500/20">
          <p className="text-xs text-brand-600/60 dark:text-brand-400/60">
            Encore {referral.nextStepIn} filleul(s) payant(s) pour gagner +5 %
          </p>
        </div>
      )}
    </div>
  );
}
