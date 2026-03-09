import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--text)]">
          SAPL Transfer Market
        </h1>
        <p className="mt-3 text-lg text-[var(--muted)]">
          List yourself as available and find players for your Pro Clubs team.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/market" className="btn-primary">
            Browse market
          </Link>
          <Link href="/login" className="btn border border-[var(--border)] text-[var(--text)] hover:bg-white/5">
            Sign in to list yourself
          </Link>
        </div>
      </section>
      <section className="card max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-[var(--text)]">How it works</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-[var(--muted)]">
          <li>Your club imports player data from LeagueRepublic (Person export).</li>
          <li>Create an account with your <strong className="text-[var(--text)]">phone number</strong> (dialing code + number, same as in LeagueRepublic) and a password.</li>
          <li>Set your preferred positions and leagues, then turn <strong className="text-[var(--text)]">Listed</strong> on to appear in the market.</li>
          <li>Only players who have listed themselves appear in the market.</li>
        </ul>
        <p className="mt-4 text-sm text-[var(--muted)]">
          <a href="/admin/import" className="text-[var(--accent)] hover:underline">Admin: Import CSV</a>
        </p>
      </section>
    </div>
  );
}
