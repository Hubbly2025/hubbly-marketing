"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Cal, { getCalApi } from "@calcom/embed-react"

const NAMESPACE = "hubbly.io-growth-demo"
const CAL_LINK = "vince-rabiola-llvenn/hubbly.io-growth-demo"

function CalEmbedInner() {
  const searchParams = useSearchParams()
  const name = searchParams.get("name")
  const email = searchParams.get("email")

  useEffect(() => {
    void (async () => {
      const cal = await getCalApi({ namespace: NAMESPACE })
      // The page is #0A0A0A — without a forced dark theme the widget renders
      // as a white card and looks broken.
      cal("ui", {
        hideEventTypeDetails: false,
        layout: "month_view",
        theme: "dark",
        cssVarsPerTheme: {
          dark: { "cal-brand": "#FF6B35" },
          light: { "cal-brand": "#FF6B35" },
        },
      })
    })()
  }, [])

  return (
    <Cal
      namespace={NAMESPACE}
      calLink={CAL_LINK}
      config={{
        layout: "month_view",
        useSlotsViewOnSmallScreen: "true",
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      }}
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
    />
  )
}

export function CalEmbed() {
  return (
    <Suspense fallback={<div className="min-h-[700px]" aria-hidden />}>
      <CalEmbedInner />
    </Suspense>
  )
}
