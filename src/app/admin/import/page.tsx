"use client";

import { useState } from "react";

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number; rows: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a CSV file");
      return;
    }
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.set("csv", file);
      const res = await fetch("/api/admin/import-csv", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import failed");
        return;
      }
      setResult({ created: data.created, updated: data.updated, rows: data.rows });
      setFile(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-[var(--text)]">Import LeagueRepublic CSV</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Upload a Person export CSV (e.g. PERSON_3377.csv). New players are created; existing Person IDs are updated.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--muted)]">CSV file</label>
          <input
            type="file"
            accept=".csv"
            className="input mt-1"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {result && (
          <p className="text-sm text-[var(--accent)]">
            Done: {result.rows} rows, {result.created} created, {result.updated} updated.
          </p>
        )}
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Importing…" : "Import"}
        </button>
      </form>
    </div>
  );
}
