// src/lib/email.ts
// Sends transactional emails via Resend (https://resend.com)
// Install: npm install resend
// Env var required: RESEND_API_KEY

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback — log to console
    console.log(`[EMAIL] To: ${to}\nSubject: ${subject}\n${html}`);
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "SAPL Transfer Market <onboarding@resend.dev>", // update to <noreply@yourdomain.com> after domain is verified
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      console.error("Resend error:", data);
      return { ok: false, error: "Failed to send email" };
    }

    return { ok: true };
  } catch (e) {
    console.error("Email send error:", e);
    return { ok: false, error: "Failed to send email" };
  }
}
