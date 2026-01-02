-- Add mental health & social features to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS break_mode_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS session_start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS daily_usage_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Create user activity tracking for gentle reminders
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their sessions" ON public.user_sessions
FOR ALL USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create multiplayer game sessions
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  current_round INTEGER DEFAULT 1,
  max_rounds INTEGER DEFAULT 3,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  current_question JSONB,
  player1_answer TEXT,
  player2_answer TEXT,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their game sessions" ON public.game_sessions
FOR SELECT USING (match_id IN (
  SELECT id FROM matches WHERE 
    profile1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR 
    profile2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Users can manage their game sessions" ON public.game_sessions
FOR ALL USING (match_id IN (
  SELECT id FROM matches WHERE 
    profile1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR 
    profile2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
));

-- Add realtime for game sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;

-- Create storage bucket for voice intros if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-intros', 'voice-intros', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice intros
CREATE POLICY "Anyone can view voice intros" ON storage.objects
FOR SELECT USING (bucket_id = 'voice-intros');

CREATE POLICY "Users can upload their voice intro" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'voice-intros' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their voice intro" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'voice-intros' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their voice intro" ON storage.objects
FOR DELETE USING (
  bucket_id = 'voice-intros' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);