"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/lib/payments/plans";
import { PLANS } from "@/lib/payments/plans";
import { createAnnee } from "@/actions/annees.actions";
import { CheckLineIcon, ArrowRightIcon, BoltIcon, ShootingStarIcon } from "@/icons";

const TOTAL_STEPS = 5;

interface WizardData {
  activityType: "COMMERCE" | "SERVICE" | "MIXTE" | "";
  debut: string;
  fin: string;
  plan: Plan;
}

const ACTIVITY_OPTIONS = [
  { value: "COMMERCE" as const, label: "Commerce", desc: "Achat et revente de biens" },
  { value: "SERVICE" as const, label: "Service", desc: "Prestations et conseils" },
  { value: "MIXTE" as const, label: "Mixte", desc: "Commerce et services" },
];

const PACK_OPTIONS: { plan: Plan; price: number; highlight?: boolean; features: string[] }[] = [
  {
    plan: "STARTER",
    price: 50,
    features: ["Ventes, stocks et clients", "Tableau de bord essentiel", "1 boutique", "Export Excel"],
  },
  {
    plan: "BUSINESS",
    price: 120,
    highlight: true,
    features: ["Tout Starter", "Multi-boutiques", "Analyses statistiques", "Export PDF avancé"],
  },
  {
    plan: "PREMIUM",
    price: 200,
    features: ["Tout Business", "Conseiller IA", "Dossier financement", "100 crédits IA offerts"],
  },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-brand-500">
          Étape {step} sur {TOTAL_STEPS}
        </span>
        <span className="text-xs text-gray-500">{Math.round((step / TOTAL_STEPS) * 100)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
        <ShootingStarIcon className="h-8 w-8 text-brand-500" />
      </div>
      <h2 className="mb-3 text-2xl font-bold text-gray-800 dark:text-white">
        Bienvenue sur ELMES-TEKA
      </h2>
      <p className="mb-8 max-w-md text-gray-500 dark:text-gray-400">
        Configurez votre espace de gestion commerciale en quelques étapes.
        Ce processus prend moins de 2 minutes.
      </p>
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600 transition-colors"
      >
        Commencer <ArrowRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function StepActivity({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: WizardData["activityType"];
  onChange: (v: WizardData["activityType"]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-gray-800 dark:text-white">
        Votre activité
      </h2>
      <p className="mb-6 text-sm text-gray-500">Quel type d&apos;activité exercez-vous ?</p>
      <div className="space-y-3">
        {ACTIVITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
              value === opt.value
                ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                : "border-gray-200 bg-white hover:border-brand-300 dark:border-gray-700 dark:bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">{opt.label}</p>
                <p className="text-xs text-gray-500">{opt.desc}</p>
              </div>
              {value === opt.value && (
                <CheckLineIcon className="h-5 w-5 text-brand-500" />
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
          Retour
        </button>
        <button
          onClick={onNext}
          disabled={!value}
          className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

function StepExercise({
  debut,
  fin,
  onChange,
  onNext,
  onBack,
}: {
  debut: string;
  fin: string;
  onChange: (field: "debut" | "fin", val: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const error =
    debut && fin && new Date(fin) <= new Date(debut)
      ? "La date de fin doit être après la date de début."
      : null;
  const valid = debut && fin && !error;

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-gray-800 dark:text-white">
        Votre premier exercice
      </h2>
      <p className="mb-6 text-sm text-gray-500">
        Un exercice comptable couvre généralement une année civile.
      </p>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date de début
          </label>
          <input
            type="date"
            value={debut}
            onChange={(e) => onChange("debut", e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date de fin
          </label>
          <input
            type="date"
            value={fin}
            onChange={(e) => onChange("fin", e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
          Retour
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

function StepPlan({
  selected,
  onChange,
  onNext,
  onBack,
}: {
  selected: Plan;
  onChange: (p: Plan) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-gray-800 dark:text-white">
        Choisissez votre formule
      </h2>
      <p className="mb-6 text-sm text-gray-500">Prix par exercice comptable.</p>
      <div className="space-y-3">
        {PACK_OPTIONS.map((opt) => (
          <button
            key={opt.plan}
            type="button"
            onClick={() => onChange(opt.plan)}
            className={`w-full rounded-xl border-2 px-4 py-4 text-left transition-all ${
              selected === opt.plan
                ? "border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10"
                : "border-gray-200 bg-white hover:border-brand-300 dark:border-gray-700 dark:bg-white/[0.03]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-800 dark:text-white">
                    {PLANS[opt.plan].name}
                  </p>
                  {opt.highlight && (
                    <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Populaire
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm font-semibold text-brand-500">${opt.price}/exercice</p>
                <ul className="mt-2 space-y-0.5">
                  {opt.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <CheckLineIcon className="h-3.5 w-3.5 shrink-0 text-success-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              {selected === opt.plan && (
                <CheckLineIcon className="mt-1 h-5 w-5 shrink-0 text-brand-500" />
              )}
            </div>
          </button>
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <button onClick={onBack} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300">
          Retour
        </button>
        <button
          onClick={onNext}
          className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

function StepConfirm({
  data,
  onConfirm,
  onBack,
  loading,
  error,
}: {
  data: WizardData;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
  error: string;
}) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-gray-800 dark:text-white">
        Récapitulatif
      </h2>
      <p className="mb-6 text-sm text-gray-500">Vérifiez vos informations avant de continuer.</p>
      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
        <Row label="Type d'activité" value={data.activityType} />
        <Row label="Exercice" value={`${data.debut} → ${data.fin}`} />
        <Row label="Formule" value={`${PLANS[data.plan].name} — $${PLANS[data.plan].annualUsd}/exercice`} />
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}
      <p className="mt-4 text-xs text-gray-400">
        Le paiement sera finalisé via FlexPay depuis votre tableau de bord.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={onBack} disabled={loading} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 disabled:opacity-50">
          Retour
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <BoltIcon className="h-4 w-4" />
              Créer mon espace
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 dark:text-white">{value}</span>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    activityType: "",
    debut: `${new Date().getFullYear()}-01-01`,
    fin: `${new Date().getFullYear()}-12-31`,
    plan: "BUSINESS",
  });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const handleConfirm = () => {
    setError("");
    startTransition(async () => {
      const res = await createAnnee({
        plan: data.plan,
        debut: data.debut,
        fin: data.fin,
        phone: "",
        currency: "USD",
      });
      if (res.success) {
        router.push("/dashboard");
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <ProgressBar step={step} />

        {step === 1 && <StepWelcome onNext={next} />}
        {step === 2 && (
          <StepActivity
            value={data.activityType}
            onChange={(v) => setData((d) => ({ ...d, activityType: v }))}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <StepExercise
            debut={data.debut}
            fin={data.fin}
            onChange={(field, val) => setData((d) => ({ ...d, [field]: val }))}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && (
          <StepPlan
            selected={data.plan}
            onChange={(p) => setData((d) => ({ ...d, plan: p }))}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 5 && (
          <StepConfirm
            data={data}
            onConfirm={handleConfirm}
            onBack={back}
            loading={isPending}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
