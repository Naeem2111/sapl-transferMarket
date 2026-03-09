"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_LEAGUES } from "@/lib/leagues";
import { POSITIONS } from "@/lib/positions";

type MarketPlayer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  gamertag: string | null;
  preferredPositions: string[];
  preferredLeagues: string[];
  bio: string | null;
  updatedAt: string;
  whatsappLink?: string | null;
  alreadyRequestedTrial?: boolean;
};

export default function MarketPage() {
  const [players, setPlayers] = useState<MarketPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLeague, setFilterLeague] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [trialMessage, setTrialMessage] = useState("");
  const [modalPlayer, setModalPlayer] = useState<MarketPlayer | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterLeague) params.set("league", filterLeague);
    if (filterPosition) params.set("position", filterPosition);
    fetch(`/api/market?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlayers(data);
        else setPlayers([]);
      })
      .finally(() => setLoading(false));
  }, [filterLeague, filterPosition]);

  useEffect(() => {
    fetch("/api/captain/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setIsCaptain(!data.error))
      .catch(() => setIsCaptain(false));
  }, []);

  async function handleRequestTrial(playerId: string) {
    setRequestingId(playerId);
    try {
      const res = await fetch("/api/trial-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          playerId,
          message: trialMessage.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setModalPlayer(null);
        setTrialMessage("");
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === playerId ? { ...p, alreadyRequestedTrial: true } : p
          )
        );
      } else {
        alert(data.error || "Request failed");
      }
    } finally {
      setRequestingId(null);
    }
  }

  const displayName = (p: MarketPlayer) =>
    [p.firstName, p.lastName].filter(Boolean).join(" ") ||
    p.gamertag ||
    "Player";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--text)]">Transfer market</h1>
        <div className="flex items-center gap-2">
          {isCaptain ? (
            <Link href="/captain" className="btn-ghost">
              Captain
            </Link>
          ) : (
            <>
              <Link href="/dashboard" className="btn-ghost">
                My profile
              </Link>
              <Link href="/captain/login" className="btn-ghost text-[var(--accent)]">
                Captains: Sign in
              </Link>
            </>
          )}
        </div>
      </div>
      <p className="text-[var(--muted)]">
        Only listed players are shown. Contact info is hidden; captains can request a trial or contact via WhatsApp.
      </p>

      {!isCaptain && (
        <div className="card border-[var(--accent)]/30 bg-[var(--accent)]/5">
          <p className="text-sm text-[var(--text)]">
            <strong>Are you a captain?</strong>{" "}
            <Link href="/captain/login" className="text-[var(--accent)] underline">
              Sign in with your email
            </Link>{" "}
            to request players to trial or to contact them via WhatsApp.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm text-[var(--muted)]">League</label>
          <select
            className="input mt-1 w-auto min-w-[200px]"
            value={filterLeague}
            onChange={(e) => setFilterLeague(e.target.value)}
          >
            <option value="">All leagues</option>
            {DEFAULT_LEAGUES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--muted)]">Position</label>
          <select
            className="input mt-1 w-auto min-w-[120px]"
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
          >
            <option value="">All positions</option>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : players.length === 0 ? (
        <div className="card text-center text-[var(--muted)]">
          No players listed at the moment.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => (
            <li key={p.id} className="card flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[var(--text)]">
                  {displayName(p)}
                </span>
                {p.gamertag && (
                  <span className="rounded bg-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)]">
                    {p.gamertag}
                  </span>
                )}
              </div>
              {p.preferredPositions.length > 0 && (
                <p className="mt-2 text-sm text-[var(--text)]">
                  Positions: {p.preferredPositions.join(", ")}
                </p>
              )}
              {p.preferredLeagues.length > 0 && (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Leagues: {p.preferredLeagues.join(", ")}
                </p>
              )}
              {p.bio && (
                <p className="mt-2 text-sm text-[var(--muted)]">{p.bio}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {isCaptain && (
                  <>
                    {p.alreadyRequestedTrial ? (
                      <span className="rounded bg-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)]">
                        Trial requested
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setModalPlayer(p)}
                        className="rounded border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/20"
                      >
                        Request trial
                      </button>
                    )}
                    {p.whatsappLink && (
                      <a
                        href={p.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-white/5"
                      >
                        Contact via WhatsApp
                      </a>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalPlayer && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setModalPlayer(null)}
        >
          <div
            className="card w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-[var(--text)]">
              Request trial – {displayName(modalPlayer)}
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Send a trial request. The player will see it in their dashboard.
            </p>
            <textarea
              className="input mt-3 min-h-[80px] resize-y"
              placeholder="Optional message (e.g. team name, when you train…)"
              value={trialMessage}
              onChange={(e) => setTrialMessage(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setModalPlayer(null);
                  setTrialMessage("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={requestingId === modalPlayer.id}
                onClick={() => handleRequestTrial(modalPlayer.id)}
              >
                {requestingId === modalPlayer.id ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
