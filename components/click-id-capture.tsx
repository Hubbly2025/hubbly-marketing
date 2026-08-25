"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { captureClickIdsFromLocation } from "@/lib/click-ids"

/**
 * Renders nothing. Runs the click-ID capture on first paint and again on client
 * navigations (Next keeps fbclid/gclid in the URL across route changes, and
 * first-click-wins makes the repeated call idempotent). Mounted once in the root
 * layout. See lib/click-ids.ts for the capture/consent logic.
 */
export function ClickIdCapture() {
  const pathname = usePathname()

  useEffect(() => {
    captureClickIdsFromLocation()
  }, [pathname])

  return null
}
