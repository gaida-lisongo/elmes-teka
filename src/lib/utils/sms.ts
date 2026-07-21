import crypto from "node:crypto";

type ApiResult<T> = {
  success: boolean;
  status: number;
  requestId: string | null;
  data?: T;
  error?: string;
};

export interface ContactInput {
  name?: string;
  phone: string;
  tenantSlug: string;
  promotionCode: string;
}

export interface CampaignInput {
  name: string;
  message: string;
  tenantSlug: string;
  promotionCode: string;
  totalRecipients?: number;
  scheduledAt?: string | null;
}

export interface SimpleSmsInput {
  phone: string;
  message: string;
  clientReference?: string;
}

export interface BulkSmsInput extends CampaignInput {
  contacts: Array<{ name?: string; phone: string }>;
}

export class SmsNotifier {
  private static instance: SmsNotifier | null = null;

  private constructor() {}

  static getInstance(): SmsNotifier {
    if (!SmsNotifier.instance) SmsNotifier.instance = new SmsNotifier();
    return SmsNotifier.instance;
  }

  normalizePhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 9) throw new Error("Numero de telephone invalide.");
    return `243${digits.slice(-9)}`;
  }

  private normalizeTag(value: string): string {
    const tag = value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!tag) throw new Error("Tag SMS invalide.");
    return tag.slice(0, 64);
  }

  private get tagsSeparator(): string { return "--"; }

  private audienceTag(tenantSlug: string, promotionCode: string): string {
    return `${this.normalizeTag(tenantSlug)}${this.tagsSeparator}${this.normalizeTag(promotionCode)}`.slice(0, 64);
  }

  private get configuration() {
    const apiKey = process.env.COUSSEMA_API_KEY;
    if (!apiKey) throw new Error("COUSSEMA_API_KEY n'est pas configuree.");
    const senderId = process.env.COUSSEMA_SENDER_ID;
    if (!senderId) throw new Error("COUSSEMA_SENDER_ID n'est pas configuree.");
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(senderId)) {
      throw new Error("COUSSEMA_SENDER_ID doit etre un UUID valide.");
    }
    const configured = (process.env.COUSSEMA_BASE_URL ?? "https://api.coussema.com").replace(/\/$/, "");
    return {
      apiKey,
      senderId,
      baseUrl: configured.endsWith("/v1") ? configured : `${configured}/v1`,
    };
  }

  private async request<T>(path: string, body: Record<string, unknown>, idempotent = false): Promise<ApiResult<T>> {
    try {
      const config = this.configuration;
      const requestId = crypto.randomUUID();
      const response = await fetch(`${config.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          "x-request-id": requestId,
          ...(idempotent ? { "Idempotency-Key": crypto.randomUUID() } : {}),
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      console.log("Sending Payload :", payload);
      
      const providerRequestId = response.headers.get("x-request-id") ?? requestId;
      if (!response.ok) return { success: false, status: response.status, requestId: providerRequestId, error: payload.error ?? payload.message ?? "Coussema a refuse la requete.", data: payload };
      return { success: true, status: response.status, requestId: providerRequestId, data: payload };
    } catch (error: any) {
      return { success: false, status: 0, requestId: null, error: error.message || "Service SMS indisponible." };
    }
  }

  async create_contact(input: ContactInput): Promise<ApiResult<any>> {
    const tag = this.audienceTag(input.tenantSlug, input.promotionCode);
    return this.request("/contacts", { name: input.name?.trim() || undefined, phone: this.normalizePhone(input.phone), tags: [this.normalizeTag(input.tenantSlug), this.normalizeTag(input.promotionCode), tag] });
  }

  async create_campaign(input: CampaignInput): Promise<ApiResult<any>> {
    const config = this.configuration;
    return this.request("/campaigns", {
      name: input.name.trim().slice(0, 160),
      message_template: input.message.trim().slice(0, 1530),
      scheduled_at: input.scheduledAt ?? null,
      total_recipients: input.totalRecipients ?? 0,
      sender_id: config.senderId,
      sender_name: null,
      audience_tags: [this.audienceTag(input.tenantSlug, input.promotionCode)],
      audience_tag_match_mode: "all",
    }, true);
  }

  async send_simple(input: SimpleSmsInput): Promise<ApiResult<any>> {
    const config = this.configuration;
    return this.request("/sms/send", {
      to: this.normalizePhone(input.phone),
      senderId: config.senderId,
      message: input.message.trim().slice(0, 1530),
      ...(input.clientReference ? { clientReference: input.clientReference.slice(0, 128) } : {}),
    }, true);
  }

  async send_bulk(input: BulkSmsInput): Promise<{ success: boolean; contacts: ApiResult<any>[]; campaign?: ApiResult<any>; error?: string }> {
    if (!input.contacts.length) return { success: false, contacts: [], error: "Aucun destinataire." };
    const contacts: ApiResult<any>[] = [];
    for (const contact of input.contacts) {
      contacts.push(await this.create_contact({ ...contact, tenantSlug: input.tenantSlug, promotionCode: input.promotionCode }));
    }
    const accepted = contacts.filter((result) => result.success || result.status === 409).length;
    if (!accepted) return { success: false, contacts, error: "Aucun contact n'a ete accepte." };
    const campaign = await this.create_campaign({ ...input, totalRecipients: accepted });
    return { success: campaign.success, contacts, campaign, error: campaign.error };
  }
}

export const smsNotifier = SmsNotifier.getInstance();
