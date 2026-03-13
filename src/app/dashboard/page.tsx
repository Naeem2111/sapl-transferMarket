"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { POSITIONS } from "@/lib/positions";
import { DEFAULT_LEAGUES } from "@/lib/leagues";
import { ROLES } from "@/lib/roles";
import { PLATFORMS } from "@/lib/platforms";

type Player = {
  id: string;
  personId: string;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  email: string | null;
  teams: string | null;
  status: string | null;
  listed: boolean;
  gamertag: string | null;
  role: string | null;
  platform: string | null;
  internalRef1: string | null;
  internalRef2: string | null;
  preferredPositions: string[];
  preferredLeagues: string[];
  bio: string | null;
  previousClub: string | null;
};

type TrialRequest = {
  id: string;
  captain: { email: string; teamName: string | null };
  message: string | null;
  status: string;
  createdAt: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listed, setListed] = useState(false);
  const [positions, setPositions] = useState<string[]>([]);
  const [leagues, setLeagues] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [gamertag, setGamertag] = useState("");
  const [role, setRole] = useState("");
  const [platform, setPlatform] = useState("");
  const [previousClub, setPreviousClub] = useState("");
  const [trialRequests, setTrialRequests] = useState<TrialRequest[]>([]);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const [clubSuggestions, setClubSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { router.replace("/login"); return; }
        setPlayer(data);
        setListed(data.listed ?? false);
        setPositions(Array.isArray(data.preferredPositions) ? data.preferredPositions : []);
        setLeagues(Array.isArray(data.preferredLeagues) ? data.preferredLeagues : []);
        setBio(data.bio ?? "");
        setGamertag(data.gamertag ?? "");
        setRole(ROLES.includes(data.role) ? data.role : "Starter");
        setPlatform(data.platform ?? "");
        setPreviousClub(data.previousClub ?? "");
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!player) return;
    fetch("/api/trial-requests/list", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setTrialRequests(data) : setTrialRequests([])))
      .catch(() => setTrialRequests([]));
  }, [player?.id]);

  useEffect(() => {
    fetch("/api/clubs")
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setClubSuggestions(data) : setClubSuggestions([])))
      .catch(() => setClubSuggestions([]));
  }, []);

  async function handleSave() {
    if (!player) return;
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listed,
          gamertag: gamertag.trim() || null,
          role: role.trim() || "Starter",
          platform: platform.trim() || null,
          preferredPositions: positions,
          preferredLeagues: leagues,
          bio: bio || null,
          previousClub: previousClub.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) setPlayer(data);
    } finally {
      setSaving(false);
    }
  }

  function togglePosition(pos: string) {
    setPositions((prev) => prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]);
  }

  function toggleLeague(league: string) {
    setLeagues((prev) => prev.includes(league) ? prev.filter((l) => l !== league) : [...prev, league]);
  }

  async function respondToTrialRequest(requestId: string, status: "accepted" | "declined") {
    setUpdatingRequestId(requestId);
    try {
      const res = await fetch(`/api/trial-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setTrialRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status } : r)));
      }
    } finally {
      setUpdatingRequestId(null);
    }
  }

  if (loading) return <p className="text-[var(--muted)]">Loading…</p>;
  if (!player) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text)]">My profile</h1>
        <div className="flex gap-2">
          <Link href="/market" className="btn-ghost">Market</Link>
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* LeagueRepublic info */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-[var(--text)]">LeagueRepublic info</h2>
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-[var(--muted)]">Name</dt>
            <dd className="text-[var(--text)]">{[player.firstName, player.lastName].filter(Boolean).join(" ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Gamertag / Username</dt>
            <dd className="text-[var(--text)]">{player.userName || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Person ID</dt>
            <dd className="text-[var(--text)]">{player.personId}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Teams</dt>
            <dd className="text-[var(--text)]">{player.teams || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--muted)]">Status</dt>
            <dd className="text-[var(--text)]">{player.status || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Listing */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text)]">Transfer market listing</h2>
          <label className="flex cursor-pointer items-center gap-2">
            <span className="text-sm text-[var(--muted)]">
              {listed ? "Listed on market" : "Not listed"}
            </span>
            <div
              role="switch"
              aria-checked={listed}
              onClick={() => setListed((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                listed ? "bg-[var(--accent)]" : "bg-[var(--border)]"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${listed ? "translate-x-6" : "translate-x-1"}`} />
            </div>
          </label>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Only when this is on will you appear in the market for teams to see.
        </p>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Gamertag</label>
          <p className="mb-1 text-xs text-[var(--muted)]">
            From LeagueRepublic: <strong className="text-[var(--text)]">{player.internalRef1 || player.internalRef2 || "—"}</strong>. Override below if different.
          </p>
          <input type="text" className="input max-w-xs" value={gamertag} onChange={(e) => setGamertag(e.target.value)} placeholder="Override (optional)" />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Previous club</label>
          <p className="mb-1 text-xs text-[var(--muted)]">Leave blank if you are a free agent.</p>
          <input type="text" className="input max-w-xs" list="club-suggestions" value={previousClub} onChange={(e) => setPreviousClub(e.target.value)} placeholder="e.g. FC Zamalek (or leave blank)" />
          <datalist id="club-suggestions">
            {clubSuggestions.map((club) => (
              <option key={club} value={club} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Platform</label>
          <select className="input mt-1 max-w-xs" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="">Select platform</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Role</label>
          <select className="input mt-1 max-w-xs" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Preferred positions</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {POSITIONS.map((pos) => (
              <button key={pos} type="button" onClick={() => togglePosition(pos)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${positions.includes(pos) ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"}`}>
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Preferred leagues</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEFAULT_LEAGUES.map((league) => (
              <button key={league} type="button" onClick={() => toggleLeague(league)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${leagues.includes(league) ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]" : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"}`}>
                {league}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Short bio (optional)</label>
          <textarea className="input mt-1 min-h-[100px] resize-y" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="e.g. CAM/CM, looking for a competitive team in Premiership..." />
        </div>

        <button onClick={handleSave} className="btn-primary w-full" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {/* Trial requests */}
      {trialRequests.length > 0 && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-[var(--text)]">Trial requests</h2>
          <p className="text-sm text-[var(--muted)]">Captains have requested you to trial. Accept or decline.</p>
          <ul className="space-y-3">
            {trialRequests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] p-3">
                <div>
                  <span className="font-medium text-[var(--text)]">{r.captain.teamName || r.captain.email}</span>
                  <span className="ml-2 rounded px-2 py-0.5 text-xs text-[var(--muted)]">{r.status}</span>
                </div>
                {r.message && <p className="w-full text-sm text-[var(--muted)]">{r.message}</p>}
                {r.status === "pending" && (
                  <div className="flex gap-2">
                    <button type="button" disabled={updatingRequestId === r.id} onClick={() => respondToTrialRequest(r.id, "accepted")}
                      className="rounded border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/20 disabled:opacity-50">
                      Accept
                    </button>
                    <button type="button" disabled={updatingRequestId === r.id} onClick={() => respondToTrialRequest(r.id, "declined")}
                      className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5 disabled:opacity-50">
                      Decline
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
