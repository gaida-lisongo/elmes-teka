"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authenticateUser, type UserSearchResult } from "@/actions/auth.actions";
import UserSearch from "@/components/auth/UserSearch";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const response = await authenticateUser({
        identifier,
        password,
        userId: selectedUser?.id,
      });

      if (!response.success) {
        setError(response.message);
        return;
      }

      router.push(response.data.redirectTo);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Connexion
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selectionnez votre compte avec un pseudo, telephone ou e-mail.
          </p>
        </div>

        <form onSubmit={submit}>
          <div className="space-y-6">
            <UserSearch
              selectedUserId={selectedUser?.id || ""}
              onSelect={(user, textValue) => {
                setSelectedUser(user);
                setIdentifier(textValue);
              }}
            />

            <div>
              <Label>
                Mot de passe <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  aria-label="Afficher ou masquer le mot de passe"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {selectedUser && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                Profil detecte : {selectedUser.accountType || "non detecte"} - {selectedUser.status}
              </div>
            )}

            {error && <p className="text-sm text-error-500">{error}</p>}

            <Button className="w-full" size="sm" type="submit" disabled={isPending}>
              {isPending ? "Connexion..." : "Se connecter"}
            </Button>
          </div>
        </form>

        <div className="mt-5">
          <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
            Vous lancez votre activite ?{" "}
            <Link
              href="/signup"
              className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
            >
              Creer un compte entrepreneur
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
