"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { POSITIONS } from "@/lib/positions";
import { DEFAULT_LEAGUES } from "@/lib/leagues";
import { PLATFORMS } from "@/lib/platforms";
import { ROLES } from "@/lib/roles";
import Toast from "@/components/Toast";

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

const CLUB_STATUSES = [
  "Free agents only",
  "Will pay transfer fee (R200)",
  "Open to both",
];

export default function CaptainPage() {
  const router = useRouter();
  const [captain, setCaptain] = useState<{
    email: string;
    teamName: string | null;
    listed: boolean;
    approvalStatus: string;
    platform: string | null;
    preferredLeagues: string[];
    preferredPositions: string[];
    role: string | null;
    clubStatus: string | null;
    trialGroupLink: string | null;
    requirements: string | null;
    whatsappNumber: string | null;
  } | null>(null);
  const [requests, setRequests] = useState<TrialRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Form state
  const [teamName, setTeamName] = useState("");
  const [listed, setListed] = useState(false);
  const [platform, setPlatform] = useState("");
  const [preferredLeagues, setPreferredLeagues] = useState<string[]>([]);
  const [preferredPositions, setPreferredPositions] = useState<string[]>([]);
  const [role, setRole] = useState("");
  const [clubStatus, setClubStatus] = useState("");
  const [trialGroupLink, setTrialGroupLink] = useState("");
  const [requirements, setRequirements] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    fetch("/api/captain/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.replace("/captain/login");
          return;
        }
        setCaptain(data);
        setTeamName(data.teamName ?? "");
        setListed(data.listed ?? false);
        setPlatform(data.platform ?? "");
        setPreferredLeagues(Array.isArray(data.preferredLeagues) ? data.preferredLeagues : []);
        setPreferredPositions(Array.isArray(data.preferredPositions) ? data.preferredPositions : []);
        setRole(data.role ?? "");
        setClubStatus(data.clubStatus ?? "");
        setTrialGroupLink(data.trialGroupLink ?? "");
        setRequirements(data.requirements ?? "");
        setWhatsappNumber(data.whatsappNumber ?? "");
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

  function toggleLeague(league: string) {
    setPreferredLeagues((prev) =>
      prev.includes(league) ? prev.filter((l) => l !== league) : [...prev, league]
    );
  }

  function togglePosition(pos: string) {
    setPreferredPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/captain/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          teamName: teamName.trim() || null,
          listed,
          platform: platform.trim() || null,
          preferredLeagues,
          preferredPositions,
          role: role.trim() || null,
          clubStatus: clubStatus.trim() || null,
          trialGroupLink: trialGroupLink.trim() || null,
          requirements: requirements.trim() || null,
          whatsappNumber: whatsappNumber.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCaptain(data);
        setShowSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!captain) return null;

  const displayName = (p: TrialRequestRow["player"]) =>
    [p.firstName, p.lastName].filter(Boolean).join(" ") || p.userName || "Player";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text)]">Captain</h1>
        <div className="flex gap-2">
          <Link href="/market" className="btn-primary">Browse market</Link>
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              await fetch("/api/auth/captain/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="card">
        <h2 className="font-semibold text-[var(--text)]">Account</h2>
        <p className="mt-1 text-[var(--muted)]">{captain.email}</p>
      </div>

      {/* Listing info */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--text)]">Looking for a player — listing info</h2>
        </div>

        <p className="text-sm text-[var(--muted)]">
          Fill in your details. Toggle <strong>Listed on market</strong> below to show or hide your listing on the transfer market.
        </p>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Team name</label>
          <input
            type="text"
            className="input mt-1 max-w-xs"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Azzurri Esports"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">WhatsApp number</label>
          <p className="mb-1 text-xs text-[var(--muted)]">Include dialling code, e.g. +27821234567</p>
          <input
            type="text"
            className="input max-w-xs"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+27821234567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Platform</label>
          <select
            className="input mt-1 max-w-xs"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="">Select platform</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Role needed</label>
          <select
            className="input mt-1 max-w-xs"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">Any</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Leagues</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEFAULT_LEAGUES.map((league) => (
              <button
                key={league}
                type="button"
                onClick={() => toggleLeague(league)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  preferredLeagues.includes(league)
                    ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                {league}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Positions needed</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => togglePosition(pos)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  preferredPositions.includes(pos)
                    ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Club status</label>
          <p className="mb-1 text-xs text-[var(--muted)]">Are you willing to pay the R200 transfer fee for club-signed players?</p>
          <select
            className="input mt-1 max-w-xs"
            value={clubStatus}
            onChange={(e) => setClubStatus(e.target.value)}
          >
            <option value="">Select…</option>
            {CLUB_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Trial group link</label>
          <input
            type="text"
            className="input"
            value={trialGroupLink}
            onChange={(e) => setTrialGroupLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)]">Requirements / extra info</label>
          <textarea
            className="input min-h-[80px] resize-y"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="e.g. Must be available Tue/Thu evenings, competitive mindset..."
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3">
          <div>
            <p className="text-sm font-medium text-[var(--text)]">
              {listed ? "Listed on market" : "Not listed on market"}
            </p>
            <p className="text-xs text-[var(--muted)]">Toggle to show or hide your listing on the transfer market</p>
          </div>
          <div
            role="switch"
            aria-checked={listed}
            onClick={() => setListed((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
              listed ? "bg-[var(--accent)]" : "bg-[var(--border)]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                listed ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary w-full" disabled={saving}>
          {saving ? "Saving…" : "Save listing info"}
        </button>
      </div>

      {/* Trial requests */}
      <div className="card">
        <h2 className="font-semibold text-[var(--text)]">Your trial requests</h2>
        {loading ? (
          <p className="mt-2 text-[var(--muted)]">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="mt-2 text-[var(--muted)]">You haven't requested any trials yet.</p>
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

      <Toast message="Changes saved" show={showSaved} onDone={() => setShowSaved(false)} />
    </div>
  );
}
