"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Toast from "@/components/Toast";
import { PLATFORMS } from "@/lib/platforms";
import { formatPhoneDisplay } from "@/lib/phone";

type PlayerUser = {
  type: "player";
  id: string;
  personId: string;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  gamertag: string | null;
  email: string | null;
  authPhone: string | null;
  mobilePhone: string | null;
  workPhone: string | null;
  homePhone: string | null;
  teams: string | null;
  role: string | null;
  platform: string | null;
  status: string | null;
  listed: boolean;
  preferredPositions: string[];
  preferredLeagues: string[];
  bio: string | null;
  previousClub: string | null;
  internalRef1: string | null;
  internalRef2: string | null;
  createdAt: string;
};

type CaptainUser = {
  type: "captain";
  id: string;
  email: string;
  teamName: string | null;
  approvalStatus: string;
  listed: boolean;
  platform: string | null;
  preferredLeagues: string[];
  preferredPositions: string[];
  role: string | null;
  clubStatus: string | null;
  whatsappNumber: string | null;
  trialGroupLink: string | null;
  requirements: string | null;
  createdAt: string;
};

type EditingUser = {
  type: "player" | "captain";
  id: string;
  fields: Record<string, string>;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<PlayerUser[]>([]);
  const [captains, setCaptains] = useState<CaptainUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"players" | "captains">("players");
  const [playerPage, setPlayerPage] = useState(1);
  const [capPage, setCapPage] = useState(1);
  const [editing, setEditing] = useState<EditingUser | null>(null);
  const [editPlatforms, setEditPlatforms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.replace("/admin/login");
      });
  }, [router]);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    fetch(`/api/admin/users?${params}`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : { players: [], captains: [] })
      .then((data) => {
        setPlayers(data.players || []);
        setCaptains(data.captains || []);
      })
      .catch(() => { setPlayers([]); setCaptains([]); })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300); // debounce search
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Reset pages when search changes
  useEffect(() => {
    setPlayerPage(1);
    setCapPage(1);
  }, [search]);

  const PAGE_SIZE = 20;
  const paginatedPlayers = players.slice((playerPage - 1) * PAGE_SIZE, playerPage * PAGE_SIZE);
  const paginatedCaptains = captains.slice((capPage - 1) * PAGE_SIZE, capPage * PAGE_SIZE);
  const playerTotalPages = Math.max(1, Math.ceil(players.length / PAGE_SIZE));
  const capTotalPages = Math.max(1, Math.ceil(captains.length / PAGE_SIZE));

  function Pagination({ page, totalPages, total, onPageChange, label }: { page: number; totalPages: number; total: number; onPageChange: (p: number) => void; label: string }) {
    if (totalPages <= 1) return null;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <p className="text-sm text-[var(--muted)]">Page {page} of {totalPages} — {total} {label}</p>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}
            className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed">← Previous</button>
          <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
            className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--text)] hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
        </div>
      </div>
    );
  }

  function startEditPlayer(p: PlayerUser) {
    setEditing({
      type: "player",
      id: p.id,
      fields: {
        personId: p.personId || "",
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        gamertag: p.gamertag || "",
        email: p.email || "",
        authPhone: formatPhoneDisplay(p.authPhone || p.mobilePhone),
        teams: p.teams || "",
        role: p.role || "",
        platform: p.platform || "",
        previousClub: p.previousClub || "",
        status: p.status || "",
      },
    });
    setEditError("");
  }

  function startEditCaptain(c: CaptainUser) {
    // Parse platform — could be JSON array or single string
    let plats: string[] = [];
    if (c.platform) {
      try {
        const parsed = JSON.parse(c.platform);
        plats = Array.isArray(parsed) ? parsed : [c.platform];
      } catch {
        plats = c.platform.trim() ? [c.platform.trim()] : [];
      }
    }
    setEditPlatforms(plats);
    setEditing({
      type: "captain",
      id: c.id,
      fields: {
        email: c.email || "",
        teamName: c.teamName || "",
        role: c.role || "",
        clubStatus: c.clubStatus || "",
        whatsappNumber: c.whatsappNumber || "",
        trialGroupLink: c.trialGroupLink || "",
        requirements: c.requirements || "",
        approvalStatus: c.approvalStatus || "pending",
      },
    });
    setEditError("");
  }

  function updateField(key: string, value: string) {
    if (!editing) return;
    setEditing({ ...editing, fields: { ...editing.fields, [key]: value } });
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setSaving(true);
    setEditError("");
    try {
      const payload: Record<string, unknown> = { ...editing.fields };
      // For captains, include platforms as JSON string
      if (editing.type === "captain") {
        payload.platform = JSON.stringify(editPlatforms);
      }
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: editing.type,
          id: editing.id,
          data: payload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "Save failed");
        return;
      }
      setEditing(null);
      setEditPlatforms([]);
      setShowSaved(true);
      fetchUsers();
    } finally {
      setSaving(false);
    }
  }

  const playerName = (p: PlayerUser) =>
    [p.firstName, p.lastName].filter(Boolean).join(" ") || p.gamertag || p.userName || "Unknown";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--text)]">Registered users</h1>
        <div className="flex gap-2">
          <Link href="/admin" className="btn-ghost">Dashboard</Link>
          <Link href="/market" className="btn-ghost">Market</Link>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          className="input max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, number, gamertag, email, team..."
        />
      </div>

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
          Players ({players.length})
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
          Captains ({captains.length})
        </button>
      </div>

      {loading ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : (
        <>
          {/* Players tab */}
          {tab === "players" && (
            <div>
              {players.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No registered players found.</p>
              ) : (
                <>
                <ul className="space-y-3">
                  {paginatedPlayers.map((p) => (
                    <li key={p.id} className="card">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[var(--text)]">{playerName(p)}</p>
                          {p.gamertag && (
                            <p className="text-sm text-[var(--muted)]">GT: {p.gamertag}</p>
                          )}
                          <p className="text-sm text-[var(--muted)]">
                            {[formatPhoneDisplay(p.authPhone), p.email].filter(Boolean).join(" · ")}
                          </p>
                          {p.teams && (
                            <p className="text-sm text-[var(--muted)]">Team: {p.teams}</p>
                          )}
                          <p className="text-xs text-[var(--muted)]">
                            {p.personId} · {p.platform || "No platform"} · {p.role} · {p.listed ? "Listed" : "Not listed"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startEditPlayer(p)}
                          className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5"
                        >
                          Edit
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <Pagination page={playerPage} totalPages={playerTotalPages} total={players.length} onPageChange={setPlayerPage} label="players" />
                </>
              )}
            </div>
          )}

          {/* Captains tab */}
          {tab === "captains" && (
            <div>
              {captains.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No captains found.</p>
              ) : (
                <>
                <ul className="space-y-3">
                  {paginatedCaptains.map((c) => (
                    <li key={c.id} className="card">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[var(--text)] flex items-center gap-2">
                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.approvalStatus === "approved" ? "bg-green-400" : "bg-yellow-400"}`} />
                            {c.teamName || "(no team name)"}
                            {c.approvalStatus === "pending" && (
                              <span className="rounded bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-400">pending</span>
                            )}
                          </p>
                          <p className="text-sm text-[var(--muted)]">{c.email}</p>
                          {c.whatsappNumber && (
                            <p className="text-sm text-[var(--muted)]">WhatsApp: {c.whatsappNumber}</p>
                          )}
                          <p className="text-xs text-[var(--muted)]">
                            {c.approvalStatus} · {c.platform || "No platform"} · {c.listed ? "Listed" : "Not listed"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startEditCaptain(c)}
                          className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5"
                        >
                          Edit
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <Pagination page={capPage} totalPages={capTotalPages} total={captains.length} onPageChange={setCapPage} label="captains" />
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="card w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[var(--text)]">
              Edit {editing.type === "player" ? "player" : "captain"}
            </h3>

            {Object.entries(editing.fields).map(([key, value]) => {
              const labels: Record<string, string> = {
                personId: "Person ID (LeagueRepublic)",
                firstName: "First name",
                lastName: "Last name",
                gamertag: "Gamertag",
                email: "Email",
                authPhone: "Phone number",
                mobilePhone: "Phone number",
                teams: "Team",
                role: "Role",
                platform: "Platform",
                previousClub: "Previous club",
                status: "Status",
                teamName: "Team name",
                clubStatus: "Club status",
                whatsappNumber: "WhatsApp number",
                trialGroupLink: "Trial group link",
                requirements: "Requirements",
                approvalStatus: "Approval status",
              };
              const label = labels[key] || key;

              // Dropdown options for specific fields
              const dropdowns: Record<string, { value: string; label: string }[]> = {
                role: [
                  { value: "", label: "Select role" },
                  { value: "Starter", label: "Starter" },
                  { value: "Rotation", label: "Rotation" },
                  { value: "Both", label: "Both" },
                ],
                platform: [
                  { value: "", label: "Select platform" },
                  { value: "PC", label: "PC" },
                  { value: "PS5", label: "PS5" },
                  { value: "Xbox", label: "Xbox" },
                ],
                status: [
                  { value: "", label: "Select status" },
                  { value: "Active", label: "Active" },
                  { value: "Inactive", label: "Inactive" },
                ],
                clubStatus: [
                  { value: "", label: "Select club status" },
                  { value: "Free agents only", label: "Free agents only" },
                  { value: "Will pay transfer fee (R200)", label: "Will pay transfer fee (R200)" },
                  { value: "Open to both", label: "Open to both" },
                ],
                approvalStatus: [
                  { value: "pending", label: "pending" },
                  { value: "approved", label: "approved" },
                  { value: "rejected", label: "rejected" },
                  { value: "revoked", label: "revoked" },
                ],
              };

              const isDropdown = key in dropdowns;
              const isTextarea = key === "requirements" || key === "bio";

              return (
              <div key={key}>
                <label className="block text-sm font-medium text-[var(--muted)]">
                  {label}
                </label>
                {isDropdown ? (
                  <select
                    className="input mt-1"
                    value={value}
                    onChange={(e) => updateField(key, e.target.value)}
                  >
                    {dropdowns[key].map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : isTextarea ? (
                  <textarea
                    className="input mt-1"
                    rows={3}
                    value={value}
                    onChange={(e) => updateField(key, e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="input mt-1"
                    value={value}
                    onChange={(e) => updateField(key, e.target.value)}
                  />
                )}
              </div>
              );
            })}

            {/* Platform toggle buttons for captains */}
            {editing.type === "captain" && (
              <div>
                <label className="block text-sm font-medium text-[var(--muted)]">Platform</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                        editPlatforms.includes(p)
                          ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--muted)] hover:bg-white/5"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {editError && <p className="text-sm text-[var(--danger)]">{editError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message="Changes saved" show={showSaved} onDone={() => setShowSaved(false)} />
    </div>
  );
}
