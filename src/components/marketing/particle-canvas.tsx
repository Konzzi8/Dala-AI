"use client";

import { useEffect, useRef } from "react";

/** Global shipping network: clustered “hubs” with animated edges (canvas). */
export function ParticleCanvas({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const el = canvas;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const g = ctx;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const box = (el.parentElement ?? el) as HTMLElement;
      const { clientWidth, clientHeight } = box;
      el.width = clientWidth * dpr;
      el.height = clientHeight * dpr;
      el.style.width = `${clientWidth}px`;
      el.style.height = `${clientHeight}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const clusters: { cx: number; cy: number; n: number }[] = [
      { cx: 0.14, cy: 0.38, n: 14 },
      { cx: 0.22, cy: 0.52, n: 10 },
      { cx: 0.48, cy: 0.32, n: 16 },
      { cx: 0.52, cy: 0.48, n: 12 },
      { cx: 0.72, cy: 0.4, n: 14 },
      { cx: 0.82, cy: 0.5, n: 10 },
      { cx: 0.38, cy: 0.62, n: 8 },
    ];

    const nodes: { x: number; y: number }[] = [];
    let seed = 42;
    function rand() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    }
    for (const c of clusters) {
      for (let i = 0; i < c.n; i++) {
        const a = rand() * Math.PI * 2;
        const r = 0.02 + rand() * 0.06;
        nodes.push({
          x: c.cx + Math.cos(a) * r * (0.5 + rand()),
          y: c.cy + Math.sin(a) * r * (0.5 + rand()),
        });
      }
    }

    type Edge = { a: number; b: number };
    const edges: Edge[] = [];
    const maxD = 0.14;
    for (let i = 0; i < nodes.length; i++) {
      const dists: { j: number; d: number }[] = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d = Math.hypot(dx, dy);
        if (d < maxD) dists.push({ j, d });
      }
      dists.sort((x, y) => x.d - y.d);
      for (let k = 0; k < Math.min(4, dists.length); k++) {
        const j = dists[k].j;
        if (!edges.some((e) => (e.a === i && e.b === j) || (e.a === j && e.b === i))) {
          edges.push({ a: i, b: j });
        }
      }
    }

    let t = 0;
    function draw() {
      const w = el.clientWidth;
      const h = el.clientHeight;
      g.clearRect(0, 0, w, h);

      const blue = "#2563eb";
      const cyan = "#0ea5e9";

      for (const e of edges) {
        const p0 = nodes[e.a];
        const p1 = nodes[e.b];
        const x0 = p0.x * w;
        const y0 = p0.y * h;
        const x1 = p1.x * w;
        const y1 = p1.y * h;
        const pulse = 0.12 + 0.12 * Math.sin(t * 0.002 + e.a * 0.1);
        g.strokeStyle = `rgba(37, 99, 235, ${pulse * 0.32})`;
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x0, y0);
        g.lineTo(x1, y1);
        g.stroke();

        const mid = Math.sin(t * 0.001 + e.b * 0.05) * 0.5 + 0.5;
        const px = x0 + (x1 - x0) * mid;
        const py = y0 + (y1 - y0) * mid;
        g.fillStyle = cyan;
        g.globalAlpha = 0.4 + 0.4 * Math.sin(t * 0.003 + e.a);
        g.beginPath();
        g.arc(px, py, 2, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const x = n.x * w;
        const y = n.y * h;
        const glow = 0.3 + 0.2 * Math.sin(t * 0.002 + i * 0.2);
        g.fillStyle = blue;
        g.globalAlpha = glow;
        g.beginPath();
        g.arc(x, y, 3, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 0.9;
        g.fillStyle = "#ffffff";
        g.beginPath();
        g.arc(x, y, 1.2, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }

      t += reduced ? 0 : 1;
      raf.current = requestAnimationFrame(draw);
    }

    resize();
    const ro = new ResizeObserver(resize);
    if (el.parentElement) ro.observe(el.parentElement);
    draw();

    return () => {
      cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} aria-hidden />;
}
