"use client";

import { useState, useTransition } from "react";
import { requestAdminMagicLink } from "@/actions/platform.actions";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";

export default function PlatformLoginForm() {
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
