import React from "react";

/** Indicateur de chargement circulaire, hérite de la couleur du texte. */
export default function Spinner({ className = "h-5 w-5", label }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {label ? <span>{label}</span> : <span className="sr-only">Chargement…</span>}
    </span>
  );
}

/** Barre de progression indéterminée, à placer en haut d'un conteneur relatif. */
export function ProgressBar({ className = "" }: { className?: string }) {
  return (
    <div className={`h-1 w-full overflow-hidden bg-brand-100 dark:bg-brand-500/20 ${className}`} role="progressbar" aria-label="Chargement">
      <div className="h-full w-1/3 animate-[progress-slide_1.1s_ease-in-out_infinite] rounded-full bg-brand-500" />
    </div>
  );
}
