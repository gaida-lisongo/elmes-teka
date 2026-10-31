import { headers } from "next/headers";

/** URL publique de la plateforme (domaine de la requête en cours, sinon production Vercel). */
export async function appOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  } catch {
    // Hors requête (script, cron) : on retombe sur l'URL de production Vercel.
  }
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return `https://${production}`;
  throw new Error("Impossible de déterminer l'URL publique de la plateforme.");
}
