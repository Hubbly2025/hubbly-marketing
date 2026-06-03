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
    description: "Hubbly is an autonomous revenue operating system for modern growth teams.",
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
    name: "Hubbly Autonomous Revenue Operating System",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Hubbly is an autonomous revenue operating system that turns a website, offer, and market position into a live pipeline engine through 12 specialized revenue agents, shared memory, and human approval gates.",
    url: siteUrl,
    brand: {
      "@type": "Brand",
      name: "Hubbly",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "100 leads, email outreach, daily brief for first 7 days.",
      },
      {
        "@type": "Offer",
        name: "Starter",
        price: "98",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "500 leads, email outreach, daily brief, 8 vertical agents.",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "298",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "2,000 leads, 60 voice minutes, reputation responses.",
      },
      {
        "@type": "Offer",
        name: "Business",
        price: "698",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "6,000 leads, 200 voice minutes, Acquire Meta ads, competitor analysis.",
      },
      {
        "@type": "Offer",
        name: "Agency",
        price: "1498",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "15,000 leads, 400 voice minutes, multi-account, white-label.",
      },
    ],
    featureList: [
      "12 specialized revenue agents",
      "3 operating layers",
      "Shared memory layer",
      "Human-in-the-loop approval gates",
      "ICP mapping",
      "Email outreach",
      "AI voice calling",
      "Meeting booking",
      "CRM sync",
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
        name: "How does Hubbly's 12-agent system work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hubbly uses 12 specialized revenue agents organized across 3 operating layers. These agents share one memory layer so research, targeting, messaging, outreach, replies, booking, and optimization stay coordinated from first signal to scheduled meeting.",
        },
      },
      {
        "@type": "Question",
        name: "What is the shared memory layer in Hubbly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The shared memory layer is the common operating context every Hubbly agent reads from and writes to. It preserves business context, buyer logic, outreach history, reply classification, and meeting outcomes across the full revenue workflow.",
        },
      },
      {
        "@type": "Question",
        name: "How is Hubbly different from a chatbot or sales copilot?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A chatbot or copilot generates suggestions in-session. Hubbly is an autonomous revenue operating system that combines intelligence, execution, memory, and optimization into one coordinated workflow with human approval gates.",
        },
      },
      {
        "@type": "Question",
        name: "What does Hubbly replace?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hubbly replaces fragmented outbound and pipeline stacks that often include lead data tools, enrichment products, sequencing platforms, dialers, booking tools, AI copy tools, spreadsheet workflows, and disconnected reporting dashboards.",
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
        name: "Does Hubbly support specific industries?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Hubbly supports verticals such as insurance, mortgage, agencies, financial services, and B2B SaaS, with tailored workflows and specialized go-to-market logic.",
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
