import process from "node:process";

const EVENT_COPY = {
  created: {
    subject: "Your AU academic transcript credential is ready",
    heading: "Your credential is ready",
    message:
      "Your academic transcript credential has been created and is ready for you to claim in your wallet.",
    badge: "New credential",
    accent: "#4f46e5",
  },
  revoked: {
    subject: "Your AU academic transcript credential was revoked",
    heading: "Credential revoked",
    message:
      "Your academic transcript credential is no longer valid. Please contact the issuer if you need assistance.",
    badge: "Revoked",
    accent: "#dc2626",
  },
  reissued: {
    subject: "A new AU academic transcript offer is ready",
    heading: "New offer available",
    message:
      "A new academic transcript offer is ready for you to accept in your wallet.",
    badge: "Reissued",
    accent: "#0891b2",
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Unsupported email method." });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const event = typeof body.event === "string" ? body.event : "";
  const copy = EVENT_COPY[event];
  const to = typeof body.to === "string" ? body.to.trim() : "";
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  // Public base URL where /favicon.svg and /EDTA.png are served from your app's
  // public/ folder (e.g. "https://au-wallet-issuer.example.com"). Email clients
  // can't load local file paths, so these images must be reachable over https.
  const assetBaseUrl = (process.env.APP_PUBLIC_URL || "").replace(/\/+$/, "");

  if (!copy || !/^\S+@\S+\.\S+$/.test(to)) {
    return res.status(400).json({
      message: "A valid recipient and email event are required.",
      code: "INVALID_EMAIL_REQUEST",
    });
  }

  if (!apiKey || !from) {
    return res.status(503).json({
      message: "Email delivery is not configured.",
      code: "EMAIL_NOT_CONFIGURED",
    });
  }

  const detail = body.fullName
    ? `${body.fullName}${body.studentNumber ? ` (${body.studentNumber})` : ""}`
    : body.studentNumber || "your student record";

  try {
    const upstream = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: copy.subject,
        html: buildEmailHtml({ copy, detail, assetBaseUrl }),
      }),
      signal: AbortSignal.timeout(15000),
    });

    const result = await upstream.json();
    if (!upstream.ok) {
      return res.status(502).json({
        message: result?.message || "Resend rejected the email.",
        code: "EMAIL_PROVIDER_REJECTED",
      });
    }

    return res
      .status(200)
      .json({ message: "Holder email sent.", data: result, meta: {} });
  } catch {
    return res.status(502).json({
      message: "The email provider could not be reached.",
      code: "EMAIL_PROVIDER_UNREACHABLE",
    });
  }
}

function buildEmailHtml({ copy, detail, assetBaseUrl }) {
  const faviconUrl = assetBaseUrl ? `${assetBaseUrl}/favicon.svg` : "";
  const edtaLogoUrl = assetBaseUrl ? `${assetBaseUrl}/EDTA.png` : "";
  const safeDetail = escapeHtml(detail);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(copy.subject)}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f4f5f7; font-family:'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(15,23,42,0.08);">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg, ${copy.accent} 0%, #111827 100%); padding:32px 32px 28px;">
                ${
                  faviconUrl
                    ? `<img src="${faviconUrl}" alt="AU Wallet" width="36" height="36" style="display:block; margin-bottom:16px; border-radius:8px;" />`
                    : ""
                }
                <span style="display:inline-block; background-color:rgba(255,255,255,0.15); color:#ffffff; font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; padding:6px 12px; border-radius:999px; margin-bottom:14px;">
                  ${escapeHtml(copy.badge)}
                </span>
                <h1 style="margin:0; color:#ffffff; font-size:22px; line-height:1.3; font-weight:700;">
                  ${escapeHtml(copy.heading)}
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 20px; color:#374151; font-size:15px; line-height:1.6;">
                  ${escapeHtml(copy.message)}
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; margin-bottom:24px;">
                  <tr>
                    <td style="padding:14px 16px;">
                      <p style="margin:0; color:#6b7280; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">Record</p>
                      <p style="margin:4px 0 0; color:#111827; font-size:14px; font-weight:500;">${safeDetail}</p>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; color:#9ca3af; font-size:13px; line-height:1.6;">
                  This is an automated message from the AU academic credential issuer. If you weren't expecting this, you can safely ignore it.
                </p>
              </td>
            </tr>

            <!-- Footer / sponsor logo -->
            <tr>
              <td style="padding:24px 32px; background-color:#f9fafb; border-top:1px solid #eef0f2; text-align:center;">
                <p style="margin:0 0 12px; color:#9ca3af; font-size:11px; text-transform:uppercase; letter-spacing:0.08em;">Powered by</p>
                ${
                  edtaLogoUrl
                    ? `<img src="${edtaLogoUrl}" alt="EDTA" height="28" style="display:inline-block; max-height:28px; width:auto;" />`
                    : `<span style="color:#9ca3af; font-size:13px; font-weight:600;">EDTA</span>`
                }
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
