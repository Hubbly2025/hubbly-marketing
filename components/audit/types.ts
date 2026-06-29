import type { SeoReport } from "@/lib/seo-report/types"

export type Persona = {
  title?: string
  company_size?: string
  pain_point?: string
  trigger?: string
}

export type Competitor = {
  name?: string
  their_angle?: string
  their_weakness?: string
  your_opening?: string
}

export type SampleEmail = {
  subject?: string
  body?: string
}

export type Audit = {
  id: string
  url: string
  status: "processing" | "complete" | "failed"
  error_message?: string | null
  created_at?: string
  completed_at?: string
  analysis?: {
    company_name?: string
    product?: string
    industry?: string
    icp?: {
      primary?: Persona
      secondary?: Persona
      emerging?: Persona
    }
    competitors?: Competitor[]
    gtm_gaps?: string[]
    outreach_angle?: string
    sample_email?: SampleEmail
    seo_report?: SeoReport
    error?: string
  }
  competitors?: Competitor[]
  intent_data?: {
    monthly?: number
    weekly?: number
    highIntent?: number
    high_intent?: number
    label?: string
    top_signals?: string[]
    geographies?: Array<{ region?: string; count?: number }>
  }
  gtm_plan?: {
    week_1?: Record<string, unknown>
    week_2_3?: Record<string, unknown>
    week_4?: Record<string, unknown>
  }
  sample_email?: SampleEmail
}
