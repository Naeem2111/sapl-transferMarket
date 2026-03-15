"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number; rows: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text)]">Import LeagueRepublic CSV</h1>
        <Link href="/admin" className="btn-ghost">Dashboard</Link>
      </div>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Upload a Person export CSV (e.g. PERSON_3377.csv). New players are created; existing Person IDs are updated.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* Styled file drop area */}
        <div
          onClick={() => fileRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center transition hover:border-[var(--accent)] hover:bg-[var(--accent)]/5"
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setError("");
              setResult(null);
            }}
          />
          {file ? (
            <>
              <p className="text-lg font-medium text-[var(--text)]">{file.name}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {(file.size / 1024).toFixed(1)} KB — click to change
              </p>
            </>
          ) : (
            <>
              <p className="text-lg text-[var(--muted)]">Click to select a CSV file</p>
              <p className="mt-1 text-sm text-[var(--muted)]">or drag and drop</p>
            </>
          )}
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

        {result && (
          <div className="card border-[var(--accent)]/30 bg-[var(--accent)]/5">
            <p className="text-sm text-[var(--text)]">
              Import complete: <strong>{result.rows}</strong> rows processed,{" "}
              <strong>{result.created}</strong> created, <strong>{result.updated}</strong> updated.
            </p>
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading || !file}>
          {loading ? "Importing…" : "Import CSV"}
        </button>
      </form>
    </div>
  );
}
