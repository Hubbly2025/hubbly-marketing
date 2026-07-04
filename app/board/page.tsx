import type { Metadata } from "next"
import LazyDemo from "@/components/lazy-demo"

export const metadata: Metadata = {
  title: "Hubbly board",
  robots: { index: false, follow: false },
}

export default function BoardPage() {
  return (
    <main className="h-[100dvh] w-full overflow-hidden bg-[#0a0a0a]">
      <LazyDemo
        src="/demos/hubbly-board-mode.html"
        title="Hubbly board"
        aspect="16 / 9"
        className="h-[100dvh] max-h-[100dvh] rounded-none border-0"
      />
    </main>
  )
}
