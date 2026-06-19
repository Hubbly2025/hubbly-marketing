"use client"

import type React from "react"
import { useState } from "react"
import { useReveal } from "@/hooks/useReveal"
import styles from "./audit-cta.module.css"

type Props = {
  eyebrow?: string
  headline: React.ReactNode
  subhead?: string
  fine?: string
  id?: string
}

export default function AuditCtaV2({
  eyebrow = "Your turn",
  headline,
  subhead,
  fine = "Free · no credit card · nothing from your session was stored",
  id = "audit-v2",
}: Props) {
  const ref = useReveal<HTMLDivElement>()
  const [url, setUrl] = useState("")

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    // Route to the existing audit flow
    window.location.href = `/?audit=${encodeURIComponent(url.trim())}#audit`
  }

  return (
    <section className={styles.band} id={id}>
      <div className="wrap" ref={ref}>
        <span className="k rv">{eyebrow}</span>
        <h2 className={`${styles.head} rv d1`}>{headline}</h2>
        {subhead && <p className={`${styles.sub} rv d1`}>{subhead}</p>}
        <form className={`${styles.form} rv d2`} onSubmit={onSubmit}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourcompany.com"
            aria-label="Your website URL"
            autoComplete="off"
          />
          <button className="btn lg" type="submit">
            Run free audit
          </button>
        </form>
        <p className={`${styles.fine} rv d2`}>{fine}</p>
      </div>
    </section>
  )
}
