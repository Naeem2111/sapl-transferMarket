"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DEFAULT_LEAGUES } from "@/lib/leagues";
import { POSITIONS } from "@/lib/positions";
import { PLATFORMS } from "@/lib/platforms";
import { ROLES } from "@/lib/roles";

type MarketPlayer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  gamertag: string | null;
  role: string | null;
  platform: string | null;
  preferredPositions: string[];
  preferredLeagues: string[];
  bio: string | null;
  updatedAt: string;
  whatsappLink?: string | null;
  whatsappNumber?: string | null;
  previousClub?: string | null;
  alreadyRequestedTrial?: boolean;
};

type CaptainCard = {
  id: string;
  email: string;
  teamName: string | null;
  platform: string | null;
  preferredLeagues: string[];
  role: string | null;
  preferredPositions: string[];
  clubStatus: string | null;
  trialGroupLink: string | null;
  requirements: string | null;
  whatsappNumber: string | null;
};

export default function MarketPage() {
  const [players, setPlayers] = useState<MarketPlayer[]>([]);
  const [captains, setCaptains] = useState<CaptainCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLeague, setFilterLeague] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [trialMessage, setTrialMessage] = useState("");
  const [modalPlayer, setModalPlayer] = useState<MarketPlayer | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterLeague) params.set("league", filterLeague);
    if (filterPosition) params.set("position", filterPosition);
    if (filterPlatform) params.set("platform", filterPlatform);
    if (filterRole) params.set("role", filterRole);
    fetch(`/api/market?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPlayers(data);
        else setPlayers([]);
      })
      .finally(() => setLoading(false));
  }, [filterLeague, filterPosition, filterPlatform, filterRole]);

  useEffect(() => {
    fetch("/api/captain/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setIsCaptain(!data.error))
      .catch(() => setIsCaptain(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setIsAdmin(true);
          // Load captain cards for admin
          fetch("/api/admin/captains", { credentials: "include" })
            .then((r) => r.json())
            .then((d) => {
              if (Array.isArray(d)) setCaptains(d);
            });
        }
      })
      .catch(() => setIsAdmin(false));
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

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function buildPlayerPost(p: MarketPlayer): string {
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || p.gamertag || "Player";
    const lines = [
      "*Looking For A Team*",
      `Name: ${name}`,
      `Gamertag: ${p.gamertag || "—"}`,
      `League: ${p.preferredLeagues.join(", ") || "—"}`,
      `Platform: ${p.platform || "—"}`,
      `Role: ${p.role || "—"}`,
      `Position: ${p.preferredPositions.join(", ") || "—"}`,
      `Previous Club: ${p.previousClub || "—"}`,
      `Extra: ${p.bio || "—"}`,
      `Number: ${p.whatsappNumber || "—"}`,
    ];
    return lines.join("\n");
  }

  function buildCaptainPost(c: CaptainCard): string {
    const lines = [
      "*Looking For A Player*",
      `Team: ${c.teamName || "—"}`,
      `Number: ${c.whatsappNumber || "—"}`,
      `League: ${c.preferredLeagues.join(", ") || "—"}`,
      `Platform: ${c.platform || "—"}`,
      `Role: ${c.role || "—"}`,
      `Position: ${c.preferredPositions.join(", ") || "—"}`,
      `Club Status: ${c.clubStatus || "—"}`,
      `Requirements: ${c.requirements || "—"}`,
      `Trial Group Link: ${c.trialGroupLink || "—"}`,
      `Extra: —`,
    ];
    return lines.join("\n");
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

      {!isCaptain && !isAdmin && (
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
        <div>
          <label className="block text-sm text-[var(--muted)]">Platform</label>
          <select
            className="input mt-1 w-auto min-w-[120px]"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
          >
            <option value="">All platforms</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-[var(--muted)]">Role</label>
          <select
            className="input mt-1 w-auto min-w-[120px]"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>
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
              {(p.role || p.platform) && (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {[p.role, p.platform].filter(Boolean).join(" · ")}
                </p>
              )}
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
              {p.previousClub && (
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Previous club: {p.previousClub}
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
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(buildPlayerPost(p), p.id)}
                    className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5"
                  >
                    {copiedId === p.id ? "Copied ✓" : "Copy post"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Admin-only captain section */}
      {isAdmin && (
        <div className="space-y-4 pt-4 border-t border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--text)]">Captains looking for players</h2>
          {captains.length === 0 ? (
            <div className="card text-center text-[var(--muted)]">No captains have set up their listing yet.</div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {captains.map((c) => (
                <li key={c.id} className="card flex flex-col">
                  <span className="font-semibold text-[var(--text)]">{c.teamName || c.email}</span>
                  {c.platform && (
                    <p className="mt-1 text-sm text-[var(--muted)]">{c.platform}</p>
                  )}
                  {c.preferredLeagues.length > 0 && (
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      Leagues: {c.preferredLeagues.join(", ")}
                    </p>
                  )}
                  {c.preferredPositions.length > 0 && (
                    <p className="mt-1 text-sm text-[var(--text)]">
                      Positions: {c.preferredPositions.join(", ")}
                    </p>
                  )}
                  {c.role && (
                    <p className="mt-1 text-sm text-[var(--muted)]">Role: {c.role}</p>
                  )}
                  {c.clubStatus && (
                    <p className="mt-1 text-sm text-[var(--muted)]">Club status: {c.clubStatus}</p>
                  )}
                  {c.requirements && (
                    <p className="mt-2 text-sm text-[var(--muted)]">{c.requirements}</p>
                  )}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(buildCaptainPost(c), `captain-${c.id}`)}
                      className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5"
                    >
                      {copiedId === `captain-${c.id}` ? "Copied ✓" : "Copy post"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
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
