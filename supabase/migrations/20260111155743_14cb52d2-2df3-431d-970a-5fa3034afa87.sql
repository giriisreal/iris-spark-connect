-- User subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  razorpay_payment_id TEXT,
  razorpay_order_id TEXT,
  amount_paid INTEGER,
  currency TEXT DEFAULT 'INR',
  purchased_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_lifetime BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Daily usage limits tracking
CREATE TABLE public.daily_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  matches_shown INTEGER DEFAULT 0,
  ai_prompts_used INTEGER DEFAULT 0,
  openers_sent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, usage_date)
);

-- Community posts table
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Post votes tracking
CREATE TABLE public.post_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, profile_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;

-- User subscriptions policies
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
  FOR SELECT USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own subscription" ON public.user_subscriptions
  FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own subscription" ON public.user_subscriptions
  FOR UPDATE USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Daily usage policies
CREATE POLICY "Users can view their own usage" ON public.daily_usage
  FOR SELECT USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own usage" ON public.daily_usage
  FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own usage" ON public.daily_usage
  FOR UPDATE USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Community posts policies
CREATE POLICY "Anyone can view community posts" ON public.community_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON public.community_posts
  FOR INSERT WITH CHECK (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authors can update their own posts" ON public.community_posts
  FOR UPDATE USING (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authors can delete their own posts" ON public.community_posts
  FOR DELETE USING (author_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Post votes policies
CREATE POLICY "Anyone can view votes" ON public.post_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.post_votes
  FOR INSERT WITH CHECK (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can change their vote" ON public.post_votes
  FOR UPDATE USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can remove their vote" ON public.post_votes
  FOR DELETE USING (profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_usage_updated_at
  BEFORE UPDATE ON public.daily_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get or create today's usage
CREATE OR REPLACE FUNCTION public.get_or_create_daily_usage(p_profile_id UUID)
RETURNS public.daily_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage public.daily_usage;
BEGIN
  SELECT * INTO v_usage FROM public.daily_usage 
  WHERE profile_id = p_profile_id AND usage_date = CURRENT_DATE;
  
  IF NOT FOUND THEN
    INSERT INTO public.daily_usage (profile_id, usage_date)
    VALUES (p_profile_id, CURRENT_DATE)
    RETURNING * INTO v_usage;
  END IF;
  
  RETURN v_usage;
END;
$$;

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION public.is_user_premium(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.user_subscriptions;
BEGIN
  SELECT * INTO v_sub FROM public.user_subscriptions 
  WHERE profile_id = p_profile_id AND plan_type = 'premium';
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  IF v_sub.is_lifetime THEN
    RETURN true;
  END IF;
  
  RETURN v_sub.expires_at > now();
END;
$$;