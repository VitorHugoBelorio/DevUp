type MagicLinkEmailInput = {
  to: string;
  name?: string | null;
  magicLink: string;
  purpose: "LOGIN" | "VERIFY_EMAIL";
};

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

function getSubject(purpose: MagicLinkEmailInput["purpose"]): string {
  return purpose === "VERIFY_EMAIL" ? "Verifique seu e-mail no DevUp" : "Seu link de acesso ao DevUp";
}

function getPreviewText(purpose: MagicLinkEmailInput["purpose"]): string {
  return purpose === "VERIFY_EMAIL"
    ? "Clique para verificar seu e-mail e acessar seu diagnostico."
    : "Clique para entrar no DevUp sem senha.";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildHtml(input: MagicLinkEmailInput): string {
  const title = input.purpose === "VERIFY_EMAIL" ? "Confirme seu e-mail" : "Entre no DevUp";
  const greeting = input.name ? `Fala, ${escapeHtml(input.name)}.` : "Fala, dev.";
  const preview = getPreviewText(input.purpose);
  const safeMagicLink = escapeHtml(input.magicLink);

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
      </head>
      <body style="margin:0;background:#020617;color:#e5e7eb;font-family:Arial,Helvetica,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${preview}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#020617;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#07111f;border:1px solid #132033;border-radius:20px;padding:32px;">
                <tr>
                  <td>
                    <p style="margin:0 0 24px;color:#60a5fa;font-size:13px;letter-spacing:0.18em;text-transform:lowercase;font-weight:700;">devup</p>
                    <h1 style="margin:0;color:#ffffff;font-size:28px;line-height:1.2;">${title}</h1>
                    <p style="margin:18px 0 0;color:#cbd5e1;font-size:16px;line-height:1.7;">${greeting}</p>
                    <p style="margin:10px 0 0;color:#94a3b8;font-size:15px;line-height:1.7;">
                      ${preview} Esse link expira em alguns minutos por seguranca.
                    </p>
                    <div style="margin:28px 0;">
                      <a href="${safeMagicLink}" style="display:inline-block;background:#2563eb;color:#eff6ff;text-decoration:none;border-radius:999px;padding:14px 22px;font-weight:700;font-size:14px;">
                        Acessar DevUp
                      </a>
                    </div>
                    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                      Se o botao nao funcionar, copie e cole este link no navegador:<br />
                      <span style="color:#93c5fd;word-break:break-all;">${safeMagicLink}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

async function sendWithBrevo(input: MagicLinkEmailInput): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || "DevUp";

  if (!apiKey || !senderEmail) {
    throw new EmailDeliveryError("BREVO_API_KEY e BREVO_SENDER_EMAIL precisam estar configurados.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: input.to,
          name: input.name ?? undefined
        }
      ],
      subject: getSubject(input.purpose),
      htmlContent: buildHtml(input),
      tags: ["devup", "magic-link"]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    let detail = body;

    try {
      const parsed = JSON.parse(body) as { message?: string; code?: string };
      detail = [parsed.code, parsed.message].filter(Boolean).join(": ") || body;
    } catch {
      detail = body;
    }

    throw new EmailDeliveryError(`Brevo respondeu ${response.status}. ${detail}`);
  }
}

export async function sendMagicLinkEmail(input: MagicLinkEmailInput): Promise<void> {
  const mode = (process.env.EMAIL_DELIVERY_MODE ?? "console").trim().toLowerCase();

  if (mode === "brevo") {
    await sendWithBrevo(input);
    return;
  }

  if (mode === "console") {
    console.info(
      [
        "[DevUp] Magic link",
        `to=${input.to}`,
        `purpose=${input.purpose}`,
        `link=${input.magicLink}`
      ].join(" | ")
    );
  }
}
