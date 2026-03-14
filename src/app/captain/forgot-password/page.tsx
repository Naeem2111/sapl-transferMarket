"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DIALING_CODES } from "@/lib/phone";
import PasswordInput from "@/components/PasswordInput";

type Step = "phone" | "code" | "done";

export default function CaptainForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [dialingCode, setDialingCode] = useState("27");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/captain/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dialingCode, phoneNumber: phoneNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to send code"); return; }
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/captain/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dialingCode,
          phoneNumber: phoneNumber.trim(),
          code: code.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed"); return; }
      setStep("done");
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-sm text-center space-y-4">
        <div className="text-4xl">✅</div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Password updated</h1>
        <p className="text-[var(--muted)]">Your password has been reset. You can now sign in.</p>
        <button type="button" className="btn-primary w-full mt-2" onClick={() => router.push("/captain/login")}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-[var(--text)]">Reset captain password</h1>

      {step === "phone" && (
        <>
          <p className="mt-1 text-[var(--muted)]">
            Enter the phone number linked to your captain account. We&apos;ll send a code via WhatsApp.
          </p>
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
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
            </div>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Sending…" : "Send verification code"}
            </button>
          </form>
        </>
      )}

      {step === "code" && (
        <>
          <p className="mt-1 text-[var(--muted)]">
            Enter the code sent to +{dialingCode} {phoneNumber.trim()} via WhatsApp and choose a new password.
          </p>
          <form onSubmit={handleReset} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">Verification code</label>
              <input
                type="text" inputMode="numeric" maxLength={6}
                className="input mt-1 font-mono text-lg tracking-widest"
                value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">New password</label>
              <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--muted)]">Confirm new password</label>
              <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
            </div>
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Resetting…" : "Reset password"}
            </button>
            <button type="button" className="btn-ghost w-full text-sm" onClick={() => { setStep("phone"); setError(""); }}>
              ← Use a different number
            </button>
          </form>
        </>
      )}

      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Remember it?{" "}
        <Link href="/captain/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
