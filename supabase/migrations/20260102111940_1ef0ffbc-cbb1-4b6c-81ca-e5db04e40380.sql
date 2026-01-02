-- Fix function search paths for security
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;