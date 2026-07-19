"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAdminShell } from "@/context/AdminShellContext";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { uploadToCloudinary } from "@/actions/cloudinary.actions";
import { updateProfile } from "@/actions/profile.actions";
import { UserCircleIcon, CheckCircleIcon, CloseLineIcon } from "@/icons";

export default function ProfileClient({ session }: { session: any }) {
  const router = useRouter();
  const { user, account } = useAdminShell();

  const [pseudo, setPseudo] = useState(user.pseudo || "");
  const [email, setEmail] = useState(user.email || "");
  const [telephone, setTelephone] = useState(user.telephone || "");
  const [photoUrl, setPhotoUrl] = useState(user.photo || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "elmes-teka/users");
      const result = await uploadToCloudinary(formData);
      if (result.success) {
        setPhotoUrl(result.url);
        setMessage("");
      } else {
        setMessage(result.error || "Echec de l'upload.");
      }
      setUploading(false);
    },
    [],
  );

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    setSuccess(false);
    const result = await updateProfile({
      pseudo,
      email,
      telephone,
      photo: photoUrl,
    });
    setSaving(false);
    if (result.success) {
      setSuccess(true);
      setMessage("Profil mis a jour avec succes.");
      router.refresh();
    } else {
      setMessage(result.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Photo + nom */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Photo de profil"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircleIcon className="h-full w-full text-gray-400" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-brand-500 text-white shadow transition-colors hover:bg-brand-600">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
            </label>
          </div>
          <div className="text-center sm:text-left">
            <h4 className="text-xl font-semibold text-gray-800 dark:text-white/90">
              {user.pseudo}
            </h4>
            <p className="text-sm text-gray-500">{user.matricule}</p>
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              {account.type === "TENANT" ? "Gerant" : "Vendeur"}
            </p>
            {uploading && (
              <p className="mt-1 text-xs text-brand-500">Upload en cours...</p>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h4 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
          Informations personnelles
        </h4>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <Label>Pseudo</Label>
            <Input
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              placeholder="Votre pseudo"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
            />
          </div>
          <div>
            <Label>Telephone</Label>
            <Input
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="+243..."
            />
          </div>
          <div>
            <Label>Matricule</Label>
            <Input value={user.matricule} disabled className="opacity-50" />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            <CheckCircleIcon className="h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          {success && (
            <span className="text-sm text-success-500">Modifications enregistrees.</span>
          )}
        </div>

        {message && !success && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-800 dark:bg-error-500/10 dark:text-error-400">
            <CloseLineIcon className="h-4 w-4 shrink-0" />
            {message}
          </div>
        )}
      </div>
    </div>
  );
}