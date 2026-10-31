CREATE TABLE public.trader_id_owners (
 trader_id text PRIMARY KEY,
 chat_id bigint NOT NULL,
 claimed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.trader_id_owners TO service_role;
ALTER TABLE public.trader_id_owners ENABLE ROW LEVEL SECURITY;
INSERT INTO public.trader_id_owners (trader_id, chat_id)
SELECT trader_id, chat_id FROM public.bot_users WHERE trader_verified = true AND trader_id IS NOT NULL;
CREATE FUNCTION public.enforce_trader_id_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF NEW.trader_verified AND NEW.trader_id IS NOT NULL THEN
  INSERT INTO public.trader_id_owners (trader_id, chat_id) VALUES (NEW.trader_id, NEW.chat_id) ON CONFLICT (trader_id) DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM public.trader_id_owners WHERE trader_id = NEW.trader_id AND chat_id = NEW.chat_id) THEN
   RAISE EXCEPTION 'trader_id_owned' USING ERRCODE = '23505';
  END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_trader_id_owner() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_trader_id_owner() TO service_role;
CREATE TRIGGER enforce_trader_id_owner BEFORE INSERT OR UPDATE OF trader_verified, trader_id, chat_id ON public.bot_users FOR EACH ROW EXECUTE FUNCTION public.enforce_trader_id_owner();
COMMENT ON TABLE public.trader_id_owners IS 'Permanent verified trader ownership. Removing verification does not release this binding.';