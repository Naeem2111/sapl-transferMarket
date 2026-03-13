"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Role = "player" | "captain" | "admin" | null;

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/captain/me").then((r) => r.json()),
      fetch("/api/admin/me").then((r) => r.json()),
    ]).then(([playerData, captainData, adminData]) => {
      if (!adminData.error) setRole("admin");
      else if (!playerData.error) setRole("player");
      else if (!captainData.error) setRole("captain");
      else setRole(null);
    });
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await fetch("/api/auth/captain/logout", { method: "POST" });
    await fetch("/api/auth/admin/logout", { method: "POST" });
    setRole(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="font-semibold text-[var(--accent)]">
          SAPL Transfer Market
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/market" className="text-[var(--muted)] hover:text-[var(--text)]">
            Market
          </Link>

          {role === "admin" && (
            <>
              <Link href="/admin" className="text-[var(--muted)] hover:text-[var(--text)]">
                Dashboard
              </Link>
              <Link href="/admin/users" className="text-[var(--muted)] hover:text-[var(--text)]">
                Users
              </Link>
              <Link href="/admin/import" className="text-[var(--muted)] hover:text-[var(--text)]">
                Import
              </Link>
            </>
          )}

          {role === "player" && (
            <Link href="/dashboard" className="text-[var(--muted)] hover:text-[var(--text)]">
              My profile
            </Link>
          )}

          {role === "captain" && (
            <Link href="/captain" className="text-[var(--muted)] hover:text-[var(--text)]">
              Captain
            </Link>
          )}

          {role ? (
            <button
              type="button"
              onClick={handleLogout}
              className="text-[var(--muted)] hover:text-[var(--text)]"
            >
              Log out
            </button>
          ) : (
            <>
              <Link href="/login" className="text-[var(--muted)] hover:text-[var(--text)]">
                Sign in
              </Link>
              <Link href="/captain/login" className="text-[var(--accent)] hover:underline">
                Captains
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
