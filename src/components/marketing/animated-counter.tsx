"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

function easeOutQuart(t: number) {
  return 1 - (1 - t) ** 4;
}

export function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  durationMs = 2200,
}: {
  end: number;
  suffix?: string;
  prefix?: string;
  durationMs?: number;
}) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const p = Math.min((now - start) / durationMs, 1);
      setV(Math.round(end * easeOutQuart(p)));
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [inView, end, durationMs]);

  const formatted = v >= 1000 ? v.toLocaleString() : String(v);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
