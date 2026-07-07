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

/* ---------- data contract: push events as the scan produces them ----------
 * Only the loading screen consumes this. Every DATA element (keywords,
 * competitors, revenue) is the visitor's genuine scan output; the timing/
 * staging below is presentation only. `intent` is defined for back-compat but
 * MUST NOT be emitted until the intent-topic mapping ships. */
export type ScanEvent =
  | { type: "status"; text: string }
  | { type: "keyword"; label: string }
  | { type: "competitor"; label: string }
  | { type: "intent"; label: string } // DO NOT EMIT
  | { type: "progress"; value: number } // real 0..1 scan progress — rail + intensity floor
  | { type: "crescendo"; revealInMs: number } // begin the final build so intensity crests at the reveal
  | { type: "reveal"; monthlyUsd: number | null; label: string; topKeyword: string | null }
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

  // Rotating quips — a pure overlay; independent of the scan/data logic.
  const quipsRef = useRef<string[]>([]);
  if (quipsRef.current.length === 0) quipsRef.current = buildQuipOrder();
  const [quipIndex, setQuipIndex] = useState(0);
  const [quipVisible, setQuipVisible] = useState(true);

  // Beat state driven by scan events (presentation only).
  const [railPct, setRailPct] = useState(0);
  const [kwCount, setKwCount] = useState(0);
  const [compCount, setCompCount] = useState(0);
  const [revealData, setRevealData] = useState<
    { usd: number | null; label: string; topKeyword: string | null } | null
  >(null);
  const [countUp, setCountUp] = useState(0);
  const revealed = revealData !== null;

  // Quip rotation — holds ~5s, 700ms fade matched to the CSS transition so the
  // text is fully hidden before it swaps (no flashing). Stops at the reveal.
  useEffect(() => {
    if (revealed) return;
    let swap = 0;
    const HOLD = 5200;
    const FADE = 700;
    const cycle = window.setInterval(() => {
      setQuipVisible(false);
      swap = window.setTimeout(() => {
        setQuipIndex((i) => (i + 1) % quipsRef.current.length);
        setQuipVisible(true);
      }, FADE);
    }, HOLD + FADE);
    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(swap);
    };
  }, [revealed]);

  // Count the revenue number up in the stillness after the surge.
  useEffect(() => {
    if (!revealData || revealData.usd == null) return;
    const target = revealData.usd;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setCountUp(target);
      return;
    }
    const t0 = performance.now();
    const DUR = 1600;
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / DUR);
      const ez = 1 - Math.pow(1 - k, 3);
      setCountUp(Math.round(target * ez));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [revealData]);

  useEffect(() => {
    const cvs = canvasRef.current!;
    const ctx = cvs.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mo = reduce ? 0 : 1; // motion multiplier — 0 disables ramp/growth/spin/surge

    let W = 0, H = 0, cx = 0, cy = 0, R = 0, angle = 0, raf = 0, alive = true;
    const tilt = -0.3;

    // Camera settle (Beat 1): ease zoom in over ~1.4s so the globe "focuses".
    const introStart = performance.now();
    const INTRO_MS = reduce ? 0 : 1400;

    // Intensity 0..1 drives the whole crescendo: globe growth, activity rate,
    // glow, spin. Eases toward a target set by progress/nodes, then a timed
    // crescendo ramp carries it to 1 exactly at the reveal.
    let intensity = 0.03, intensityTarget = 0.05;
    let crescStart = 0, crescDur = 1, crescFrom = 0;
    let revealAt = 0;

    // Drama layers: expanding ping rings + short-lived labels on each discovery.
    const rings: Array<{ p: { x: number; y: number; z: number }; t: number; cat: string }> = [];
    const labels: Array<{ p: { x: number; y: number; z: number }; t: number; text: string; kind: string }> = [];

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
      // Each discovery nudges intensity up (capped below full until reveal).
      intensityTarget = Math.min(0.88, intensityTarget + 0.03);
      rings.push({ p: nodes[idx].p, t: 0, cat });
      // Beat 2 flick-in label: keyword shows its term, competitor a cold "vs".
      labels.push({ p: nodes[idx].p, t: 0, text: cat === "competitor" ? "vs" : label, kind: cat });
    }

    function resize() {
      const DPR = Math.min(2, devicePixelRatio || 1);
      const rect = cvs.parentElement!.getBoundingClientRect();
      W = rect.width; H = rect.height;
      cvs.width = W * DPR; cvs.height = H * DPR;
      cvs.style.width = W + "px"; cvs.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      cx = W / 2; cy = H * 0.5; R = Math.max(110, Math.min(W, H) * 0.32);
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
      const now = performance.now();
      const introE = reduce ? 1 : (() => { const k = Math.min(1, (now - introStart) / INTRO_MS); return 1 - Math.pow(1 - k, 3); })();

      // Crescendo: timed ramp toward full intensity, cresting at revealInMs.
      let target = intensityTarget;
      if (crescStart) {
        const k = Math.min(1, (now - crescStart) / crescDur);
        const ez = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        target = Math.max(intensityTarget, crescFrom + (1 - crescFrom) * ez);
      }
      intensity += (target - intensity) * 0.03;

      // Reveal timing: surge flash, then dim the scene as the hero number lands.
      const surge = revealAt ? Math.max(0, 1 - (now - revealAt) / 700) * mo : 0;
      const revealDim = revealAt ? Math.min(1, (now - revealAt) / 500) : 0;
      const sceneDim = 1 - 0.4 * revealDim;

      // Globe grows with intensity (Beat: build); capped to stay in frame.
      const Reff = R * (0.6 + 0.4 * introE) * (1 + 0.2 * intensity * mo);
      const Rd = Math.min(Reff, Math.min(W, H) * 0.46);

      ctx.clearRect(0, 0, W, H);

      // Warm energy field that powers up with intensity and flares on reveal.
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rd * 1.9);
      glow.addColorStop(0, hx(ORANGE, (0.03 + 0.11 * intensity + 0.2 * surge) * (0.6 + 0.4 * introE)));
      glow.addColorStop(1, hx(ORANGE, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Wireframe fills in as intensity rises — full sphere by the reveal.
      const wire = Math.min(1, 0.15 + intensity * 1.25);
      const wireReveal = (offset: number) => Math.max(0, Math.min(1, (wire - offset * 0.5) * 2.5));
      ctx.lineWidth = 1;
      for (let L = 0; L < 12; L++) {
        const rv = wireReveal(L / 12);
        if (rv <= 0) continue;
        const th = (L / 12) * Math.PI * 2;
        ctx.beginPath();
        for (let s = 0; s <= 36; s++) {
          const ph = -Math.PI / 2 + (s / 36) * Math.PI;
          const q = rot({ x: Math.cos(ph) * Math.cos(th), y: Math.sin(ph), z: Math.cos(ph) * Math.sin(th) });
          const X = cx + q.x * Rd, Y = cy - q.y * Rd;
          s ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.06 * rv * sceneDim})`; ctx.stroke();
      }
      for (let La = 1; La < 6; La++) {
        const rv = wireReveal(La / 6);
        if (rv <= 0) continue;
        const ph = -Math.PI / 2 + (La / 6) * Math.PI;
        ctx.beginPath();
        for (let s = 0; s <= 48; s++) {
          const th = (s / 48) * Math.PI * 2;
          const q = rot({ x: Math.cos(ph) * Math.cos(th), y: Math.sin(ph), z: Math.cos(ph) * Math.sin(th) });
          const X = cx + q.x * Rd, Y = cy - q.y * Rd;
          s ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
        }
        ctx.strokeStyle = `rgba(255,255,255,${0.06 * rv * sceneDim})`; ctx.stroke();
      }

      const proj = nodes.map((n) => {
        if (n.a > 0 && n.a < 1) n.a = Math.min(1, n.a + 0.012);
        const q = rot(n.p);
        const d = (q.z + 1) / 2;
        return { n, sx: cx + q.x * Rd, sy: cy - q.y * Rd, d, sr: (4 + n.size * 7) * (0.55 + 0.45 * d) };
      });

      // Edges + accelerating data pulses (more/faster/brighter as intensity climbs).
      edges.forEach((e) => {
        const A = proj[e.a], B = proj[e.b];
        if (!A || !B) return;
        const vis = Math.min(A.n.a, B.n.a);
        if (vis <= 0) return;
        if (e.al < vis) e.al = Math.min(vis, e.al + 0.008);
        const d = (A.d + B.d) / 2;
        const domainEdge = e.a === 0 || e.b === 0;
        const al = (0.05 + 0.15 * d) * e.al * (1 + 1.6 * surge) * sceneDim;
        ctx.beginPath(); ctx.moveTo(A.sx, A.sy); ctx.lineTo(B.sx, B.sy);
        ctx.strokeStyle = domainEdge ? `rgba(255,138,92,${al * 1.4})` : `rgba(255,255,255,${al})`;
        ctx.lineWidth = (0.6 + e.w * 0.5) * (0.6 + 0.4 * d);
        ctx.stroke();

        if (e.al > 0.12) {
          const dots = 1 + Math.floor(3 * intensity * mo) + (surge > 0 ? 2 : 0);
          const speed = 0.00025 * (0.6 + 2.2 * intensity * mo);
          const pc = CATCOLOR[B.n.cat] || EMBER;
          for (let k = 0; k < dots; k++) {
            const u = ((now * speed) + k / dots + (e.a * 0.13 + e.b * 0.07)) % 1;
            const px = B.sx + (A.sx - B.sx) * u;
            const py = B.sy + (A.sy - B.sy) * u;
            const fade = Math.sin(u * Math.PI);
            ctx.beginPath(); ctx.arc(px, py, 1.5 + 1.3 * d, 0, 7);
            ctx.fillStyle = hx(pc, Math.min(0.9, e.al) * fade * (0.45 + 0.55 * d) * (0.6 + 0.4 * intensity + surge) * sceneDim);
            ctx.fill();
          }
        }
      });

      // Nodes — competitors flare briefly at the reveal (who's taking page one).
      proj.sort((a, b) => a.d - b.d).forEach(({ n, sx, sy, d, sr }) => {
        if (n.a <= 0) return;
        const c = CATCOLOR[n.cat] || GRAY;
        let dim = (0.35 + 0.65 * d) * n.a * sceneDim;
        if (n.cat === "competitor" && revealAt) dim += Math.max(0, 1 - (now - revealAt) / 1200) * 0.8;
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 3.2);
        g.addColorStop(0, hx(c, 0.28 * dim)); g.addColorStop(1, hx(c, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, sr * 3.2, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(sx, sy, sr * (0.6 + 0.4 * n.a), 0, 7);
        ctx.fillStyle = hx(c, dim); ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = hx("#ffffff", 0.3 * dim); ctx.stroke();
        if (n.cat === "domain" && n.a > 0.6) {
          ctx.font = "600 14px system-ui, sans-serif";
          ctx.fillStyle = `rgba(245,245,244,${dim})`;
          ctx.textAlign = "center";
          ctx.fillText(n.label, sx, sy - sr - 10);
        }
      });

      // Discovery ping-rings.
      for (let i = rings.length - 1; i >= 0; i--) {
        const rg = rings[i];
        rg.t += reduce ? 0.06 : 0.022;
        if (rg.t >= 1) { rings.splice(i, 1); continue; }
        const q = rot(rg.p);
        const rd = (q.z + 1) / 2;
        const X = cx + q.x * Rd, Y = cy - q.y * Rd;
        const rad = (6 + rg.t * 44) * (0.6 + 0.4 * rd);
        ctx.beginPath(); ctx.arc(X, Y, rad, 0, 7);
        ctx.lineWidth = 2 * (1 - rg.t);
        ctx.strokeStyle = hx(CATCOLOR[rg.cat] || EMBER, 0.5 * (1 - rg.t) * (0.4 + 0.6 * rd) * sceneDim);
        ctx.stroke();
      }

      // Beat 2 flick-in labels: term for keywords, cold "vs" tick for competitors.
      for (let i = labels.length - 1; i >= 0; i--) {
        const lb = labels[i];
        lb.t += reduce ? 0.05 : 0.011;
        if (lb.t >= 1) { labels.splice(i, 1); continue; }
        const q = rot(lb.p);
        if (q.z < -0.2) continue;
        const rd = (q.z + 1) / 2;
        const X = cx + q.x * Rd, Y = cy - q.y * Rd;
        const fade = Math.sin(Math.min(1, lb.t) * Math.PI);
        const rise = reduce ? 0 : lb.t * 14;
        const isComp = lb.kind === "competitor";
        ctx.font = isComp ? "700 12px ui-monospace, monospace" : "600 12px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = hx(isComp ? ORANGE : EMBER, 0.9 * fade * (0.4 + 0.6 * rd) * sceneDim);
        ctx.fillText(lb.text.length > 24 ? lb.text.slice(0, 22) + "…" : lb.text, X, Y - 14 - rise);
      }

      // Completion surge shockwave.
      if (revealAt) {
        const bt = Math.min(1, (now - revealAt) / 1100);
        if (bt < 1) {
          ctx.beginPath(); ctx.arc(cx, cy, Rd * (1 + bt * 1.15), 0, 7);
          ctx.lineWidth = 3 * (1 - bt);
          ctx.strokeStyle = hx(ORANGE, 0.55 * (1 - bt) * mo);
          ctx.stroke();
        }
      }

      // Rotation quickens with intensity, then eases to a near-stop at the reveal.
      if (!reduce) {
        const targetSpin = 0.0016 * (0.5 + 1.8 * intensity);
        const effSpin = revealAt ? targetSpin * Math.max(0, 1 - (now - revealAt) / 900) : targetSpin;
        angle += effSpin * introE;
      }
      raf = requestAnimationFrame(draw);
    }
    nodes[0].a = 0.001;
    rings.push({ p: nodes[0].p, t: 0, cat: "domain" }); // domain lock-on ping
    raf = requestAnimationFrame(draw);

    const unsub = subscribe((e: ScanEvent) => {
      if (!alive) return;
      switch (e.type) {
        case "status":
          if (statusRef.current) statusRef.current.textContent = e.text;
          break;
        case "keyword":
          addNode(e.label, "keyword", 1.1);
          setKwCount((c) => c + 1);
          break;
        case "competitor":
          addNode(e.label, "competitor", 1.05);
          setCompCount((c) => c + 1);
          break;
        case "intent":
          break; // never emitted
        case "progress":
          intensityTarget = Math.max(intensityTarget, 0.15 + e.value * 0.45);
          setRailPct(Math.round(Math.max(0, Math.min(1, e.value)) * 100));
          break;
        case "crescendo":
          crescStart = performance.now();
          crescDur = Math.max(1, e.revealInMs);
          crescFrom = intensity;
          break;
        case "reveal":
          revealAt = performance.now();
          intensityTarget = 1;
          setRailPct(100);
          setRevealData({ usd: e.monthlyUsd, label: e.label, topKeyword: e.topKeyword });
          break;
        case "done":
          if (statusRef.current) statusRef.current.textContent = "Scan complete · building your report";
          onDone?.();
          break;
      }
    });

    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); unsub(); };
  }, [domain, subscribe, onDone]);

  const subCaption =
    kwCount || compCount
      ? `${kwCount} keyword${kwCount === 1 ? "" : "s"} that pay · ${compCount} competitor${compCount === 1 ? "" : "s"} on page one`
      : "";

  return (
    <div
      className={`relative h-[clamp(440px,72svh,560px)] w-full overflow-hidden rounded-2xl bg-[#0a0a0a] ${className}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Status pill (Beats 1 & 4) */}
      <div className="absolute left-1/2 top-6 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-white/[.045] px-5 py-2.5 backdrop-blur-xl">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#FF6B35] shadow-[0_0_12px_#FF6B35]" />
        <div ref={statusRef} className="font-mono text-[13px] text-neutral-100">
          Reading {domain}…
        </div>
      </div>

      {/* Real-progress rail (Beat 4) */}
      <div className="absolute left-1/2 top-[70px] h-[3px] w-[min(420px,78%)] -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[#FF6B35] transition-[width] duration-700 ease-out"
          style={{ width: `${railPct}%` }}
        />
      </div>

      {/* Rotating quips (Beat 3) — hidden the moment the reveal fires */}
      {!revealed && (
        <div className="pointer-events-none absolute inset-x-0 bottom-16 flex justify-center px-8">
          <p
            aria-hidden="true"
            className="max-w-xl text-balance text-center transition-opacity duration-700 ease-in-out"
            style={{
              fontWeight: 600,
              fontSize: "clamp(16px, 2vw, 22px)",
              lineHeight: 1.4,
              color: "#f5f5f5",
              opacity: quipVisible ? 1 : 0,
            }}
          >
            {quipsRef.current[quipIndex]}
          </p>
        </div>
      )}

      {/* Field sub-caption (Beat 2) */}
      {!revealed && subCaption && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-neutral-500">{subCaption}</p>
        </div>
      )}

      {/* The revenue reveal (Beat 5) — the money shot, in the stillness */}
      {revealed && revealData && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div
            className="absolute inset-0 bg-[#0a0a0a]/70 backdrop-blur-[2px]"
            style={{ animation: "scanRevealFade 500ms ease-out both" }}
          />
          <div className="relative flex flex-col items-center" style={{ animation: "scanRevealRise 700ms cubic-bezier(.2,.8,.2,1) both" }}>
            {revealData.usd != null ? (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#FF6B35]">Revenue at risk</p>
                <div
                  className="mt-3 font-semibold tabular-nums tracking-tight text-[#FF6B35]"
                  style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(44px, 9vw, 84px)", lineHeight: 1 }}
                >
                  ${countUp.toLocaleString()}
                  <span className="text-[0.4em] text-neutral-400">/mo</span>
                </div>
                <span className="mt-4 inline-block rounded-md border border-white/15 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-neutral-400">
                  {revealData.label}
                </span>
                <p className="mt-5 max-w-md text-pretty text-sm text-neutral-300">
                  {revealData.topKeyword
                    ? `in revenue you're losing on "${revealData.topKeyword}" every month.`
                    : "in revenue you're losing across the keywords you're losing."}
                </p>
              </>
            ) : (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#FF6B35]">Competitive map</p>
                <h2
                  className="mt-3 font-semibold tracking-tight text-[#f5f5f5]"
                  style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: "clamp(30px, 6vw, 56px)", lineHeight: 1.05 }}
                >
                  Here&apos;s your competitive map.
                </h2>
                <p className="mt-4 max-w-md text-pretty text-sm text-neutral-300">
                  {compCount} {compCount === 1 ? "rival" : "rivals"} on page one.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scanRevealFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scanRevealRise {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.scan-reveal-noanim) { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
