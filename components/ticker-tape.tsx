"use client"

const tickerItems = [
  { text: "RECON ANALYZED rocketmortgage.com IN 87 SECONDS", delay: 0 },
  { text: "ICP MAPPED 2,340 BUYERS IN TEXAS", delay: 0.7 },
  { text: "COMPETITOR INTEL — 5 PROFILES BUILT FOR ETHOS", delay: 1.4 },
  { text: "GTM STRATEGY APPROVED — TEXAS LIFE INSURANCE", delay: 2.1 },
  { text: "CREATIVE GENERATED 3 ADS · 5 EMAILS · 1 VIDEO", delay: 2.8 },
  { text: "DISCOVER FOUND 847 BUYERS IN FLORIDA", delay: 3.5 },
  { text: "WRITE DRAFTED 3 SEQUENCES FOR TEXAS MORTGAGE", delay: 4.2 },
  { text: "CALL CONNECTED — 4-MIN BANT 0.82", delay: 4.9 },
  { text: "LISTEN CLASSIFIED 89 REPLIES AS INTERESTED", delay: 5.6 },
  { text: "BOOK CONFIRMED 14 MEETINGS TODAY", delay: 6.3 },
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
