import Annee from "@/lib/models/Annee";
import connectToDb from "@/lib/utils/db";
import { detectRisks } from "@/lib/mining/risk-detector";
import { computeSolvabilityScore } from "@/lib/mining/financial-solver";

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

  // Charger alertes et score réels depuis les modules mining
  let alertesText = "Aucune alerte détectée.";
  let resumeFinancierText = "Score diagnostique non disponible.";

  try {
    const [alerts, scoreResult] = await Promise.all([
      detectRisks(tenantId, anneeId),
      computeSolvabilityScore(tenantId, anneeId),
    ]);

    if (alerts.length > 0) {
      const lines = alerts.map(
        (a) => `[${a.severity}] ${a.type} — ${a.message}`,
      );
      alertesText = lines.join(" | ");
    }

    resumeFinancierText =
      `Score diagnostique commercial : ${scoreResult.score}/100 ` +
      `(régularité ${scoreResult.components.regularite}/25, ` +
      `croissance ${scoreResult.components.croissance}/25, ` +
      `diversification ${scoreResult.components.diversification}/25, ` +
      `marge ${scoreResult.components.marge}/25). ` +
      `Interprétation : ${scoreResult.interpretation}.`;
  } catch {
    // Échec silencieux — le contexte reste minimal mais non fictif
    alertesText = "Calcul des alertes indisponible.";
    resumeFinancierText = "Calcul du score indisponible.";
  }

  const context: BusinessContext = {
    exercice: `${debut}–${fin}`,
    pack: annee.plan,
    resumeFinancier: resumeFinancierText,
    alertes: alertesText,
    segments: "Segmentation RFM disponible dans le module Intelligence.",
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
