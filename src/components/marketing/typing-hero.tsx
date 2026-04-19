"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "Track your shipments in real time",
  "Parse emails automatically",
  "Never miss a critical update",
  "AI that works while you sleep",
];

export function TypingHero() {
  const [ix, setIx] = useState(0);
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let cancelled = false;
    const phrase = PHRASES[ix];
    let char = 0;
    setDisplay("");
    const stepMs = 36;
    const t = setInterval(() => {
      if (cancelled) return;
      char += 1;
      setDisplay(phrase.slice(0, char));
      if (char >= phrase.length) {
        clearInterval(t);
        setTimeout(() => {
          if (!cancelled) setIx((i) => (i + 1) % PHRASES.length);
        }, 3000);
      }
    }, stepMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [ix]);

  return (
    <p className="min-h-[1.75rem] text-lg font-medium sm:min-h-[2rem] sm:text-xl">
      <span className="font-mono tabular-nums text-[#f1f5f9]">{display}</span>
      <span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-[#0ea5e9]" aria-hidden />
    </p>
  );
}
