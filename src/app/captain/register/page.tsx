"use client";

import { useState } from "react";
import Link from "next/link";
import { DIALING_CODES } from "@/lib/phone";
import PasswordInput from "@/components/PasswordInput";

type Step = "phone" | "verify";

export default function CaptainRegisterPage() {
  const [step, setStep] = useState<Step>("phone");
  const [dialingCode, setDialingCode] = useState("27");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required"); return; }
    if (!phoneNumber.trim()) { setError("Phone number is required"); return; }
    setSendingOtp(true);
    try {
      const res = await fetch("/api/auth/captain/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialingCode, phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send code"); return; }
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
      const res = await fetch("/api/auth/captain/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          teamName: teamName.trim() || undefined,
          dialingCode,
          phoneNumber: phoneNumber.trim(),
          otp: code,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); return; }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-sm text-center space-y-4">
        <div className="text-4xl">⏳</div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Registration submitted</h1>
        <p className="text-[var(--muted)]">
          Your captain account is pending approval. You&apos;ll be able to sign in once an admin approves your registration.
        </p>
        <Link href="/market" className="btn-ghost inline-block mt-2">Back to market</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-[var(--text)]">Create captain account</h1>
      <p className="mt-1 text-[var(--muted)]">
        Submit your details. We&apos;ll verify your phone via WhatsApp, then an admin will approve your account.
      </p>

      {step === "phone" ? (
        <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Email</label>
            <input type="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Team name (optional)</label>
            <input type="text" className="input mt-1" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Azzurri Esports" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--muted)]">Phone number</label>
            <div className="mt-1 flex gap-2">
              <div className="w-24 shrink-0">
                <select className="input" value={dialingCode} onChange={(e) => setDialingCode(e.target.value)} title="Dialing code">
                  {DIALING_CODES.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
                </select>
              </div>
              <input type="tel" className="input min-w-0 flex-1" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 71 234 5678" required />
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">We&apos;ll send a verification code to this number via WhatsApp.</p>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={sendingOtp}>
            {sendingOtp ? "Sending code…" : "Send verification code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <p className="text-sm text-[var(--muted)]">
            We sent a 6-digit code to +{dialingCode} {phoneNumber.trim()} via WhatsApp. Enter it below.
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
            {loading ? "Submitting…" : "Submit registration"}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/captain/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
