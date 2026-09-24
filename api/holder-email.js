import process from "node:process";

const EVENT_COPY = {
  created: {
    subject: "Your AU academic transcript credential is ready",
    heading: "Academic transcript credential created",
    message:
      "Your academic transcript credential has been created and is ready for you to claim in your wallet.",
  },
  revoked: {
    subject: "Your AU academic transcript credential was revoked",
    heading: "Academic transcript credential revoked",
    message:
      "Your academic transcript credential is no longer valid. Please contact the issuer if you need assistance.",
  },
  reissued: {
    subject: "A new AU academic transcript offer is ready",
    heading: "Academic transcript offer reissued",
    message:
      "A new academic transcript offer is ready for you to accept in your wallet.",
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
        html: `<h2>${copy.heading}</h2><p>${copy.message}</p><p>Record: ${escapeHtml(detail)}.</p>`,
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
