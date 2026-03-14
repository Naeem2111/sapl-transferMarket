"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";

type CaptainRow = {
  id: string;
  email: string;
  teamName: string | null;
  approvalStatus: string;
  listed: boolean;
  createdAt: string;
};

type PlayerRegRow = {
  id: string;
  firstName: string;
  lastName: string;
  dialingCode: string;
  phoneNumber: string;
  email: string | null;
  personId: string | null;
  teamName: string | null;
  notes: string | null;
  status: string;
  adminNotes: string | null;
  linkedPlayerId: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

type PendingConfirm = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
} | null;

type AdminRow = {
  id: string;
  email: string;
  createdAt: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [captains, setCaptains] = useState<CaptainRow[]>([]);
  const [playerRegs, setPlayerRegs] = useState<PlayerRegRow[]>([]);
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  // Link modal state
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkPersonId, setLinkPersonId] = useState("");
  const [linkNotes, setLinkNotes] = useState("");
  const [linkError, setLinkError] = useState("");

  // Confirm modal state
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  useEffect(() => {
    fetch("/api/admin/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) router.replace("/admin/login");
      });
  }, [router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/captains", { credentials: "include" })
        .then((r) => r.json())
        .catch(() => []),
      fetch("/api/admin/pending-players", { credentials: "include" })
        .then((r) => r.ok ? r.json() : [])
        .catch(() => []),
      fetch("/api/admin/admins", { credentials: "include" })
        .then((r) => r.ok ? r.json() : [])
        .catch(() => []),
    ])
      .then(([captainData, playerRegData, adminData]) => {
        if (Array.isArray(captainData)) setCaptains(captainData);
        if (Array.isArray(playerRegData)) setPlayerRegs(playerRegData);
        if (Array.isArray(adminData)) setAdmins(adminData);
      })
      .finally(() => setLoading(false));
  }, []);

  // Captain actions
  async function handleCaptainAction(captainId: string, action: "approve" | "reject") {
    setActionId(captainId);
    try {
      const res = await fetch("/api/admin/captains", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ captainId, action }),
      });
      if (res.ok) {
        setCaptains((prev) =>
          prev.map((c) =>
            c.id === captainId
              ? { ...c, approvalStatus: action === "approve" ? "approved" : "rejected" }
              : c
          )
        );
      }
    } finally {
      setActionId(null);
    }
  }

  // Player registration actions
  async function handlePlayerRegAction(
    registrationId: string,
    action: "approve" | "reject",
    adminNotes?: string,
    linkedPersonId?: string
  ) {
    setActionId(registrationId);
    setLinkError("");
    try {
      const res = await fetch("/api/admin/pending-players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ registrationId, action, adminNotes, linkedPersonId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLinkError(data.error || "Action failed");
        return;
      }
      setPlayerRegs((prev) =>
        prev.map((r) =>
          r.id === registrationId ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r
        )
      );
      setLinkingId(null);
      setLinkPersonId("");
      setLinkNotes("");
    } finally {
      setActionId(null);
    }
  }

  const pendingCaptains = captains.filter((c) => c.approvalStatus === "pending");
  const approvedCaptains = captains.filter((c) => c.approvalStatus === "approved");
  const rejectedCaptains = captains.filter((c) => c.approvalStatus === "rejected");

  const pendingPlayerRegs = playerRegs.filter((r) => r.status === "pending");
  const resolvedPlayerRegs = playerRegs.filter((r) => r.status !== "pending");

  function StatusBadge({ status }: { status: string }) {
    const colours: Record<string, string> = {
      pending: "bg-yellow-500/15 text-yellow-400",
      approved: "bg-green-500/15 text-green-400",
      rejected: "bg-red-500/15 text-red-400",
    };
    return (
      <span className={`rounded px-2 py-0.5 text-xs font-medium ${colours[status] ?? ""}`}>
        {status}
      </span>
    );
  }

  function CaptainTable({ rows }: { rows: CaptainRow[] }) {
    if (rows.length === 0) return <p className="text-sm text-[var(--muted)]">None.</p>;
    return (
      <ul className="space-y-3">
        {rows.map((c) => (
          <li key={c.id} className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-[var(--text)]">{c.teamName || "(no team name)"}</p>
              <p className="text-sm text-[var(--muted)]">{c.email}</p>
              <p className="text-xs text-[var(--muted)]">
                Registered {new Date(c.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={c.approvalStatus} />
              {c.approvalStatus === "pending" && (
                <>
                  <button
                    type="button"
                    disabled={actionId === c.id}
                    onClick={() => handleCaptainAction(c.id, "approve")}
                    className="rounded bg-green-600/20 px-3 py-1.5 text-sm text-green-400 hover:bg-green-600/30"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actionId === c.id}
                    onClick={() => setPendingConfirm({
                      title: "Reject captain",
                      message: `Reject ${c.teamName || c.email}? They won't be able to sign in.`,
                      confirmLabel: "Reject",
                      onConfirm: () => { handleCaptainAction(c.id, "reject"); setPendingConfirm(null); },
                    })}
                    className="rounded bg-red-600/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-600/30"
                  >
                    Reject
                  </button>
                </>
              )}
              {c.approvalStatus === "approved" && (
                <button
                  type="button"
                  disabled={actionId === c.id}
                  onClick={() => setPendingConfirm({
                    title: "Revoke approval",
                    message: `Revoke ${c.teamName || c.email}'s approval? They'll be blocked from signing in.`,
                    confirmLabel: "Revoke",
                    onConfirm: () => { handleCaptainAction(c.id, "reject"); setPendingConfirm(null); },
                  })}
                  className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5"
                >
                  Revoke
                </button>
              )}
              {c.approvalStatus === "rejected" && (
                <button
                  type="button"
                  disabled={actionId === c.id}
                  onClick={() => handleCaptainAction(c.id, "approve")}
                  className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5"
                >
                  Re-approve
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--text)]">Admin dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/users" className="btn-ghost">Users</Link>
          <Link href="/market" className="btn-ghost">Market</Link>
          <button
            type="button"
            className="btn-ghost"
            onClick={async () => {
              await fetch("/api/auth/admin/logout", { method: "POST" });
              router.push("/");
              router.refresh();
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-[var(--muted)]">Loading…</p>
      ) : (
        <>
          {/* ── Pending player registrations ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">
              Player verification requests{" "}
              {pendingPlayerRegs.length > 0 && (
                <span className="ml-1 rounded bg-yellow-500/20 px-2 py-0.5 text-sm text-yellow-400">
                  {pendingPlayerRegs.length}
                </span>
              )}
            </h2>
            {pendingPlayerRegs.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">None.</p>
            ) : (
              <ul className="space-y-3">
                {pendingPlayerRegs.map((r) => (
                  <li key={r.id} className="card space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--text)]">
                          {r.firstName} {r.lastName}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          +{r.dialingCode} {r.phoneNumber}
                        </p>
                        {r.email && (
                          <p className="text-sm text-[var(--muted)]">{r.email}</p>
                        )}
                        {r.teamName && (
                          <p className="text-sm text-[var(--muted)]">Team: {r.teamName}</p>
                        )}
                        {r.personId && (
                          <p className="text-sm font-mono text-[var(--accent)]">
                            Person ID: {r.personId}
                          </p>
                        )}
                        {r.notes && (
                          <p className="mt-1 text-sm italic text-[var(--muted)]">
                            &ldquo;{r.notes}&rdquo;
                          </p>
                        )}
                        <p className="text-xs text-[var(--muted)]">
                          Submitted {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>

                    {/* Link & approve inline form */}
                    {linkingId === r.id ? (
                      <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
                        <p className="text-sm font-medium text-[var(--text)]">
                          Link to LeagueRepublic player
                        </p>
                        <input
                          type="text"
                          className="input"
                          value={linkPersonId}
                          onChange={(e) => setLinkPersonId(e.target.value)}
                          placeholder="Person ID (e.g. PERSON_3377)"
                        />
                        <input
                          type="text"
                          className="input"
                          value={linkNotes}
                          onChange={(e) => setLinkNotes(e.target.value)}
                          placeholder="Admin notes (optional)"
                        />
                        {linkError && (
                          <p className="text-sm text-[var(--danger)]">{linkError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={actionId === r.id}
                            onClick={() =>
                              handlePlayerRegAction(
                                r.id,
                                "approve",
                                linkNotes || undefined,
                                linkPersonId || undefined
                              )
                            }
                            className="rounded bg-green-600/20 px-3 py-1.5 text-sm text-green-400 hover:bg-green-600/30"
                          >
                            {linkPersonId ? "Link & approve" : "Approve without linking"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLinkingId(null);
                              setLinkPersonId("");
                              setLinkNotes("");
                              setLinkError("");
                            }}
                            className="rounded border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-white/5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={actionId === r.id}
                          onClick={() => {
                            setLinkingId(r.id);
                            setLinkPersonId(r.personId || "");
                            setLinkNotes("");
                            setLinkError("");
                          }}
                          className="rounded bg-green-600/20 px-3 py-1.5 text-sm text-green-400 hover:bg-green-600/30"
                        >
                          Approve / Link
                        </button>
                        <button
                          type="button"
                          disabled={actionId === r.id}
                          onClick={() => setPendingConfirm({
                            title: "Reject registration",
                            message: `Reject ${r.firstName} ${r.lastName}'s registration request?`,
                            confirmLabel: "Reject",
                            onConfirm: () => { handlePlayerRegAction(r.id, "reject"); setPendingConfirm(null); },
                          })}
                          className="rounded bg-red-600/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-600/30"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Resolved registrations (collapsed) */}
            {resolvedPlayerRegs.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-[var(--muted)] hover:text-[var(--text)]">
                  Show resolved ({resolvedPlayerRegs.length})
                </summary>
                <ul className="mt-2 space-y-2">
                  {resolvedPlayerRegs.map((r) => (
                    <li
                      key={r.id}
                      className="card flex flex-wrap items-center justify-between gap-3 opacity-60"
                    >
                      <div>
                        <p className="text-sm text-[var(--text)]">
                          {r.firstName} {r.lastName} — +{r.dialingCode} {r.phoneNumber}
                        </p>
                        {r.adminNotes && (
                          <p className="text-xs text-[var(--muted)]">Note: {r.adminNotes}</p>
                        )}
                      </div>
                      <StatusBadge status={r.status} />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {/* ── Captain sections ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">
              Captain pending approval{" "}
              {pendingCaptains.length > 0 && (
                <span className="ml-1 rounded bg-yellow-500/20 px-2 py-0.5 text-sm text-yellow-400">
                  {pendingCaptains.length}
                </span>
              )}
            </h2>
            <CaptainTable rows={pendingCaptains} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Approved captains</h2>
            <CaptainTable rows={approvedCaptains} />
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Rejected captains</h2>
            <CaptainTable rows={rejectedCaptains} />
          </section>
          {/* ── Admin accounts ── */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--text)]">Admin accounts</h2>
            {admins.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">None.</p>
            ) : (
              <ul className="space-y-2">
                {admins.map((a) => (
                  <li key={a.id} className="card flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">{a.email}</p>
                      <p className="text-xs text-[var(--muted)]">
                        Added {new Date(a.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-[var(--muted)]">
              To add or remove admins, use the terminal script.
            </p>
          </section>
        </>
      )}

      <ConfirmModal
        open={!!pendingConfirm}
        title={pendingConfirm?.title ?? ""}
        message={pendingConfirm?.message ?? ""}
        confirmLabel={pendingConfirm?.confirmLabel ?? "Confirm"}
        danger
        onConfirm={() => pendingConfirm?.onConfirm()}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
}
