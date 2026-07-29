-- 1. Add status column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- 2. Create trigger to insert profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, status)
  VALUES (new.id, new.email, 'full', 'pending');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Enable RLS on profiles and events if not already done
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Note: You should configure RLS policies so that users with status = 'pending' 
-- cannot read/write events. For example:
-- CREATE POLICY "Admins can manage events" ON public.events
--   USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'admin'));

-- 4. Create trigger to call Edge Function when a new profile with status 'pending' is created.
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.trigger_approval_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    -- Make sure to replace YOUR_ANON_KEY with your actual Supabase anon key
    -- and update the project ref in the URL.
    PERFORM net.http_post(
      url := 'https://kvebuwivvbfzxrnyirbp.supabase.co/functions/v1/send-approval-email',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZWJ1d2l2dmJmenhybnlpcmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDgwNjksImV4cCI6MjA5Mzk4NDA2OX0.dNOZijNhRPn2onNhlxNHLry4VqjZ-fUrZnayn_0fGgs"}'::jsonb,
      body := json_build_object('record', row_to_json(NEW))::jsonb
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_pending ON public.profiles;
CREATE TRIGGER on_profile_pending
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_approval_email();
