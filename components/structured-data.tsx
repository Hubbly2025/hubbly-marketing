const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hubbly.io"

// Organization Schema
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: "Hubbly",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      "https://twitter.com/hubblyio",
      "https://www.linkedin.com/company/hubbly-io",
    ],
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
    name: "Hubbly",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Autonomous revenue operating system that researches your market, builds your ICP, enriches contacts, launches outreach across email and voice, and books meetings from one shared system with human oversight.",
    url: siteUrl,
    offers: [
      {
        "@type": "Offer",
        name: "Free Scan",
        price: "0",
        priceCurrency: "USD",
        description: "Run an audit on your website, offer, and outbound motion.",
      },
      {
        "@type": "Offer",
        name: "Starter",
        price: "197",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "500 leads, 50 voice minutes per month.",
      },
      {
        "@type": "Offer",
        name: "Growth",
        price: "497",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "2,500 leads, 200 voice minutes per month.",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "997",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "7,500 leads, 500 voice minutes, custom verticals.",
      },
    ],
    featureList: [
      "12 AI agents (5 intelligence + 7 execution)",
      "498M+ intent-qualified records",
      "43K+ live buyer intent topics",
      "AI-powered email and voice outreach",
      "Human oversight with 5 approval gates",
      "Shared memory across all agents",
      "Vertical-specific AI agents",
      "Meeting booking automation",
    ],
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
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Hubbly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hubbly is an autonomous revenue operating system that turns a website, offer, and market position into a live pipeline engine. It combines research, ICP building, enrichment, outreach, voice, booking, and optimization in one shared system.",
        },
      },
      {
        "@type": "Question",
        name: "How does Hubbly work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hubbly analyzes the business, maps the best-fit buyer profile, builds targeting logic, writes and launches outreach, places voice calls, books meetings, and learns from replies and conversions over time.",
        },
      },
      {
        "@type": "Question",
        name: "Who is Hubbly for?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hubbly is built for growth teams, agencies, insurance organizations, mortgage teams, financial services businesses, and B2B SaaS operators that need more pipeline without adding fragmented tools and manual overhead.",
        },
      },
      {
        "@type": "Question",
        name: "What does Hubbly replace?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hubbly replaces disconnected outbound stacks that often include lead data vendors, enrichment tools, sequencing products, dialers, booking tools, AI copy tools, spreadsheet glue, and reporting dashboards.",
        },
      },
      {
        "@type": "Question",
        name: "Is Hubbly an AI SDR platform?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hubbly includes AI SDR-style capabilities, but it is broader than a single SDR product because it combines intelligence, execution, memory, and optimization in one operating system.",
        },
      },
      {
        "@type": "Question",
        name: "Does Hubbly support specific industries?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Hubbly supports verticals such as insurance, mortgage, agencies, financial services, and B2B SaaS, with tailored workflows and specialized go-to-market logic.",
        },
      },
      {
        "@type": "Question",
        name: "Does Hubbly work with our existing CRM and sales tools?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Hubbly is designed to layer on top of the systems you already use or replace parts of your stack over time. It connects with major CRMs and existing tools, so teams can start with their current setup, keep their process running, and then consolidate into Hubbly where it makes sense.",
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
