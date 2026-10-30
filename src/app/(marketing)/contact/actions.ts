"use server";

import { sendMail } from "@/lib/utils/mail";

type ContactInput = {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

const SUBJECT_LABELS: Record<string, string> = {
  demarrer: "Démarrer avec ELMES-TEKA",
  facturation: "Question sur la facturation",
  support: "Support technique",
  partenariat: "Partenariat",
  autre: "Autre",
};

export async function sendContactMessage(input: ContactInput): Promise<{ ok: boolean; error?: string }> {
  const { name, email, phone, subject, message } = input;

  // Validation serveur minimale
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return { ok: false, error: "Champs requis manquants." };
  }

  const subjectLabel = SUBJECT_LABELS[subject] ?? subject;

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f0f4f8;padding:32px;color:#1f2937;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

        <!-- Header -->
        <div style="background:#102B50;padding:24px 32px;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.55);letter-spacing:0.08em;text-transform:uppercase;">ELMES-TEKA</p>
          <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#ffffff;">Nouveau message de contact</h1>
        </div>

        <!-- Body -->
        <div style="padding:28px 32px;">

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
              <td style="padding:8px 0;width:130px;font-size:13px;color:#6b7280;font-weight:600;vertical-align:top;">Nom</td>
              <td style="padding:8px 0;font-size:14px;color:#111827;">${name}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#6b7280;font-weight:600;vertical-align:top;">Email</td>
              <td style="padding:8px 0;font-size:14px;color:#111827;"><a href="mailto:${email}" style="color:#124A99;">${email}</a></td>
            </tr>
            ${phone ? `<tr>
              <td style="padding:8px 0;font-size:13px;color:#6b7280;font-weight:600;vertical-align:top;">Téléphone</td>
              <td style="padding:8px 0;font-size:14px;color:#111827;">${phone}</td>
            </tr>` : ""}
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#6b7280;font-weight:600;vertical-align:top;">Sujet</td>
              <td style="padding:8px 0;font-size:14px;color:#111827;">${subjectLabel}</td>
            </tr>
          </table>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#6b7280;letter-spacing:0.06em;text-transform:uppercase;">Message</p>
            <p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px;border-top:1px solid #f1f5f9;background:#fafafa;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Message reçu depuis elmes-teka.vercel.app · ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Kinshasa" }).format(new Date())} (HAC)
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    await sendMail({
      to: process.env.MAIL_USER ?? "nathan@elmes-solution.site",
      subject: `[Contact ELMES-TEKA] ${subjectLabel} — ${name}`,
      html,
      replyTo: email,
    });
    return { ok: true };
  } catch (err) {
    console.error("[contact] sendMail error:", err instanceof Error ? err.message : err);
    return { ok: false, error: "Impossible d'envoyer le message. Réessayez plus tard." };
  }
}
