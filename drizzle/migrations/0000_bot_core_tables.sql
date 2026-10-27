CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  trader_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  affiliate_reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT ALL ON public.verification_requests TO service_role;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.license_keys (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'available',
  issued_to_chat_id bigint,
  issued_to_trader_id text,
  issued_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.license_keys TO service_role;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.verified_users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chat_id bigint NOT NULL UNIQUE,
  username text,
  trader_id text,
  license_key_id bigint,
  verified_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.verified_users TO service_role;
ALTER TABLE public.verified_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bridge_state (
  id integer PRIMARY KEY,
  session_string text,
  login_code text,
  status text,
  last_seen timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bridge_state TO service_role;
ALTER TABLE public.bridge_state ENABLE ROW LEVEL SECURITY;