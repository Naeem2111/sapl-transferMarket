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
  whatsappLink: string | null;
};

type Tab = "players" | "captains";

const CLUB_STATUSES = [
  "Free agents only",
  "Will pay transfer fee (R200)",
  "Open to both",
];

export default function MarketPage() {
  const [tab, setTab] = useState<Tab>("players");

  // Player filters
  const [filterLeague, setFilterLeague] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // Captain filters
  const [capFilterLeague, setCapFilterLeague] = useState("");
  const [capFilterPosition, setCapFilterPosition] = useState("");
  const [capFilterPlatform, setCapFilterPlatform] = useState("");
  const [capFilterRole, setCapFilterRole] = useState("");
  const [capFilterClubStatus, setCapFilterClubStatus] = useState("");

  const [players, setPlayers] = useState<MarketPlayer[]>([]);
  const [captains, setCaptains] = useState<CaptainCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [captainsLoading, setCaptainsLoading] = useState(true);
  const [isCaptain, setIsCaptain] = useState(false);
  const [isPlayer, setIsPlayer] = useState(false);
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
    setLoading(true);
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
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setIsPlayer(!data.error))
      .catch(() => setIsPlayer(false));
  }, []);

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => { if (!data.error) setIsAdmin(true); })
      .catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    fetch("/api/market/captains", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setCaptains(d); })
      .finally(() => setCaptainsLoading(false));
  }, []);

  // Client-side filtering for captains
  const filteredCaptains = captains.filter((c) => {
    if (capFilterLeague && !c.preferredLeagues.includes(capFilterLeague)) return false;
    if (capFilterPosition && !c.preferredPositions.includes(capFilterPosition)) return false;
    if (capFilterPlatform && c.platform !== capFilterPlatform) return false;
    if (capFilterRole && c.role !== capFilterRole) return false;
    if (capFilterClubStatus && c.clubStatus !== capFilterClubStatus) return false;
    return true;
  });

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
    return [
      "*Looking For A Team*",
      `Name: ${name}`,
      `Gamertag: ${p.gamertag || "—"}`,
      `League: ${p.preferredLeagues.join(", ") || "—"}`,
      `Platform: ${p.platform || "—"}`,
      `Role: ${p.role || "—"}`,
      `Position: ${p.preferredPositions.join(", ") || "—"}`,
      `Previous Club: ${p.previousClub || "Free Agent"}`,
      `Extra: ${p.bio || "—"}`,
      `Number: ${p.whatsappNumber || "—"}`,
    ].join("\n");
  }

  function buildCaptainPost(c: CaptainCard): string {
    return [
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
    ].join("\n");
  }

  const displayName = (p: MarketPlayer) =>
    [p.firstName, p.lastName].filter(Boolean).join(" ") || p.gamertag || "Player";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--text)]">Transfer market</h1>
        <div className="flex items-center gap-2">
          {isCaptain ? (
            <Link href="/captain" className="btn-ghost">Captain dashboard</Link>
          ) : isPlayer ? (
            <Link href="/dashboard" className="btn-ghost">My profile</Link>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">Player sign in</Link>
              <Link href="/captain/login" className="btn-ghost text-[var(--accent)]">
                Captain sign in
              </Link>
            </>
          )}
        </div>
      </div>

      {!isCaptain && !isPlayer && !isAdmin && (
        <div className="card border-[var(--accent)]/30 bg-[var(--accent)]/5">
          <p className="text-sm text-[var(--text)]">
            <strong>Sign in</strong> as a player to contact teams, or as a captain to contact players.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-lg border border-[var(--border)] p-1 w-fit gap-1">
        <button
          type="button"
          onClick={() => setTab("players")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "players"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          Looking for a team
        </button>
        <button
          type="button"
          onClick={() => setTab("captains")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "captains"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          Looking for a player
        </button>
      </div>

      {/* ── TAB 1: LOOKING FOR A TEAM ── */}
      {tab === "players" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Players available for signing.{" "}
            {!isCaptain && !isAdmin && "Sign in as a captain to contact them."}
          </p>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-[var(--muted)]">League</label>
              <select className="input mt-1 w-auto min-w-[200px]" value={filterLeague} onChange={(e) => setFilterLeague(e.target.value)}>
                <option value="">All leagues</option>
                {DEFAULT_LEAGUES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)]">Position</label>
              <select className="input mt-1 w-auto min-w-[120px]" value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)}>
                <option value="">All positions</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)]">Platform</label>
              <select className="input mt-1 w-auto min-w-[120px]" value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
                <option value="">All platforms</option>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)]">Role</label>
              <select className="input mt-1 w-auto min-w-[120px]" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                <option value="">All roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-[var(--muted)]">Loading…</p>
          ) : players.length === 0 ? (
            <div className="card text-center text-[var(--muted)]">No players listed at the moment.</div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {players.map((p) => (
                <li key={p.id} className="card flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--text)]">{displayName(p)}</span>
                    {p.gamertag && (
                      <span className="rounded bg-[var(--border)] px-2 py-0.5 text-xs text-[var(--muted)]">{p.gamertag}</span>
                    )}
                  </div>
                  {(p.role || p.platform) && (
                    <p className="mt-1 text-sm text-[var(--muted)]">{[p.role, p.platform].filter(Boolean).join(" · ")}</p>
                  )}
                  {p.preferredPositions.length > 0 && (
                    <p className="mt-2 text-sm text-[var(--text)]">Positions: {p.preferredPositions.join(", ")}</p>
                  )}
                  {p.preferredLeagues.length > 0 && (
                    <p className="mt-1 text-sm text-[var(--muted)]">Leagues: {p.preferredLeagues.join(", ")}</p>
                  )}
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Previous club: {p.previousClub || "Free Agent"}
                  </p>
                  {p.bio && <p className="mt-2 text-sm text-[var(--muted)]">{p.bio}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isCaptain && (
                      <>
                        {p.alreadyRequestedTrial ? (
                          <span className="rounded bg-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)]">Trial requested</span>
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
                          <a href={p.whatsappLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-white/5">
                            Contact via WhatsApp
                          </a>
                        )}
                      </>
                    )}
                    {isAdmin && (
                      <button type="button" onClick={() => copyToClipboard(buildPlayerPost(p), p.id)}
                        className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5">
                        {copiedId === p.id ? "Copied ✓" : "Copy post"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── TAB 2: LOOKING FOR A PLAYER ── */}
      {tab === "captains" && (
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            Teams looking to sign players.{" "}
            {!isPlayer && !isAdmin && "Sign in as a player to contact them."}
          </p>

          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-[var(--muted)]">League</label>
              <select className="input mt-1 w-auto min-w-[200px]" value={capFilterLeague} onChange={(e) => setCapFilterLeague(e.target.value)}>
                <option value="">All leagues</option>
                {DEFAULT_LEAGUES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)]">Position</label>
              <select className="input mt-1 w-auto min-w-[120px]" value={capFilterPosition} onChange={(e) => setCapFilterPosition(e.target.value)}>
                <option value="">All positions</option>
                {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)]">Platform</label>
              <select className="input mt-1 w-auto min-w-[120px]" value={capFilterPlatform} onChange={(e) => setCapFilterPlatform(e.target.value)}>
                <option value="">All platforms</option>
                {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)]">Role</label>
              <select className="input mt-1 w-auto min-w-[120px]" value={capFilterRole} onChange={(e) => setCapFilterRole(e.target.value)}>
                <option value="">All roles</option>
                {ROLES.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)]">Club status</label>
              <select className="input mt-1 w-auto min-w-[200px]" value={capFilterClubStatus} onChange={(e) => setCapFilterClubStatus(e.target.value)}>
                <option value="">All</option>
                {CLUB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {captainsLoading ? (
            <p className="text-[var(--muted)]">Loading…</p>
          ) : filteredCaptains.length === 0 ? (
            <div className="card text-center text-[var(--muted)]">No teams match your filters.</div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCaptains.map((c) => (
                <li key={c.id} className="card flex flex-col">
                  <span className="font-semibold text-[var(--text)]">{c.teamName || "Unknown Team"}</span>
                  {c.platform && <p className="mt-1 text-sm text-[var(--muted)]">{c.platform}</p>}
                  {c.preferredLeagues.length > 0 && (
                    <p className="mt-1 text-sm text-[var(--muted)]">Leagues: {c.preferredLeagues.join(", ")}</p>
                  )}
                  {c.preferredPositions.length > 0 && (
                    <p className="mt-1 text-sm text-[var(--text)]">Positions: {c.preferredPositions.join(", ")}</p>
                  )}
                  {c.role && <p className="mt-1 text-sm text-[var(--muted)]">Role: {c.role}</p>}
                  {c.clubStatus && <p className="mt-1 text-sm text-[var(--muted)]">Club status: {c.clubStatus}</p>}
                  {c.requirements && <p className="mt-2 text-sm text-[var(--muted)]">{c.requirements}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isPlayer && (
                      <>
                        {c.trialGroupLink && (
                          <a href={c.trialGroupLink} target="_blank" rel="noopener noreferrer"
                            className="rounded border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/20">
                            Join trial group
                          </a>
                        )}
                        {c.whatsappLink && (
                          <a href={c.whatsappLink} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-white/5">
                            Contact via WhatsApp
                          </a>
                        )}
                      </>
                    )}
                    {isAdmin && (
                      <button type="button" onClick={() => copyToClipboard(buildCaptainPost(c), `captain-${c.id}`)}
                        className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5">
                        {copiedId === `captain-${c.id}` ? "Copied ✓" : "Copy post"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Trial request modal */}
      {modalPlayer && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/60 p-4" onClick={() => setModalPlayer(null)}>
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-[var(--text)]">Request trial – {displayName(modalPlayer)}</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">Send a trial request. The player will see it in their dashboard.</p>
            <textarea
              className="input mt-3 min-h-[80px] resize-y"
              placeholder="Optional message (e.g. team name, when you train…)"
              value={trialMessage}
              onChange={(e) => setTrialMessage(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => { setModalPlayer(null); setTrialMessage(""); }}>
                Cancel
              </button>
              <button type="button" className="btn-primary" disabled={requestingId === modalPlayer.id} onClick={() => handleRequestTrial(modalPlayer.id)}>
                {requestingId === modalPlayer.id ? "Sending…" : "Send request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
