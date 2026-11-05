CREATE TABLE public.bot_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bot_faqs TO service_role;
ALTER TABLE public.bot_faqs ENABLE ROW LEVEL SECURITY;