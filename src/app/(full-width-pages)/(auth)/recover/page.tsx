"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { recoverAccount } from "@/actions/auth.actions";

type Step = "identity" | "credentials" | "done";

export default function RecoverAccountPage() {
  const [step, setStep] = useState<Step>("identity");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [matricule, setMatricule] = useState("");
  const [telephone, setTelephone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  function handleIdentitySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!matricule.trim() || !telephone.trim()) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setError(null);
    setStep("credentials");
  }

  function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await recoverAccount({ matricule, telephone, newEmail, newPassword, newPasswordConfirmation: confirm });
      if (result.success) {
        setStep("done");
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-md">
        {/* En-tête */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Récupérer votre compte</h1>
          <p className="mt-2 text-sm text-gray-500">
            Vous avez perdu l'accès à votre email ? Identifiez-vous avec votre matricule et numéro de téléphone.
          </p>
        </div>

        {/* Indicateur d'étape */}
        {step !== "done" && (
          <div className="mb-6 flex gap-2">
            {(["identity", "credentials"] as const).map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  step === s ? "bg-brand-500 text-white" :
                  (step === "credentials" && s === "identity") ? "bg-green-500 text-white" :
                  "bg-gray-200 text-gray-500 dark:bg-gray-700"
                }`}>
                  {step === "credentials" && s === "identity" ? "✓" : i + 1}
                </div>
                <span className={`text-xs ${step === s ? "font-semibold text-gray-800 dark:text-white" : "text-gray-400"}`}>
                  {s === "identity" ? "Identification" : "Nouvelles informations"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">

          {/* Étape 1 : Identification */}
          {step === "identity" && (
            <form onSubmit={handleIdentitySubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Matricule</label>
                <input
                  value={matricule}
                  onChange={e => setMatricule(e.target.value)}
                  placeholder="ex: TEN-2024-AB12CD34"
                  autoCapitalize="characters"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm uppercase outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Numéro de téléphone</label>
                <input
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  placeholder="+243 8XX XXX XXX"
                  type="tel"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              {error && <p className="text-sm text-error-500">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition"
              >
                Continuer
              </button>
            </form>
          )}

          {/* Étape 2 : Nouvelles informations */}
          {step === "credentials" && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                Matricule vérifié : <strong>{matricule.toUpperCase()}</strong>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nouvelle adresse e-mail</label>
                <input
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  type="email"
                  placeholder="nouvelle@email.com"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nouveau mot de passe</label>
                <input
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  type="password"
                  placeholder="Min. 8 caractères, majuscule, chiffre"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmer le mot de passe</label>
                <input
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  type="password"
                  placeholder="Répétez le mot de passe"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-brand-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              {error && <p className="text-sm text-error-500">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep("identity"); setError(null); }}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition disabled:opacity-50"
                >
                  {isPending ? "Récupération…" : "Récupérer mon compte"}
                </button>
              </div>
            </form>
          )}

          {/* Étape 3 : Succès */}
          {step === "done" && (
            <div className="space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto dark:bg-green-500/10">
                <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">Compte récupéré !</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Votre email et mot de passe ont été mis à jour. Vous pouvez maintenant vous connecter.
                </p>
              </div>
              <Link
                href="/signin"
                className="block w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition text-center"
              >
                Se connecter
              </Link>
            </div>
          )}
        </div>

        {step === "identity" && (
          <p className="mt-4 text-center text-sm text-gray-500">
            Vous vous souvenez de votre email ?{" "}
            <Link href="/signin" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Connexion normale
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
