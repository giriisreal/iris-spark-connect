-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER NOT NULL CHECK (age >= 18 AND age <= 100),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'non-binary', 'other')),
  bio TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  city TEXT,
  looking_for TEXT[] DEFAULT ARRAY['male', 'female', 'non-binary', 'other'],
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 50,
  max_distance INTEGER DEFAULT 50,
  interests TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profile photos table
CREATE TABLE public.profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create swipes table for like/dislike actions
CREATE TABLE public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(swiper_id, swiped_id)
);

-- Create matches table (mutual likes)
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile1_id, profile2_id)
);

-- Create messages table for chat
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blocked users table
CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Profile photos policies
CREATE POLICY "Users can view all profile photos" ON public.profile_photos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own photos" ON public.profile_photos
  FOR ALL TO authenticated 
  USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Swipes policies
CREATE POLICY "Users can view their own swipes" ON public.swipes
  FOR SELECT TO authenticated 
  USING (swiper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create swipes" ON public.swipes
  FOR INSERT TO authenticated 
  WITH CHECK (swiper_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Matches policies
CREATE POLICY "Users can view their matches" ON public.matches
  FOR SELECT TO authenticated 
  USING (
    profile1_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    profile2_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Messages policies
CREATE POLICY "Users can view messages in their matches" ON public.messages
  FOR SELECT TO authenticated 
  USING (
    match_id IN (
      SELECT id FROM public.matches 
      WHERE profile1_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR profile2_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches" ON public.messages
  FOR INSERT TO authenticated 
  WITH CHECK (
    sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) AND
    match_id IN (
      SELECT id FROM public.matches 
      WHERE profile1_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR profile2_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can update read status" ON public.messages
  FOR UPDATE TO authenticated 
  USING (
    match_id IN (
      SELECT id FROM public.matches 
      WHERE profile1_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
         OR profile2_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Blocked users policies
CREATE POLICY "Users can view their blocked list" ON public.blocked_users
  FOR SELECT TO authenticated 
  USING (blocker_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can block others" ON public.blocked_users
  FOR INSERT TO authenticated 
  WITH CHECK (blocker_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can unblock others" ON public.blocked_users
  FOR DELETE TO authenticated 
  USING (blocker_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Function to create match when mutual like
CREATE OR REPLACE FUNCTION public.check_and_create_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'like' THEN
    IF EXISTS (
      SELECT 1 FROM public.swipes 
      WHERE swiper_id = NEW.swiped_id 
        AND swiped_id = NEW.swiper_id 
        AND direction = 'like'
    ) THEN
      INSERT INTO public.matches (profile1_id, profile2_id)
      VALUES (
        LEAST(NEW.swiper_id, NEW.swiped_id),
        GREATEST(NEW.swiper_id, NEW.swiped_id)
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for match creation
CREATE TRIGGER on_swipe_create_match
  AFTER INSERT ON public.swipes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_create_match();

-- Function to update profile timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profile updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Profile will be created during onboarding
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;