-- Add new columns to profiles for pickup lines and notes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pickup_lines text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS personal_notes text[] DEFAULT '{}';

-- Create daily updates table for photo stories
CREATE TABLE IF NOT EXISTS public.daily_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Enable RLS on daily_updates
ALTER TABLE public.daily_updates ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_updates
CREATE POLICY "Users can view all daily updates" 
ON public.daily_updates 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own daily updates" 
ON public.daily_updates 
FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));

CREATE POLICY "Users can delete their own daily updates" 
ON public.daily_updates 
FOR DELETE 
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Enable realtime for daily_updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_updates;