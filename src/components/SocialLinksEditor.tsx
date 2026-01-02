import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, Instagram, Twitter, Music, Loader2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  spotify?: string;
  tiktok?: string;
}

const SocialLinksEditor = () => {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [links, setLinks] = useState<SocialLinks>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile?.social_links) {
      setLinks(profile.social_links as SocialLinks);
    }
  }, [profile?.social_links]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    
    const { error } = await updateProfile({ social_links: links } as any);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to save social links',
        variant: 'destructive',
      });
    } else {
      setSaved(true);
      toast({
        title: 'Saved!',
        description: 'Your social links have been updated',
      });
      setTimeout(() => setSaved(false), 2000);
    }
    
    setSaving(false);
  };

  const socialFields = [
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@username' },
    { key: 'twitter', label: 'Twitter/X', icon: Twitter, placeholder: '@username' },
    { key: 'spotify', label: 'Spotify', icon: Music, placeholder: 'Profile URL' },
    { key: 'tiktok', label: 'TikTok', icon: Link, placeholder: '@username' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-6 space-y-4"
    >
      <div className="flex items-center gap-2">
        <Link className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">Social Links</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Share your socials with matches (requires mutual consent to view)
      </p>

      <div className="space-y-3">
        {socialFields.map(({ key, label, icon: Icon, placeholder }) => (
          <div key={key} className="space-y-1">
            <Label className="text-sm flex items-center gap-2">
              <Icon className="w-4 h-4" />
              {label}
            </Label>
            <Input
              value={links[key as keyof SocialLinks] || ''}
              onChange={(e) => setLinks(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="border-2 border-foreground"
            />
          </div>
        ))}
      </div>

      <Button
        variant="hero"
        onClick={handleSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : saved ? (
          <Check className="w-4 h-4 mr-2" />
        ) : null}
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Links'}
      </Button>
    </motion.div>
  );
};

export default SocialLinksEditor;
