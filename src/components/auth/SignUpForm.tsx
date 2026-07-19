"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { checkTenantIdentityAvailability, createTenantAccount } from "@/actions/auth.actions";
import { uploadToCloudinary } from "@/actions/cloudinary.actions";
import FileInput from "@/components/form/input/FileInput";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import type { TenantType } from "@/lib/models/User";
import Link from "next/link";

interface TenantDocumentInput {
  title: string;
  url: string;
  publicId: string;
}

interface SignUpFormState {
  pseudo: string;
  telephone: string;
  email: string;
  designation: string;
  descriptionTitle: string;
  descriptionContent: string;
  type: TenantType;
  logo: string;
  photo: string;
  password: string;
  passwordConfirmation: string;
}

const tenantTypeOptions = [
  { value: "INDIVIDUAL", label: "Entrepreneur individuel" },
  { value: "COMPANY", label: "Entreprise" },
  { value: "ORGANIZATION", label: "Organisation" },
];

export default function SignUpForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingIdentity, setIsCheckingIdentity] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [uploadedPublicIds, setUploadedPublicIds] = useState<string[]>([]);
  const [documentTitle, setDocumentTitle] = useState("");

  const [form, setForm] = useState<SignUpFormState>({
    pseudo: "",
    telephone: "",
    email: "",
    designation: "",
    descriptionTitle: "",
    descriptionContent: "",
    type: "COMPANY" as TenantType,
    logo: "",
    photo: "",
    password: "",
    passwordConfirmation: "",
  });
  const [documents, setDocuments] = useState<TenantDocumentInput[]>([]);

  function updateField<K extends keyof SignUpFormState>(
    name: K,
    value: SignUpFormState[K]
  ) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function validateCurrentStep(): boolean {
    const nextErrors: Record<string, string> = {};

    if (step === 1) {
      if (form.pseudo.trim().length < 2) nextErrors.pseudo = "Le pseudo est obligatoire.";
      if (form.telephone.replace(/[^\d+]/g, "").length < 8) nextErrors.telephone = "Le telephone est invalide.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim().toLowerCase())) {
        nextErrors.email = "L'e-mail est invalide.";
      }
    }

    if (step === 2) {
      if (form.designation.trim().length < 2) nextErrors.designation = "La marque ou entreprise est obligatoire.";
      if (form.descriptionTitle.trim().length < 2) nextErrors.descriptionTitle = "Le titre de presentation est obligatoire.";
      if (form.descriptionContent.trim().length < 10) nextErrors.descriptionContent = "La presentation doit etre plus detaillee.";
    }

    if (step === 3) {
      if (form.password.length < 8) nextErrors.password = "Le mot de passe doit contenir au moins 8 caracteres.";
      if (form.password !== form.passwordConfirmation) {
        nextErrors.passwordConfirmation = "La confirmation ne correspond pas.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function nextStep() {
    if (!validateCurrentStep()) {
      return;
    }

    if (step === 1) {
      setIsCheckingIdentity(true);
      const response = await checkTenantIdentityAvailability({
        email: form.email,
        telephone: form.telephone,
      });
      setIsCheckingIdentity(false);

      if (!response.success) {
        setGlobalError(response.message);
        return;
      }
    }

    setGlobalError("");
    setStep((current) => Math.min(current + 1, 3));
  }

  async function uploadFile(file: File, folder: string): Promise<{ url: string; publicId: string } | null> {
    setIsUploading(true);
    setGlobalError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await uploadToCloudinary(formData);
    setIsUploading(false);

    if (!response.success) {
      setGlobalError(response.error);
      return null;
    }

    setUploadedPublicIds((current) => [...current, response.publicId]);
    return response;
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await uploadFile(file, "elmes-teka/tenants/logos");
    if (result) updateField("logo", result.url);
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const result = await uploadFile(file, "elmes-teka/users");
    if (result) updateField("photo", result.url);
  }

  async function handleDocumentUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !documentTitle.trim()) {
      setErrors((current) => ({ ...current, documentTitle: "Ajoutez un titre avant le fichier." }));
      return;
    }

    const result = await uploadFile(file, "elmes-teka/tenants/documents");

    if (result) {
      setDocuments((current) => [
        ...current,
        { title: documentTitle.trim(), url: result.url, publicId: result.publicId },
      ]);
      setDocumentTitle("");
      setErrors((current) => ({ ...current, documentTitle: "" }));
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateCurrentStep()) return;

    startTransition(async () => {
      const response = await createTenantAccount({
        pseudo: form.pseudo,
        telephone: form.telephone,
        email: form.email,
        password: form.password,
        passwordConfirmation: form.passwordConfirmation,
        photo: form.photo || null,
        designation: form.designation,
        logo: form.logo || null,
        type: form.type,
        description: [
          {
            title: form.descriptionTitle,
            content: form.descriptionContent,
          },
        ],
        documents: documents.map(({ title, url }) => ({ title, url })),
        uploadedPublicIds,
      });

      if (!response.success) {
        setGlobalError(response.message);
        setErrors(response.errors || {});
        return;
      }

      router.push(response.data.redirectTo);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-2xl mx-auto py-10">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Creation de compte entrepreneur
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Un vendeur sera cree plus tard par son gestionnaire. Cette inscription est reservee au tenant.
          </p>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
            <span>Etape {step} sur 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-2 rounded-full bg-brand-500 transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={submit}>
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Identite</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ces informations servent a creer le compte principal.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Pseudo <span className="text-error-500">*</span></Label>
                  <Input value={form.pseudo} onChange={(event) => updateField("pseudo", event.target.value)} error={Boolean(errors.pseudo)} hint={errors.pseudo} />
                </div>
                <div>
                  <Label>Telephone <span className="text-error-500">*</span></Label>
                  <Input value={form.telephone} onChange={(event) => updateField("telephone", event.target.value)} error={Boolean(errors.telephone)} hint={errors.telephone} />
                </div>
              </div>
              <div>
                <Label>E-mail <span className="text-error-500">*</span></Label>
                <Input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} error={Boolean(errors.email)} hint={errors.email} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Marque ou entreprise</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Presentez l'activite et ajoutez les justificatifs disponibles.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Designation <span className="text-error-500">*</span></Label>
                  <Input value={form.designation} onChange={(event) => updateField("designation", event.target.value)} error={Boolean(errors.designation)} hint={errors.designation} />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select options={tenantTypeOptions} defaultValue={form.type} onChange={(value) => updateField("type", value as TenantType)} />
                </div>
              </div>
              <div>
                <Label>Titre de presentation <span className="text-error-500">*</span></Label>
                <Input value={form.descriptionTitle} onChange={(event) => updateField("descriptionTitle", event.target.value)} error={Boolean(errors.descriptionTitle)} hint={errors.descriptionTitle} />
              </div>
              <div>
                <Label>Description <span className="text-error-500">*</span></Label>
                <TextArea rows={5} value={form.descriptionContent} onChange={(value) => updateField("descriptionContent", value)} error={Boolean(errors.descriptionContent)} hint={errors.descriptionContent} />
              </div>
              <div>
                <Label>Logo de la marque</Label>
                <FileInput accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleLogoUpload} disabled={isUploading} />
                {form.logo && <p className="mt-2 text-sm text-success-500">Logo envoye.</p>}
              </div>
              <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                <Label>Document facultatif</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input placeholder="Titre du document" value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} error={Boolean(errors.documentTitle)} hint={errors.documentTitle} />
                  <FileInput accept="image/png,image/jpeg,image/webp,application/pdf" onChange={handleDocumentUpload} disabled={isUploading} />
                </div>
                {documents.length > 0 && (
                  <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {documents.map((document) => (
                      <li key={document.publicId}>{document.title}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Securite</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Finalisez le mot de passe et verifiez les informations.
                </p>
              </div>
              <div>
                <Label>Photo de profil</Label>
                <FileInput accept="image/png,image/jpeg,image/webp" onChange={handlePhotoUpload} disabled={isUploading} />
                {form.photo && <p className="mt-2 text-sm text-success-500">Photo envoyee.</p>}
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <Label>Mot de passe <span className="text-error-500">*</span></Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => updateField("password", event.target.value)} error={Boolean(errors.password)} hint={errors.password || "8 caracteres min, 1 majuscule, 1 minuscule, 1 chiffre."} />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2" aria-label="Afficher ou masquer le mot de passe">
                      {showPassword ? <EyeIcon className="fill-gray-500 dark:fill-gray-400" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>Confirmation <span className="text-error-500">*</span></Label>
                  <Input type={showPassword ? "text" : "password"} value={form.passwordConfirmation} onChange={(event) => updateField("passwordConfirmation", event.target.value)} error={Boolean(errors.passwordConfirmation)} hint={errors.passwordConfirmation} />
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
                <p className="font-medium text-gray-800 dark:text-white/90">{form.designation || "Marque non renseignee"}</p>
                <p>{form.pseudo} - {form.email} - {form.telephone}</p>
                <p>{documents.length} document(s) ajoute(s).</p>
              </div>
            </div>
          )}

          {globalError && <p className="mt-5 text-sm text-error-500">{globalError}</p>}

          <div className="mt-6 flex items-center justify-between gap-3">
            <div>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={() => setStep((current) => current - 1)}>
                  Precedent
                </Button>
              )}
            </div>
            {step < 3 ? (
              <Button type="button" onClick={nextStep} disabled={isUploading || isCheckingIdentity}>
                {isCheckingIdentity ? "Verification..." : "Suivant"}
              </Button>
            ) : (
              <Button type="submit" disabled={isPending || isUploading}>
                {isPending ? "Creation..." : "Creer le compte"}
              </Button>
            )}
          </div>
        </form>

        <div className="mt-5">
          <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
            Vous avez deja un compte ?{" "}
            <Link href="/signin" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
