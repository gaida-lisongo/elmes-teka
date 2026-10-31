"use client";

import { useState, useTransition } from "react";
import { requestAdminMagicLink } from "@/actions/platform.actions";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

/** Demande du lien magique de l'administrateur ; variante sombre pour le footer du site. */
export default function PlatformLoginForm({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const res = await requestAdminMagicLink(email);
      setMessage({ ok: res.success, text: res.message });
    });
  }

  if (tone === "dark") {
    return (
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="footer-admin-email" className="sr-only">Adresse e-mail du gestionnaire</label>
        <input
          id="footer-admin-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="votre@email.cd"
          className="h-11 w-full rounded-lg px-4 text-sm text-white outline-none transition placeholder:text-white/40 focus:ring-2 focus:ring-[#22C55E]"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}
        />
        <Button type="submit" size="sm" className="w-full !bg-[#22C55E] hover:!brightness-110" loading={isPending}>
          {isPending ? "Envoi du lien..." : "Recevoir mon lien de connexion"}
        </Button>
        {message && (
          <p className="text-xs" style={{ color: message.ok ? "#4ADE80" : "#FCA5A5" }}>{message.text}</p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label>Adresse e-mail</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@elmes.cd" />
      </div>
      {message && <p className={`text-sm ${message.ok ? "text-success-600" : "text-error-500"}`}>{message.text}</p>}
      <Button type="submit" className="w-full" loading={isPending}>
        {isPending ? "Envoi du lien..." : "Recevoir mon lien de connexion"}
      </Button>
    </form>
  );
}
