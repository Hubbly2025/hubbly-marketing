CREATE TABLE IF NOT EXISTS public.waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  company_size TEXT NOT NULL,
  current_tools TEXT,
  pain_points TEXT NOT NULL,
  expected_results TEXT NOT NULL,
  timeline TEXT,
  utm_source TEXT,
  audit_url TEXT,
  audit_data JSONB DEFAULT '{}'::jsonb,
  status TEXT CHECK (status IN ('pending', 'contacted', 'qualified', 'onboarded', 'rejected')) DEFAULT 'pending',
  priority_score INTEGER DEFAULT 0,
  notes TEXT,
  contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_signups_email ON public.waitlist_signups(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_status ON public.waitlist_signups(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at ON public.waitlist_signups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_signups_priority_score ON public.waitlist_signups(priority_score DESC);

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public waitlist signups" ON public.waitlist_signups;
CREATE POLICY "Allow public waitlist signups"
  ON public.waitlist_signups
  FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_waitlist_signups_updated_at ON public.waitlist_signups;
CREATE TRIGGER update_waitlist_signups_updated_at
  BEFORE UPDATE ON public.waitlist_signups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

GRANT INSERT ON public.waitlist_signups TO anon;
GRANT INSERT ON public.waitlist_signups TO authenticated;
