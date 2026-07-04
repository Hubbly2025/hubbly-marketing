"use client"

const tickerItems = [
  { text: "RECON SITE ANALYSIS — 87 SECONDS", delay: 0.7 },
  { text: "WEBSITE → CAMPAIGN DRAFT — UNDER 15 MIN", delay: 2.1 },
  { text: "498M+ LICENSED IDENTITY RECORDS", delay: 2.8 },
  { text: "20B+ INTENT SIGNALS · 40K+ LIVE TOPICS", delay: 3.5 },
  { text: "FULL AUTOPILOT · RAILS ALWAYS ON", delay: 4.2 },
]

export function TickerTape() {
  return (
    <div className="ticker-wrap w-full h-10 overflow-hidden flex items-center bg-card/50 border-b border-border/40">
      <div className="ticker-track flex whitespace-nowrap animate-ticker">
        {/* First set of items */}
        {tickerItems.map((item, index) => (
          <div
            key={`a-${index}`}
            className="inline-flex items-center gap-3 px-10 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            <span 
              className="w-2 h-2 rounded-full bg-accent flex-shrink-0 animate-pulse-dot"
              style={{ animationDelay: `${item.delay}s` }}
            />
            {item.text}
          </div>
        ))}
        {/* Second set for seamless loop */}
        {tickerItems.map((item, index) => (
          <div
            key={`b-${index}`}
            className="inline-flex items-center gap-3 px-10 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
          >
            <span 
              className="w-2 h-2 rounded-full bg-accent flex-shrink-0 animate-pulse-dot"
              style={{ animationDelay: `${item.delay}s` }}
            />
            {item.text}
          </div>
        ))}
      </div>
    </div>
  )
}
