"use client";

import { useState } from "react";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";

export default function CaptainRegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/captain/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, teamName: teamName.trim() || undefined }),
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
          Your captain account is pending approval. You'll be able to sign in once an admin approves your registration.
        </p>
        <Link href="/market" className="btn-ghost inline-block mt-2">Back to market</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-[var(--text)]">Create captain account</h1>
      <p className="mt-1 text-[var(--muted)]">
        Submit your details. An admin will review and approve your account before you can sign in.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Email</label>
          <input type="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Team name (optional)</label>
          <input type="text" className="input mt-1" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. Azzurri Esports" />
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
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/captain/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
