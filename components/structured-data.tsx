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
      "https://twitter.com/hubblyio",
      "https://www.linkedin.com/company/hubbly-io",
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
      "An autonomous growth engine that combines market intelligence, AI SDR-style outbound, SEO and demand capture, AI voice, reply handling, and meeting booking into one coordinated agent system with human approval gates.",
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
      url: `${siteUrl}/pricing`,
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

// FAQ Schema - matches visible FAQ section content
export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Hubbly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hubbly is an autonomous growth engine that turns a website, offer, and market position into coordinated execution across SEO, outbound, voice, booking, and optimization.",
        },
      },
      {
        "@type": "Question",
        name: "How does Hubbly work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hubbly analyzes the business, maps the market, builds the strategy, launches specialized workflows, and improves over time from replies, meetings, and conversion signals.",
        },
      },
      {
        "@type": "Question",
        name: "Who is Hubbly for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hubbly is for B2B and B2C companies that want one system to understand their market, find buyers, and coordinate growth across channels.",
        },
      },
      {
        "@type": "Question",
        name: "What does Hubbly replace?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hubbly replaces disconnected growth stacks that often include data vendors, enrichment tools, sequencing products, dialers, booking tools, AI copy tools, spreadsheet glue, and reporting dashboards.",
        },
      },
      {
        "@type": "Question",
        name: "Is Hubbly just an AI SDR platform?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Hubbly includes AI SDR-style capabilities, but it is broader than outbound because it combines intelligence, execution, memory, and optimization in one system.",
        },
      },
      {
        "@type": "Question",
        name: "Does Hubbly support industry-specific workflows?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The core engine stays the same. The language, workflows, and compliance logic adapt to your market.",
        },
      },
      {
        "@type": "Question",
        name: "Do I have to approve everything Hubbly does?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Hubbly runs on full autopilot by default with safety rails always on — snapshot before every change, verify after every publish, auto-rollback on regression. If you prefer to review before anything goes live, approval gates are a single toggle.",
        },
      },
      {
        "@type": "Question",
        name: "Does Hubbly support international and multilingual workflows?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Hubbly supports international teams and operates across 74 languages for outreach, voice, follow-up, and reporting.",
        },
      },
      {
        "@type": "Question",
        name: "Does Hubbly work with our existing CRM and tools?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Hubbly is designed to integrate with existing systems or replace parts of the stack over time, depending on how your team wants to adopt it.",
        },
      },
    ],
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
