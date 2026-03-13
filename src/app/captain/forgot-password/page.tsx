"use client";

import { useState } from "react";
import Link from "next/link";

export default function CaptainForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/captain/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        return;
      }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-sm text-center space-y-4">
        <div className="text-4xl">📧</div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Check your email</h1>
        <p className="text-[var(--muted)]">
          If an account exists for <strong>{email}</strong>, we've sent a password reset link. Check your inbox.
        </p>
        <Link href="/captain/login" className="btn-ghost inline-block mt-2">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-[var(--text)]">Forgot password</h1>
      <p className="mt-1 text-[var(--muted)]">
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Email</label>
          <input type="email" className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Remember it?{" "}
        <Link href="/captain/login" className="text-[var(--accent)] hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
