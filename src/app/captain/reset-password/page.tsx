"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid reset link. Please request a new one.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/captain/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Reset failed"); return; }
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
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
    <>
      <h1 className="text-2xl font-bold text-[var(--text)]">Reset password</h1>
      <p className="mt-1 text-[var(--muted)]">Enter your new password below.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">New password</label>
          <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Confirm new password</label>
          <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6} required />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading || !token}>
          {loading ? "Resetting…" : "Reset password"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        <Link href="/captain/forgot-password" className="text-[var(--accent)] hover:underline">Request a new link</Link>
      </p>
    </>
  );
}

export default function CaptainResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm">
      <Suspense fallback={<p className="text-[var(--muted)]">Loading…</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
