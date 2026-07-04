"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  title: string;
  aspect?: string | null;  // CSS aspect-ratio, default "16 / 9". Pass null to size via a height class instead.
  className?: string;
};

export default function LazyDemo({ src, title, aspect = "16 / 9", className = "" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoad(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] ${className}`}
      style={aspect ? { aspectRatio: aspect } : undefined}
    >
      {load ? (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full"
          style={{ border: 0 }}
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            loading demo…
          </span>
        </div>
      )}
      <span className="pointer-events-none absolute left-3 top-3 rounded-md border border-white/15 bg-black/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
        Demo · illustrative data
      </span>
    </div>
  );
}
