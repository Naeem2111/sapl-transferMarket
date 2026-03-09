"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TrialRequestRow = {
  id: string;
  playerId: string;
  player: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    userName: string | null;
    preferredPositions: string;
    preferredLeagues: string;
  };
  message: string | null;
  status: string;
  createdAt: string;
};

export default function CaptainPage() {
  const router = useRouter();
  const [captain, setCaptain] = useState<{ email: string; teamName: string | null } | null>(null);
  const [requests, setRequests] = useState<TrialRequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/captain/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.replace("/captain/login");
          return;
        }
        setCaptain({ email: data.email, teamName: data.teamName });
      })
      .catch(() => router.replace("/captain/login"));
  }, [router]);

  useEffect(() => {
    fetch("/api/trial-requests/list", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRequests(data);
        else setRequests([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!captain) return null;

  const displayName = (p: TrialRequestRow["player"]) =>
    [p.firstName, p.lastName].filter(Boolean).join(" ") || p.userName || "Player";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text)]">Captain</h1>
        <Link href="/market" className="btn-primary">Browse market</Link>
      </div>
      <div className="card">
        <h2 className="font-semibold text-[var(--text)]">Account</h2>
        <p className="mt-1 text-[var(--muted)]">{captain.email}</p>
        {captain.teamName && (
          <p className="mt-1 text-[var(--text)]">Team: {captain.teamName}</p>
        )}
      </div>
      <div className="card">
        <h2 className="font-semibold text-[var(--text)]">Your trial requests</h2>
        {loading ? (
          <p className="mt-2 text-[var(--muted)]">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="mt-2 text-[var(--muted)]">You haven’t requested any trials yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {requests.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3"
              >
                <div>
                  <span className="font-medium text-[var(--text)]">{displayName(r.player)}</span>
                  <span className="ml-2 rounded px-2 py-0.5 text-xs text-[var(--muted)]">
                    {r.status}
                  </span>
                </div>
                {r.message && (
                  <p className="w-full text-sm text-[var(--muted)]">{r.message}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
