import type React from "react"
import type { Metadata, Viewport } from "next"
import { IBM_Plex_Sans, IBM_Plex_Mono, Bebas_Neue } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SmoothScroll } from "@/components/smooth-scroll"
import { StructuredData } from "@/components/structured-data"
import "./globals.css"

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
  preload: true,
})
const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
  preload: true,
})
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
  preload: true,
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hubbly.io"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Hubbly — The Autonomous Revenue Operating System",
    template: "%s | Hubbly",
  },
  description:
    "Drop your website in. Hubbly does your marketing and sales — one autonomous system that learns your market, ranks your content, finds in-market buyers, runs outreach and calls, and books the meetings.",
  applicationName: "Hubbly",
  keywords: [
    "AI sales automation",
    "autonomous outbound",
    "AI SDR platform",
    "ICP enrichment",
    "AI voice outreach",
    "lead generation automation",
  ],
  authors: [{ name: "Hubbly" }],
  creator: "Hubbly",
  publisher: "Hubbly",
  alternates: { canonical: "/" },
  
  // Open Graph
  openGraph: {
    type: "website",
    url: `${siteUrl}/`,
    siteName: "Hubbly",
    locale: "en_US",
    title: "Hubbly — The Autonomous Revenue Operating System",
    description:
      "Drop your website in. Hubbly does your marketing and sales — one autonomous system that learns your market, ranks your content, finds in-market buyers, runs outreach and calls, and books the meetings.",
    images: [
      {
        url: "/og/hubbly-og.png",
        width: 1200,
        height: 630,
        alt: "Hubbly — The Autonomous Revenue Operating System",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@hubblyio",
    creator: "@hubblyio",
    title: "Hubbly — The Autonomous Revenue Operating System",
    description: "Drop your website in. Hubbly does your marketing and sales — one autonomous system that learns your market, ranks your content, finds in-market buyers, runs outreach and calls, and books the meetings.",
    images: ["/og/hubbly-og.png"],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  icons: {
    icon: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <head>
        {/* DNS Prefetch and Preconnect for performance */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Structured Data */}
        <StructuredData />
      </head>
      <body
        className={`${ibmPlexSans.variable} ${bebasNeue.variable} ${ibmPlexMono.variable} font-sans antialiased overflow-x-hidden`}
      >
        <div className="noise-overlay" aria-hidden="true" />
        <SmoothScroll>{children}</SmoothScroll>
        <Analytics />
      </body>
    </html>
  )
}
