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
            Player sign in
          </Link>
          <Link href="/captain/login" className="btn border border-[var(--border)] text-[var(--accent)] hover:bg-white/5">
            Captain sign in
          </Link>
        </div>
      </section>

      <section className="card max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-[var(--text)]">For players</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-[var(--muted)]">
          <li>Your club imports player data from LeagueRepublic (Person export).</li>
          <li>Create an account with your <strong className="text-[var(--text)]">phone number</strong> — we&apos;ll verify it via WhatsApp OTP.</li>
          <li>Set your preferred positions and leagues, then turn <strong className="text-[var(--text)]">Listed</strong> on to appear in the market.</li>
          <li>Can&apos;t register with your number? Use the <Link href="/register/manual" className="text-[var(--accent)] hover:underline">manual verification</Link> form and an admin will sort it out.</li>
        </ul>
      </section>

      <section className="card max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-[var(--text)]">For captains</h2>
        <ul className="mt-3 list-inside list-disc space-y-1 text-[var(--muted)]">
          <li><Link href="/captain/register" className="text-[var(--accent)] hover:underline">Register as a captain</Link> with your email, phone number, and team name — we&apos;ll verify your phone via WhatsApp.</li>
          <li>An admin will review and approve your account — you&apos;ll be able to sign in once approved.</li>
          <li>Fill in your listing details (platform, leagues, positions, requirements) and toggle <strong className="text-[var(--text)]">Listed</strong> to appear on the market.</li>
          <li>Browse listed players, send trial requests, and contact them via WhatsApp.</li>
        </ul>
      </section>
    </div>
  );
}
