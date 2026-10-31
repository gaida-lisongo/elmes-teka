import Spinner, { ProgressBar } from "@/components/ui/spinner/Spinner";

/** Affiché par les fichiers loading.tsx pendant le chargement d'une page. */
export default function PageLoader({ label = "Chargement…" }: { label?: string }) {
  return (
    <>
      <ProgressBar className="fixed left-0 top-0 z-[100000]" />
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        <Spinner className="h-6 w-6 text-brand-500" label={label} />
      </div>
    </>
  );
}
