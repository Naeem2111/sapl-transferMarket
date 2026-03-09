"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CaptainRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/captain/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          teamName: teamName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/market");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-[var(--text)]">Create captain account</h1>
      <p className="mt-1 text-[var(--muted)]">
        Use your email. Add your team name so players see who requested them.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Email</label>
          <input
            type="email"
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Team name (optional)</label>
          <input
            type="text"
            className="input mt-1"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Azzurri Esports"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Password (min 6 characters)</label>
          <input
            type="password"
            className="input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>
        {error && (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link href="/captain/login" className="text-[var(--accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
