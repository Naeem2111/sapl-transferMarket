/**
 * Send OTP via Twilio WhatsApp using a Content Template.
 * Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (WhatsApp-enabled).
 * Uses the approved "saplotp" template (SID: HX76a84267d021de65234b594cc36df9d4).
 * If Twilio env vars are not set, logs to console (dev mode) and returns success.
 */

const CONTENT_SID = "HX76a84267d021de65234b594cc36df9d4";

export async function sendWhatsApp(toE164: string, otpCode: string): Promise<{ ok: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log("[WhatsApp dev mode] Missing:", {
      TWILIO_ACCOUNT_SID: !accountSid,
      TWILIO_AUTH_TOKEN: !authToken,
      TWILIO_PHONE_NUMBER: !fromNumber,
    }, "To:", toE164, "OTP:", otpCode);
    return { ok: true };
  }

  const from = fromNumber.startsWith("+") ? fromNumber : `+${fromNumber}`;
  const to = toE164.startsWith("+") ? toE164 : `+${toE164}`;

  try {
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);
    await client.messages.create({
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
      contentSid: CONTENT_SID,
      contentVariables: JSON.stringify({ "1": otpCode }),
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Twilio WhatsApp error:", message);
    return { ok: false, error: message };
  }
}
