import Annee from "@/lib/models/Annee";
import connectToDb from "@/lib/utils/db";

// Limite texte brute ~800 tokens ≈ 3200 chars
const MAX_CHARS = 3200;

function truncate(text: string): string {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + "…" : text;
}

interface BusinessContext {
  exercice: string;
  pack: string;
  resumeFinancier: string;
  alertes: string;
  segments: string;
}

export async function buildBusinessContext(
  tenantId: string,
  anneeId: string,
): Promise<BusinessContext> {
  await connectToDb();

  const annee = await Annee.findOne({ _id: anneeId, tenantId })
    .select("debut fin plan status")
    .lean();

  if (!annee) throw new Error("Exercice introuvable.");

  const debut = new Date(annee.debut).getFullYear();
  const fin = new Date(annee.fin).getFullYear();

  // Contexte de base — les modules mining enrichissent ce contexte
  // quand ils seront disponibles. Pour l'instant on construit un prompt minimal.
  const context: BusinessContext = {
    exercice: `${debut}–${fin}`,
    pack: annee.plan,
    resumeFinancier: "Données financières de l'exercice en cours.",
    alertes: "Aucune alerte critique détectée.",
    segments: "Segmentation clients disponible dans le module Intelligence.",
  };

  return context;
}

export function formatContextForPrompt(ctx: BusinessContext): string {
  const raw = `Exercice : ${ctx.exercice} | Pack : ${ctx.pack}
Résumé financier : ${ctx.resumeFinancier}
Alertes : ${ctx.alertes}
Clients : ${ctx.segments}`;
  return truncate(raw);
}
