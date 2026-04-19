"use client";

/** Slow-moving cargo silhouette across the hero. */
export function FloatingShip() {
  return (
    <div
      className="marketing-ship pointer-events-none absolute bottom-[12%] left-0 z-[1] opacity-[0.18] sm:bottom-[15%] sm:opacity-[0.24]"
      aria-hidden
    >
      <svg
        width="180"
        height="72"
        viewBox="0 0 180 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_2px_16px_rgba(37,99,235,0.2)]"
      >
        <path
          d="M4 48h172l-8-8H20L4 48zm12-8l6-20h120l10 20H16zm24-20l-4-12h88l-6 12H40zm20-12l-2-8h52l-4 8H60z"
          fill="url(#shipGrad)"
          stroke="#2563eb"
          strokeWidth="0.75"
          strokeOpacity="0.35"
        />
        <defs>
          <linearGradient id="shipGrad" x1="4" y1="20" x2="176" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563eb" stopOpacity="0.28" />
            <stop offset="1" stopColor="#0ea5e9" stopOpacity="0.15" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
