"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DIALING_CODES } from "@/lib/phone";

export default function LoginPage() {
  const router = useRouter();
  const [dialingCode, setDialingCode] = useState("27");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dialingCode,
          phoneNumber: phoneNumber.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-[var(--text)]">Sign in</h1>
      <p className="mt-1 text-[var(--muted)]">
        Use the phone number you registered with
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="flex gap-2">
          <div className="w-24 shrink-0">
            <label className="block text-sm font-medium text-[var(--muted)]">Code</label>
            <select
              className="input mt-1"
              value={dialingCode}
              onChange={(e) => setDialingCode(e.target.value)}
              title="Dialing code"
            >
              {DIALING_CODES.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label className="block text-sm font-medium text-[var(--muted)]">Phone number</label>
            <input
              type="tel"
              className="input mt-1"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 71 234 5678"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Password</label>
          <input
            type="password"
            className="input mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="text-sm text-[var(--danger)]">{error}</p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        First time?{" "}
        <Link href="/register" className="text-[var(--accent)] hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
