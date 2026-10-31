"use client";

import { useFormStatus } from "react-dom";
import Button from "@/components/ui/button/Button";

export default function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="mt-6 w-full" loading={pending}>
      {pending ? "Connexion..." : "Ouvrir le dashboard"}
    </Button>
  );
}
