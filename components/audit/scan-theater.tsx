"use client";

import { useEffect, useRef, useState } from "react";

/* ---------- rotating loading quips (overlay layer only) ---------- */
const QUIPS = [
  "McKinsey and Tesla had a one-night stand. Nine months later, Hubbly was born.",
  "Your competitors are asleep. Hubbly doesn't sleep.",
  "Teaching robots to do your marketing so you can do literally anything else.",
  "Somewhere, an agency just felt a cold chill and doesn't know why.",
  "Reading your website faster than your last intern read the brief.",
  "Counting the money your competitors are taking from you. Sit down.",
  "We fired the sales team and kept the results.",
  "Doing in 90 seconds what a $12k/mo retainer does in 90 days.",
  "Finding buyers who are already on your site and too shy to say hi.",
  "Your funnel called. It wants to actually work now.",
  "Politely informing Google who's in charge here.",
  "This used to take five tools, three logins, and a good cry.",
  "Every rival on page one is about to have a very bad quarter.",
  "Warning: may cause your pipeline to become suspiciously full.",
];

// McKinsey line always first; the rest are shuffled once per mount.
function buildQuipOrder(): string[] {
  const [first, ...rest] = QUIPS;
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [first, ...rest];
}

/* ---------- data contract: push events as the scan produces them ---------- */
export type ScanEvent =
  | { type: "status"; text: string }
  | { type: "keyword"; label: string }
  | { type: "competitor"; label: string }
  | { type: "intent"; label: string }   // DO NOT EMIT until intent-topic mapping ships
  | { type: "risk"; monthlyUsd: number; label: "measured" | "estimated · category benchmarks" }
  | { type: "done" };

type Props = {
  domain: string;
  subscribe: (push: (e: ScanEvent) => void) => () => void;
  onDone?: () => void;
  className?: string;
};

const ORANGE = "#FF6B35", EMBER = "#FFB088", DEEP = "#C2410C", GRAY = "#8a8580";
const CATCOLOR: Record<string, string> = { domain: ORANGE, keyword: EMBER, competitor: GRAY, intent: DEEP };
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

type Node = { label: string; cat: string; size: number; p: { x: number; y: number; z: number }; a: number };

