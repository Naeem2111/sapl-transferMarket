/**
 * Send SMS via Twilio. Set env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.
 * If not set, logs OTP to console (dev mode) and returns success.
 */
export async function sendSms(toE164: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log("[SMS dev mode] To:", toE164, "Body:", body);
    return { ok: true };
  }

  try {
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);
    await client.messages.create({
      body,
      from: fromNumber,
      to: `+${toE164}`,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Twilio SMS error:", message);
    return { ok: false, error: message };
  }
}
