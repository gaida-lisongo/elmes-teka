import { after } from "next/server";
import { adminEmails, createAdminMagicLink } from "@/lib/auth/platform-admin";
import { sendMail } from "@/lib/utils/mail";

/*
 * Notifications mail de l'administrateur de la plateforme.
 * Envoyées après la réponse (after) : un échec SMTP ne bloque jamais un paiement.
 * Chaque mail contient un lien magique (24 h, usage unique) vers le dashboard plateforme.
 */

type Row = [label: string, value: string | number | null | undefined];

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function render(title: string, rows: Row[], link: string): string {
  const lines = rows
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;color:#6b7280">${escapeHtml(label)}</td><td style="padding:6px 12px;font-weight:600;color:#111827">${escapeHtml(String(value))}</td></tr>`
    )
    .join("");
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
  <h2 style="color:#1C2B4B">${escapeHtml(title)}</h2>
  <table style="border-collapse:collapse;width:100%;background:#f9fafb;border-radius:8px">${lines}</table>
  <p style="margin-top:24px"><a href="${link}" style="background:#22C55E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Ouvrir le dashboard plateforme</a></p>
  <p style="color:#9ca3af;font-size:12px">Lien personnel, valable 24 h et utilisable une seule fois. Ne le transférez pas.</p>
</div>`;
}

export function scheduleAdminNotification(subject: string, title: string, rows: Row[]): void {
  const recipients = adminEmails();
  if (!recipients.length) {
    console.warn("[ADMIN NOTIFY] ADMIN_EMAIL non défini, notification ignorée :", subject);
    return;
  }
  after(async () => {
    for (const email of recipients) {
      try {
        const link = await createAdminMagicLink(email, 24 * 60);
        await sendMail({ to: email, subject: `[ELMES-TEKA] ${subject}`, html: render(title, rows, link) });
      } catch (error) {
        console.error("[ADMIN NOTIFY] échec d'envoi", subject, error);
      }
    }
  });
}
