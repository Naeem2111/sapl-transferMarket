"use client";

import Link from "next/link";
import { useEffect } from "react";

const NEW_SITE_URL =
  process.env.NEXT_PUBLIC_NEW_SAPL_URL || "https://sapl-platform.vercel.app";

export default function HomePage() {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.replace(NEW_SITE_URL);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-16 text-center">
      <section className="card max-w-xl space-y-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          SAPL has moved
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          We are redirecting you to the new SAPL platform.
        </h1>
        <p className="text-[var(--muted)]">
          The old transfer market is now archived while data migration is in
          progress. You will be sent to the new site in a moment.
        </p>
        <Link
          href={NEW_SITE_URL}
          className="btn-primary inline-flex"
          rel="noopener noreferrer"
        >
          Go to new site
        </Link>
      </section>
    </main>
  );
}
