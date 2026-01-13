-- Add reply_to_id and media_url columns to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT;

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, profile_id, emoji)
);

-- Enable RLS on message_reactions
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reactions
CREATE POLICY "Users can view reactions on their match messages"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.matches mt ON m.match_id = mt.id
    WHERE m.id = message_id
    AND (mt.profile1_id = auth.uid() OR mt.profile2_id = auth.uid())
  )
);

CREATE POLICY "Users can add reactions to their match messages"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  profile_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.matches mt ON m.match_id = mt.id
    WHERE m.id = message_id
    AND (mt.profile1_id = auth.uid() OR mt.profile2_id = auth.uid())
  )
);

CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions
FOR DELETE
USING (profile_id = auth.uid());

-- Enable realtime for message_reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;