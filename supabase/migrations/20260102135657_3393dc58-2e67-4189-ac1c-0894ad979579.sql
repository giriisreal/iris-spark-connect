-- Add new columns for Gen Z features to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS vibe_status TEXT DEFAULT 'chill',
ADD COLUMN IF NOT EXISTS dating_mode TEXT DEFAULT 'dating',
ADD COLUMN IF NOT EXISTS pronouns TEXT,
ADD COLUMN IF NOT EXISTS boundaries TEXT[],
ADD COLUMN IF NOT EXISTS comfort_tags TEXT[],
ADD COLUMN IF NOT EXISTS non_negotiables TEXT[],
ADD COLUMN IF NOT EXISTS voice_intro_url TEXT,
ADD COLUMN IF NOT EXISTS hide_photos_until_message INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS energy_preferences JSONB DEFAULT '{"humor": 50, "music": 50, "texting": 50}'::jsonb,
ADD COLUMN IF NOT EXISTS profile_theme TEXT DEFAULT 'olive';

-- Create voice_intros table for storing voice recordings
CREATE TABLE IF NOT EXISTS public.voice_intros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_intros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own voice intros" 
ON public.voice_intros 
FOR ALL 
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view all voice intros" 
ON public.voice_intros 
FOR SELECT 
USING (true);

-- Create mini_games table for icebreaker games
CREATE TABLE IF NOT EXISTS public.mini_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  player1_answers JSONB,
  player2_answers JSONB,
  compatibility_bonus INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mini_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view games in their matches" 
ON public.mini_games 
FOR SELECT 
USING (match_id IN (
  SELECT id FROM matches 
  WHERE profile1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR profile2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
));

CREATE POLICY "Users can play games in their matches" 
ON public.mini_games 
FOR ALL 
USING (match_id IN (
  SELECT id FROM matches 
  WHERE profile1_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR profile2_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
));

-- Create communities table
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT NOT NULL,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view communities" 
ON public.communities 
FOR SELECT 
USING (true);

-- Create community_members table
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(community_id, profile_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view community members" 
ON public.community_members 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join/leave communities" 
ON public.community_members 
FOR ALL 
USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create safety_reports table
CREATE TABLE IF NOT EXISTS public.safety_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id),
  reported_id UUID NOT NULL REFERENCES public.profiles(id),
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.safety_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create safety reports" 
ON public.safety_reports 
FOR INSERT 
WITH CHECK (reporter_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Insert default communities
INSERT INTO public.communities (name, description, icon, category) VALUES
('Music Lovers', 'Connect over your favorite tunes', '🎵', 'music'),
('Mental Health Warriors', 'A safe space for support', '💚', 'mental_health'),
('Gamers United', 'Find your player 2', '🎮', 'gaming'),
('Creative Souls', 'Artists, writers, and makers', '🎨', 'creators'),
('Bookworms', 'Share your favorite reads', '📚', 'books'),
('Fitness Enthusiasts', 'Sweat together, grow together', '💪', 'fitness')
ON CONFLICT DO NOTHING;