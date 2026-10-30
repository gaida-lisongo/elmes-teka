"use client";

import { useState } from "react";
import { sendContactMessage } from "@/app/(marketing)/contact/actions";

type FormState = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function validate(): boolean {
    const next: Partial<FormState> = {};
    if (!form.name.trim()) next.name = "Le nom complet est requis.";
    if (!form.email.trim()) next.email = "L'adresse email est requise.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "L'adresse email n'est pas valide.";
    if (!form.subject) next.subject = "Veuillez choisir un sujet.";
    if (!form.message.trim()) next.message = "Le message est requis.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    const result = await sendContactMessage({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      subject: form.subject,
      message: form.message,
    });
    setSubmitting(false);
    if (result.ok) {
      setSent(true);
    } else {
      setServerError(result.error ?? "Une erreur est survenue.");
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-green-100 bg-green-50 px-8 py-10 text-center">
        {/* Check icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="14" cy="14" r="14" fill="#22c55e" fillOpacity="0.15" />
            <path
              d="M8.5 14.5l4 4 7-8"
              stroke="#16a34a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Message envoyé !</h3>
        <p className="mt-2 text-sm text-gray-600 leading-6">
          Votre message a bien été envoyé ! Nous vous répondrons dans les 24
          heures ouvrées.
        </p>
        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setErrors({});
            setSent(false);
          }}
          className="mt-6 rounded-lg border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Envoyer un autre message
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-base text-gray-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 placeholder:text-gray-400";
  const errorInputClass =
    "w-full rounded-lg border border-red-400 bg-white px-3.5 py-2.5 text-base text-gray-900 transition-shadow focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 placeholder:text-gray-400";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Nom complet */}
      <div>
        <label
          htmlFor="cf-name"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Nom complet <span className="text-red-500">*</span>
        </label>
        <input
          id="cf-name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Jean Kabila"
          value={form.name}
          onChange={handleChange}
          className={errors.name ? errorInputClass : inputClass}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="cf-email"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Adresse email <span className="text-red-500">*</span>
        </label>
        <input
          id="cf-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.cd"
          value={form.email}
          onChange={handleChange}
          className={errors.email ? errorInputClass : inputClass}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      {/* Téléphone */}
      <div>
        <label
          htmlFor="cf-phone"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Téléphone{" "}
          <span className="text-gray-400 font-normal">(optionnel)</span>
        </label>
        <input
          id="cf-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+243 XX XXX XXXX"
          value={form.phone}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      {/* Sujet */}
      <div>
        <label
          htmlFor="cf-subject"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Sujet <span className="text-red-500">*</span>
        </label>
        <select
          id="cf-subject"
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className={errors.subject ? errorInputClass : inputClass}
        >
          <option value="">Choisissez un sujet…</option>
          <option value="demarrer">Démarrer avec ELMES-TEKA</option>
          <option value="facturation">Question sur la facturation</option>
          <option value="support">Support technique</option>
          <option value="partenariat">Partenariat</option>
          <option value="autre">Autre</option>
        </select>
        {errors.subject && (
          <p className="mt-1 text-xs text-red-500">{errors.subject}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="cf-message"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="cf-message"
          name="message"
          rows={4}
          placeholder="Décrivez votre question ou votre demande…"
          value={form.message}
          onChange={handleChange}
          className={`${errors.message ? errorInputClass : inputClass} resize-y`}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-500">{errors.message}</p>
        )}
      </div>

      {/* Erreur serveur */}
      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-brand-500 px-6 py-3 text-base font-bold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? (
          <>
            {/* Spinner */}
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Envoi en cours…
          </>
        ) : (
          "Envoyer le message"
        )}
      </button>
    </form>
  );
}
