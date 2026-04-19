"use client";

import type { Shipment } from "@/lib/types";
import { routeToMapPoints } from "@/lib/dashboard-utils";

type Props = { shipments: Shipment[] };

export function WorldMapPreview({ shipments }: Props) {
  const routes = shipments
    .map((s) => {
      const pts = routeToMapPoints(s.origin, s.destination);
      if (!pts) return null;
      const risk = s.risks.some((r) => r.level === "high")
        ? "high"
        : s.risks.some((r) => r.level === "medium")
          ? "medium"
          : "low";
      return { id: s.id, ref: s.reference, ...pts, risk };
    })
    .filter(Boolean) as Array<{
    id: string;
    ref: string;
    ox: number;
    oy: number;
    dx: number;
    dy: number;
    risk: "high" | "medium" | "low";
  }>;

  const stroke =
    (r: "high" | "medium" | "low") =>
      r === "high" ? "#dc2626" : r === "medium" ? "#d97706" : "#16a34a";

  return (
    <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#0f172a]">
      <svg viewBox="0 0 100 50" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <defs>
          <linearGradient id="wm-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <rect width="100" height="50" fill="url(#wm-bg)" />
        {/* Simplified continents (decorative) */}
        <path
          fill="#1e3a5f"
          fillOpacity="0.5"
          d="M8 28 Q12 22 22 24 Q28 26 30 32 Q24 38 14 36 Q8 34 8 28 M38 18 Q48 14 58 18 Q62 24 58 30 Q52 34 42 32 Q36 28 38 18 M72 24 Q82 20 90 28 Q88 36 78 38 Q70 36 72 24"
        />
        {routes.slice(0, 12).map((r) => (
          <g key={r.id}>
            <line
              x1={r.ox}
              y1={r.oy}
              x2={r.dx}
              y2={r.dy}
              stroke={stroke(r.risk)}
              strokeWidth="0.35"
              strokeOpacity="0.7"
            />
            <circle cx={r.ox} cy={r.oy} r="1.1" fill="#38bdf8" />
            <circle cx={r.dx} cy={r.dy} r="1.1" fill="#f97316" />
          </g>
        ))}
      </svg>
      <p className="pointer-events-none absolute bottom-2 left-3 text-[10px] font-medium text-[#94a3b8]">
        Origin · Destination · {routes.length} route{routes.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