export default function ScanTheater({ domain, subscribe, onDone, className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const riskRef = useRef<HTMLDivElement>(null);
  const riskLabelRef = useRef<HTMLSpanElement>(null);

  // Rotating quips — a pure overlay; independent of the scan/data logic.
  const quipsRef = useRef<string[]>([]);
  if (quipsRef.current.length === 0) quipsRef.current = buildQuipOrder();
  const [quipIndex, setQuipIndex] = useState(0);
  const [quipVisible, setQuipVisible] = useState(true);
  const [scanDone, setScanDone] = useState(false);

  useEffect(() => {
    if (scanDone) return;
    let swap = 0;
    // Rhythm: hold ~5s fully visible, then a 700ms fade that matches the CSS
    // transition so the text is invisible before it swaps (no flashing).
    const HOLD = 5200;
    const FADE = 700;
    const cycle = window.setInterval(() => {
      setQuipVisible(false); // fade out
      swap = window.setTimeout(() => {
        setQuipIndex((i) => (i + 1) % quipsRef.current.length);
        setQuipVisible(true); // fade in next once fully hidden
      }, FADE);
    }, HOLD + FADE);
    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(swap);
    };
  }, [scanDone]);

  useEffect(() => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0, H = 0, cx = 0, cy = 0, R = 0, angle = 0, raf = 0, alive = true;
    const tilt = -0.3;

    const nodes: Node[] = [{ label: domain, cat: "domain", size: 1.7, p: { x: 0, y: 0.1, z: 1 }, a: 0 }];
    const edges: Array<{ a: number; b: number; w: number; al: number }> = [];
    let placed = 1;

    function place() {
      const i = placed++;
      const t = (i % 16) / 16;
      const y = 1 - t * 1.9;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = i * GOLDEN;
      return { x: Math.cos(th) * r, y, z: Math.sin(th) * r };
    }

    function addNode(label: string, cat: string, size = 1) {
      const idx = nodes.length;
      nodes.push({ label, cat, size, p: place(), a: 0 });
      if (cat === "keyword") edges.push({ a: 0, b: idx, w: 2, al: 0 });
      else {
        const kws = nodes.map((n, i) => ({ n, i })).filter((x) => x.n.cat === "keyword");
        if (kws.length) edges.push({ a: kws[Math.floor(Math.random() * kws.length)].i, b: idx, w: 1, al: 0 });
        else edges.push({ a: 0, b: idx, w: 1, al: 0 });
      }
      requestAnimationFrame(() => { nodes[idx].a = 0.001; });
    }

    function resize() {
      const DPR = Math.min(2, devicePixelRatio || 1);
      const rect = cvs.parentElement!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      cvs.width = W * DPR; cvs.height = H * DPR;
      cvs.style.width = W + "px"; cvs.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W / 2; cy = H * 0.5; R = Math.max(120, Math.min(W, H) * 0.36);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cvs.parentElement!);

    function rot(p: { x: number; y: number; z: number }) {
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const x = p.x * ca + p.z * sa, z0 = -p.x * sa + p.z * ca, y = p.y;
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      return { x, y: y * ct - z0 * st, z: y * st + z0 * ct };
    }
    const hx = (h: string, a: number) => {
      const n = parseInt(h.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    };

    function draw() {
      if (!alive) return;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;
      for (let L = 0; L < 12; L++) {
        const th = (L / 12) * Math.PI * 2;
        ctx.beginPath();
        for (let s = 0; s <= 36; s++) {
          const ph = -Math.PI / 2 + (s / 36) * Math.PI;
          const q = rot({ x: Math.cos(ph) * Math.cos(th), y: Math.sin(ph), z: Math.cos(ph) * Math.sin(th) });
          const X = cx + q.x * R, Y = cy - q.y * R;
          s ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
        }
        ctx.strokeStyle = "rgba(255,255,255,.055)"; ctx.stroke();
      }
      for (let La = 1; La < 6; La++) {
        const ph = -Math.PI / 2 + (La / 6) * Math.PI;
        ctx.beginPath();
        for (let s = 0; s <= 48; s++) {
          const th = (s / 48) * Math.PI * 2;
          const q = rot({ x: Math.cos(ph) * Math.cos(th), y: Math.sin(ph), z: Math.cos(ph) * Math.sin(th) });
          const X = cx + q.x * R, Y = cy - q.y * R;
          s ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
        }
        ctx.strokeStyle = "rgba(255,255,255,.055)"; ctx.stroke();
      }

      const proj = nodes.map((n) => {
        if (n.a > 0 && n.a < 1) n.a = Math.min(1, n.a + 0.03);
        const q = rot(n.p);
        const d = (q.z + 1) / 2;
        return { n, sx: cx + q.x * R, sy: cy - q.y * R, d, sr: (4 + n.size * 7) * (0.55 + 0.45 * d) };
      });

      edges.forEach((e) => {
        const A = proj[e.a], B = proj[e.b];
        if (!A || !B) return;
        const vis = Math.min(A.n.a, B.n.a);
        if (vis <= 0) return;
        if (e.al < vis) e.al = Math.min(vis, e.al + 0.02);
        const d = (A.d + B.d) / 2;
        const domainEdge = e.a === 0 || e.b === 0;
        const al = (0.05 + 0.15 * d) * e.al;
        ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy);
        ctx.strokeStyle = domainEdge ? `rgba(255,138,92,${al * 1.4})` : `rgba(255,255,255,${al})`;
        ctx.lineWidth = (0.6 + e.w * 0.5) * (0.6 + 0.4 * d);
        ctx.stroke();
      });

      proj.sort((a, b) => a.d - b.d).forEach(({ n, sx, sy, d, sr }) => {
        if (n.a <= 0) return;
        const c = CATCOLOR[n.cat] || GRAY;
        const dim = (0.35 + 0.65 * d) * n.a;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3.2);
        g.addColorStop(0, hx(c, 0.28 * dim)); g.addColorStop(1, hx(c, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, sr * 3.2, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(sx, sy, sr * (0.6 + 0.4 * n.a), 0, 7);
        ctx.fillStyle = hx(c, dim); ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = hx("#ffffff", 0.3 * dim); ctx.stroke();
        if (n.cat === "domain" && n.a > 0.6) {
          ctx.font = '600 14px system-ui, sans-serif';
          ctx.fillStyle = `rgba(245,245,244,${dim})`;
          ctx.textAlign = "center";
          ctx.fillText(n.label, sx, sy - sr - 10);
        }
      });

      if (!reduce) angle += 0.0016;
      raf = requestAnimationFrame(draw);
    }
    nodes[0].a = 0.001;
    raf = requestAnimationFrame(draw);

    let risk = 0;
    const unsub = subscribe((e: ScanEvent) => {
      if (!alive) return;
      switch (e.type) {
        case "status":
          if (statusRef.current) statusRef.current.textContent = e.text;
          break;
        case "keyword": addNode(e.label, "keyword", 1.1); break;
        case "competitor": addNode(e.label, "competitor", 1.05); break;
        case "intent": addNode(e.label, "intent", 0.9); break;
        case "risk": {
          const from = risk, to = e.monthlyUsd, t0 = performance.now();
          risk = to;
          if (riskLabelRef.current) riskLabelRef.current.textContent = e.label;
          const step = (now: number) => {
            const k = Math.min(1, (now - t0) / 1500), ez = 1 - Math.pow(1 - k, 3);
            if (riskRef.current)
              riskRef.current.textContent = "$" + Math.round(from + (to - from) * ez).toLocaleString() + "/mo";
            if (k < 1 && alive) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          break;
        }
        case "done":
          if (statusRef.current) statusRef.current.textContent = "Scan complete · building your report";
          setScanDone(true);
          onDone?.();
          break;
      }
    });

    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); unsub(); };
  }, [domain, subscribe, onDone]);

  return (
    <div className={`relative h-[560px] w-full overflow-hidden rounded-2xl bg-[#0a0a0a] ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
      {!scanDone && (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center px-8">
          <p
            aria-hidden="true"
            className="max-w-xl text-balance text-center transition-opacity duration-700 ease-in-out"
            style={{
              fontWeight: 600,
              fontSize: "20px",
              lineHeight: 1.4,
              color: "#f5f5f5",
              opacity: quipVisible ? 1 : 0,
            }}
          >
            {quipsRef.current[quipIndex]}
          </p>
        </div>
      )}
      <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-white/[.045] px-5 py-2.5 backdrop-blur-xl">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#FF6B35] shadow-[0_0_12px_#FF6B35]" />
        <div ref={statusRef} className="font-mono text-[13px] text-neutral-100">
          Scanning {domain}…
        </div>
      </div>
      <div className="absolute bottom-6 left-6 rounded-2xl border border-white/10 bg-white/[.045] px-5 py-4 backdrop-blur-xl">
        <div className="font-mono text-[10px] uppercase tracking-[.15em] text-neutral-500">Revenue at risk</div>
        <div ref={riskRef} className="mt-1.5 text-3xl font-semibold tabular-nums tracking-tight text-neutral-100">
          $0/mo
        </div>
        <span ref={riskLabelRef} className="mt-1 inline-block rounded-md border border-white/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-neutral-500" />
      </div>
    </div>
  );
}
