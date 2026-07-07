import { faqs } from "@/lib/faqs"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hubbly.io"

// Organization Schema
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Hubbly",
    legalName: "Hubbly",
    url: `${siteUrl}/`,
    logo: `${siteUrl}/logo.png`,
    description:
      "Hubbly is an autonomous revenue operating system for SMBs and mid-market teams. Drop in a website and Hubbly learns the market, ranks content across search and AI engines, finds in-market buyers, runs outreach and voice, and books meetings from one shared memory.",
    foundingDate: "2025",
    sameAs: [
      "https://www.linkedin.com/company/hubbly-io",
      "https://x.com/hubblyio",
    ],
    email: "hello@hubbly.io",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Austin",
      addressRegion: "TX",
      addressCountry: "US",
    },
    contactPoint: [{
      "@type": "ContactPoint",
      email: "hello@hubbly.io",
      contactType: "sales",
      areaServed: "Worldwide",
      availableLanguage: ["English"],
    }],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// SoftwareApplication/Product Schema
export function ProductSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${siteUrl}/#software`,
    name: "Hubbly",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Sales & Marketing Automation",
    operatingSystem: "Web",
    url: `${siteUrl}/`,
    publisher: { "@id": `${siteUrl}/#organization` },
    description:
      "An autonomous growth engine that combines market intelligence, AI SDR-style outbound, SEO and demand capture, AI voice, reply handling, and meeting booking into one coordinated agent system, on autopilot by default with opt-in approval gates.",
    featureList: [
      "Market and competitor research",
      "ICP creation and buyer-intent scoring",
      "SEO and demand capture",
      "Autonomous outbound email",
      "AI voice calling",
      "Reply handling and meeting booking",
      "74-language multilingual outreach",
    ],
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/#audit`,
      category: "SaaS subscription",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// FAQ Schema - matches visible FAQ section content (shared source: lib/faqs.ts)
export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// WebSite Schema with SearchAction
export function WebSiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    url: siteUrl,
    name: "Hubbly",
    publisher: { "@id": `${siteUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

// Combined component for all schemas
export function StructuredData() {
  return (
    <>
      <OrganizationSchema />
      <ProductSchema />
      <FAQSchema />
      <WebSiteSchema />
    </>
  )
}
