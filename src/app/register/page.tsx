"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DIALING_CODES } from "@/lib/phone";
import PasswordInput from "@/components/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const [dialingCode, setDialingCode] = useState("27");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotFound(false);
    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialingCode, phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) { setNotFound(true); }
        else { setError(data.error || "Failed to send code"); }
        return;
      }
      setStep("verify");
      setOtp("");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    const code = otp.replace(/\D/g, "");
    if (code.length !== 6) { setError("Enter the 6-digit code we sent you"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialingCode, phoneNumber: phoneNumber.trim(), otp: code, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-[var(--text)]">Create account</h1>
      <p className="mt-1 text-[var(--muted)]">
        Use the same phone number that's in LeagueRepublic. We'll send a code via WhatsApp to confirm it's you.
      </p>

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
          <div className="flex gap-2">
            <div className="w-24 shrink-0">
              <label className="block text-sm font-medium text-[var(--muted)]">Dialing code</label>
              <select className="input mt-1" value={dialingCode} onChange={(e) => setDialingCode(e.target.value)} title="Dialing code">
                {DIALING_CODES.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
              </select>
            </div>
            <div className="min-w-0 flex-1">
              <label className="block text-sm font-medium text-[var(--muted)]">Phone number</label>
              <input type="tel" className="input mt-1" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 71 234 5678" required />
            </div>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          {notFound && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <p className="text-sm text-[var(--danger)]">
                No player found with this phone number.
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Your number must be in the LeagueRepublic import. If you think this is wrong, you
                can apply for manual verification and an admin will sort it out.
              </p>
              <Link
                href="/register/manual"
                className="mt-3 inline-block rounded-lg border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition"
              >
                Apply for manual verification
              </Link>
            </div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={sendingOtp}>
            {sendingOtp ? "Sending code…" : "Send verification code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            We sent a 6-digit code to {dialingCode} {phoneNumber.trim()} via WhatsApp. Enter it below.
          </p>
          <button type="button" className="text-sm text-[var(--accent)] hover:underline" onClick={() => setStep("phone")}>
            Use a different number
          </button>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Verification code</label>
            <input
              type="text" inputMode="numeric" maxLength={6}
              className="input mt-1 font-mono text-lg tracking-widest"
              value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Password (min 6 characters)</label>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Confirm password</label>
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
