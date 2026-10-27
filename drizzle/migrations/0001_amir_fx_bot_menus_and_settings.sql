CREATE TABLE public.bot_users (
  chat_id bigint PRIMARY KEY,
  state text NOT NULL DEFAULT 'new',
  platform text,
  trader_id text,
  trader_verified boolean NOT NULL DEFAULT false,
  last_balance numeric NOT NULL DEFAULT 0,
  last_deposit numeric NOT NULL DEFAULT 0,
  selected_service text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.service_config (
  service_key text PRIMARY KEY,
  title text NOT NULL,
  min_balance numeric NOT NULL DEFAULT 50,
  invite_link text,
  sort int NOT NULL DEFAULT 0
);

CREATE TABLE public.bot_settings (
  key text PRIMARY KEY,
  value text
);

CREATE TABLE public.bot_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chat_id bigint NOT NULL,
  message_id bigint NOT NULL,
  delete_after timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bot_messages_delete_after_idx ON public.bot_messages (delete_after);

ALTER TABLE public.verification_requests
  ADD COLUMN platform text NOT NULL DEFAULT 'quotex',
  ADD COLUMN purpose text NOT NULL DEFAULT 'id_check',
  ADD COLUMN service_key text;

INSERT INTO public.service_config (service_key, title, min_balance, invite_link, sort) VALUES
  ('trading_series', 'Trading Series', 100, NULL, 1),
  ('vip_sessions', 'VIP Trading Sessions', 50, 'https://t.me/+C9fZZiM99sQzMjdk', 2),
  ('ai_license', 'AI Bot License Key', 50, NULL, 3),
  ('one_to_one', 'One-to-One Session', 300, NULL, 4);

INSERT INTO public.bot_settings (key, value) VALUES
  ('welcome_text', '👋 Amir FX Community mein khush aamdeed!'),
  ('welcome_media_url', ''),
  ('quotex_reg_link', ''),
  ('pocket_reg_link', ''),
  ('youtube_link', ''),
  ('onetoone_timings', 'One-to-One sessions weekly schedule par hote hain. Timing confirm karne ke liye admin se rabta karein.'),
  ('autodelete_minutes', '10'),
  ('link_delete_minutes', '60');

GRANT ALL ON public.bot_users TO service_role;
GRANT ALL ON public.service_config TO service_role;
GRANT ALL ON public.bot_settings TO service_role;
GRANT ALL ON public.bot_messages TO service_role;

ALTER TABLE public.bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_messages ENABLE ROW LEVEL SECURITY;