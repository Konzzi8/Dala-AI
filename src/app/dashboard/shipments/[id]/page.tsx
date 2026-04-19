"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { internalApiUrl } from "@/lib/api-urls";
import { formatEtaDisplay, parseEtaDate } from "@/lib/format-date";
import type { Shipment } from "@/lib/types";

export default function ShipmentDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(internalApiUrl(`/api/shipments/${encodeURIComponent(id)}`), {
          credentials: "include",
        });
        const data = (await res.json()) as { shipment?: Shipment; error?: string };
        if (!res.ok) {
          setError(data.error || `Error ${res.status}`);
          setShipment(null);
          return;
        }
        if (!cancelled) setShipment(data.shipment ?? null);
      } catch {
        if (!cancelled) setError("Could not load shipment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-[var(--text-muted)]">
        Loading shipment…
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-red-600 dark:text-red-400">{error || "Not found"}</p>
        <Link href="/dashboard" className="mt-4 inline-block text-sky-600 hover:underline dark:text-sky-400">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const etaDate = shipment.eta ? parseEtaDate(shipment.eta) : null;
  const etaMs = etaDate?.getTime() ?? NaN;
  const countdown =
    Number.isFinite(etaMs) && etaMs > Date.now()
      ? Math.ceil((etaMs - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 text-[var(--text)]">
      <Link href="/dashboard" className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400">
        ← Dashboard
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">{shipment.reference}</h1>
      <p className="mt-2 text-lg text-[var(--text-muted)]">{shipment.clientName || "—"}</p>

      {countdown !== null && (
        <p className="mt-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200">
          ETA in <strong>{countdown}</strong> day{countdown === 1 ? "" : "s"} ({formatEtaDisplay(shipment.eta)})
        </p>
      )}

      <dl className="mt-10 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--card-muted)]/50 text-sm">
        {[
          ["Status / customs", shipment.customsStatus || "unknown"],
          ["Origin → Destination", `${shipment.origin || "—"} → ${shipment.destination || "—"}`],
          ["Containers", shipment.containerNumbers.join(", ") || "—"],
          ["B/L", shipment.blNumber || "—"],
          ["ETA", formatEtaDisplay(shipment.eta)],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-[var(--text-muted)]">{k}</dt>
            <dd className="text-right font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Linked emails</h2>
        <ul className="mt-4 space-y-3">
          {shipment.emails.length === 0 ? (
            <li className="text-sm text-[var(--text-muted)]">No emails linked.</li>
          ) : (
            shipment.emails.map((em) => (
              <li
                key={em.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm"
              >
                <p className="font-semibold">{em.subject}</p>
                <p className="text-[var(--text-muted)]">{em.from}</p>
                <p className="mt-2 line-clamp-4 text-[var(--text-muted)]">{em.bodySnippet}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
