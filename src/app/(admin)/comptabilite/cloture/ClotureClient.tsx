"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ResourcePageShell from "@/components/common/ResourcePageShell";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

import { completeAnnee } from "@/actions/annees.actions";

import { createAnnee } from "@/actions/annees.actions";

/* ── Types locaux ─────────────────────────────────────────── */

interface AnneeActive {
  id: string;
  slug: string;
  debut: string;
  fin: string;
  status: string;
}

interface ClotureStats {
  nbCommandesPending: number;
  nbCreancesEnCours: number;
  nbDettesEnCours: number;
  stocksValides: number;
  stockRows?: Array<{
    shopDesignation: string;
    productDesignation: string;
    qte: number;
  }>;
}

/* ── Composant ────────────────────────────────────────────── */

const STEPS = [
  "Inventaire physique",
  "Clôture comptable",
  "Nouvel exercice",
];

export default function ClotureClient({
  anneeActive,
  stats,
}: {
  anneeActive: AnneeActive | null;
  stats: ClotureStats | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [inventaireValide, setInventaireValide] = useState(false);
  const [clotureLoading, setClotureLoading] = useState(false);
  const [clotureMessage, setClotureMessage] = useState("");
  const [nouvelExercice, setNouvelExercice] = useState({
    debut: "",
    fin: "",
    phone: "",
    currency: "USD" as "USD" | "CDF",
  });
  const [exerciceLoading, setExerciceLoading] = useState(false);
  const [exerciceMessage, setExerciceMessage] = useState("");

  const handleCloture = async () => {
    if (!anneeActive) return;
    if (!confirm("Confirmer la clôture de l'exercice ? Cette action est irréversible.")) return;
    setClotureLoading(true);
    setClotureMessage("");
    try {
      const result = await completeAnnee(anneeActive.id);
      setClotureMessage(result.message);
      if (result.success) {
        setStep(2);
        router.refresh();
      }
    } catch {
      setClotureMessage("Une erreur inattendue s'est produite.");
    } finally {
      setClotureLoading(false);
    }
  };

  const handleCreateAnnee = async () => {
    setExerciceLoading(true);
    setExerciceMessage("");
    try {
      const result = await createAnnee(nouvelExercice);
      setExerciceMessage(result.message);
      if (result.success) {
        router.refresh();
        router.push("/annees");
      }
    } catch {
      setExerciceMessage("Une erreur inattendue s'est produite.");
    } finally {
      setExerciceLoading(false);
    }
  };

  if (!anneeActive) {
    return (
      <ResourcePageShell
        title="Clôture d'exercice"
        description="Aucun exercice actif trouvé."
        content={
          <div className="rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-500 dark:border-gray-800">
            Vous n'avez pas d'exercice actif. Rendez-vous dans la gestion des exercices pour en créer un.
          </div>
        }
      />
    );
  }

  const anneeLabel = `${new Date(anneeActive.debut).getFullYear()} – ${new Date(anneeActive.fin).getFullYear()}`;

  const canCloture =
    inventaireValide &&
    (stats?.nbCommandesPending ?? 0) === 0 &&
    (stats?.nbCreancesEnCours ?? 0) === 0 &&
    (stats?.nbDettesEnCours ?? 0) === 0;

  return (
    <ResourcePageShell
      title="Clôture d'exercice"
      description={`Exercice actif : ${anneeLabel}`}
      content={
        <div className="max-w-2xl space-y-6">
          {/* Progression */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    i < step
                      ? "bg-success-500 text-white"
                      : i === step
                      ? "bg-brand-500 text-white"
                      : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`hidden text-sm sm:block ${
                    i === step
                      ? "font-medium text-gray-900 dark:text-white"
                      : "text-gray-500"
                  }`}
                >
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-px w-8 ${
                      i < step ? "bg-success-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Étape 1 : Inventaire physique */}
          {step === 0 && (
            <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                Inventaire physique
              </h2>
              {stats?.stockRows && stats.stockRows.length > 0 ? (
                <div className="mb-4 overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <tr>
                        <th className="px-3 py-2 text-left">Boutique</th>
                        <th className="px-3 py-2 text-left">Produit</th>
                        <th className="px-3 py-2 text-right">Quantité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {stats.stockRows.map((row, i) => (
                        <tr key={i} className="bg-white dark:bg-gray-900">
                          <td className="px-3 py-2">{row.shopDesignation}</td>
                          <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">
                            {row.productDesignation}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {row.qte.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mb-4 text-sm text-gray-500">
                  Aucune ligne de stock active pour cet exercice.
                </p>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="inventaire-check"
                  checked={inventaireValide}
                  onChange={(e) => setInventaireValide(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="inventaire-check" className="text-sm text-gray-700 dark:text-gray-300">
                  J'ai vérifié l'inventaire physique et il correspond aux données ci-dessus.
                </label>
              </div>
              <button
                disabled={!inventaireValide}
                onClick={() => setStep(1)}
                className="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-40"
              >
                Valider l'inventaire et continuer
              </button>
            </div>
          )}

          {/* Étape 2 : Clôture comptable */}
          {step === 1 && (
            <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                Clôture comptable
              </h2>
              <div className="mb-4 space-y-3">
                <StatLine
                  label="Commandes en attente"
                  value={stats?.nbCommandesPending ?? 0}
                  danger={(stats?.nbCommandesPending ?? 0) > 0}
                />
                <StatLine
                  label="Créances en cours"
                  value={stats?.nbCreancesEnCours ?? 0}
                  danger={(stats?.nbCreancesEnCours ?? 0) > 0}
                />
                <StatLine
                  label="Dettes en cours"
                  value={stats?.nbDettesEnCours ?? 0}
                  danger={(stats?.nbDettesEnCours ?? 0) > 0}
                />
              </div>
              {!canCloture && (
                <p className="mb-4 rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
                  Des éléments sont en attente. Résolvez-les avant de clôturer l'exercice.
                </p>
              )}
              {clotureMessage && (
                <p className="mb-4 text-sm text-error-500">{clotureMessage}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Retour
                </button>
                <button
                  disabled={!canCloture || clotureLoading}
                  onClick={handleCloture}
                  className="flex-1 rounded-lg bg-error-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-40"
                >
                  {clotureLoading ? "Clôture en cours..." : "Clôturer l'exercice"}
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 : Nouvel exercice */}
          {step === 2 && (
            <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
              <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
                Créer le nouvel exercice
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                L'exercice {anneeLabel} a été clôturé. Définissez le prochain exercice.
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Date de début *</Label>
                    <Input
                      type="date"
                      value={nouvelExercice.debut}
                      onChange={(e) =>
                        setNouvelExercice({ ...nouvelExercice, debut: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Date de fin *</Label>
                    <Input
                      type="date"
                      value={nouvelExercice.fin}
                      onChange={(e) =>
                        setNouvelExercice({ ...nouvelExercice, fin: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Téléphone de paiement *</Label>
                    <Input
                      value={nouvelExercice.phone}
                      onChange={(e) =>
                        setNouvelExercice({ ...nouvelExercice, phone: e.target.value })
                      }
                      placeholder="+243..."
                    />
                  </div>
                  <div>
                    <Label>Devise *</Label>
                    <select
                      value={nouvelExercice.currency}
                      onChange={(e) =>
                        setNouvelExercice({
                          ...nouvelExercice,
                          currency: e.target.value as "USD" | "CDF",
                        })
                      }
                      className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                    >
                      <option value="USD">USD</option>
                      <option value="CDF">CDF</option>
                    </select>
                  </div>
                </div>
                {exerciceMessage && (
                  <p className="text-sm text-error-500">{exerciceMessage}</p>
                )}
                <button
                  disabled={exerciceLoading}
                  onClick={handleCreateAnnee}
                  className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  {exerciceLoading ? "Création en cours..." : "Créer le nouvel exercice"}
                </button>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}

function StatLine({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 dark:border-gray-800">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <span
        className={`text-sm font-semibold ${
          danger
            ? "text-error-600 dark:text-error-400"
            : "text-success-600 dark:text-success-400"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
