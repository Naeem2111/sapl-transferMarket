"use client";

import { useState } from "react";
import Link from "next/link";
import { DIALING_CODES } from "@/lib/phone";

export default function ManualRegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dialingCode, setDialingCode] = useState("27");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [teamName, setTeamName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (!phoneNumber.trim()) {
      setError("Phone number is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dialingCode,
          phoneNumber: phoneNumber.trim(),
          email: email.trim() || undefined,
          teamName: teamName.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
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
      <div className="mx-auto max-w-sm text-center">
        <div className="card">
          <div className="mb-3 text-4xl">✅</div>
          <h1 className="text-xl font-bold text-[var(--text)]">Application submitted</h1>
          <p className="mt-2 text-[var(--muted)]">
            An admin will review your details and link your account. Once approved, you can
            register normally using your phone number.
          </p>
          <p className="mt-3 text-sm text-[var(--muted)]">
            This usually takes less than 24 hours.
          </p>
          <Link href="/" className="btn-primary mt-5 inline-block">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold text-[var(--text)]">Manual verification</h1>
      <p className="mt-1 text-[var(--muted)]">
        Can&apos;t register with your phone number? Fill in your details below and an admin will
        verify your identity and link your account.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Name */}
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--muted)]">First name *</label>
            <input
              type="text"
              className="input mt-1"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--muted)]">Last name *</label>
            <input
              type="text"
              className="input mt-1"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Phone number *</label>
          <div className="mt-1 flex gap-2">
            <div className="w-24 shrink-0">
              <select
                className="input"
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
            <input
              type="tel"
              className="input min-w-0 flex-1"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 71 234 5678"
              required
            />
          </div>
          <p className="mt-1 text-xs text-[var(--muted)]">
            The number you want to register with (doesn&apos;t have to match LeagueRepublic exactly).
          </p>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">Email (optional)</label>
          <input
            type="email"
            className="input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        {/* Team */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            SAPL team name (optional)
          </label>
          <input
            type="text"
            className="input mt-1"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Azzurri Esports"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">
            Anything else? (optional)
          </label>
          <textarea
            className="input mt-1"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. I changed my number recently, old number was 072..."
          />
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Submitting…" : "Submit for review"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        <Link href="/register" className="text-[var(--accent)] hover:underline">
          ← Back to registration
        </Link>
      </p>
    </div>
  );
}
