import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Heart, User, MapPin, Sparkles, ArrowRight, ArrowLeft, Check, Loader2, Zap, Shield, GraduationCap, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/logo.png';

const INTERESTS = [
  'Travel', 'Music', 'Movies', 'Gaming', 'Fitness', 'Cooking',
  'Art', 'Photography', 'Reading', 'Dancing', 'Sports', 'Nature',
  'Technology', 'Fashion', 'Food', 'Yoga', 'Hiking', 'Coffee',
  'Mental Health', 'Anime', 'K-Pop', 'Podcasts', 'Memes', 'Astrology'
];

const GENDERS = [
  { value: 'male', label: 'Man' },
  { value: 'female', label: 'Woman' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

const VIBES = [
  { id: 'chill', emoji: '😌', label: 'Chill & Slow' },
  { id: 'deep_talks', emoji: '🌙', label: 'Deep Talks' },
  { id: 'fun_chaotic', emoji: '🎉', label: 'Fun & Chaotic' },
  { id: 'energetic', emoji: '⚡', label: 'Energetic' },
  { id: 'romantic', emoji: '💕', label: 'Romantic' },
  { id: 'adventurous', emoji: '🏔️', label: 'Adventurous' },
];

const DATING_MODES = [
  { id: 'dating', icon: Heart, label: 'Dating', desc: 'Looking for romance' },
  { id: 'friends', icon: User, label: 'Friends', desc: 'Just vibes' },
  { id: 'slow', icon: Zap, label: 'Slow Dating', desc: '1 match/day' },
];

const NON_NEGOTIABLES = [
  'Honesty', 'Communication', 'Ambition', 'Humor', 'Kindness',
  'Independence', 'Family values', 'Adventure', 'Creativity', 'Loyalty'
];

const POPULAR_COLLEGES = [
  'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
  'BITS Pilani', 'NIT Trichy', 'NIT Warangal', 'DTU', 'NSUT',
  'Delhi University', 'JNU', 'Ashoka University', 'Christ University',
  'Manipal University', 'VIT Vellore', 'SRM Chennai', 'Amity University',
  'Jadavpur University', 'Anna University', 'IIIT Hyderabad', 'ISB Hyderabad'
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState('');
  const { user } = useAuth();
  
  // Check if user has college email domain
  const userEmail = user?.email || '';
  const emailDomain = userEmail.split('@')[1] || '';
  const isCollegeEmail = emailDomain.endsWith('.edu') || emailDomain.endsWith('.ac.in') || emailDomain.includes('edu.');
  const detectedCollege = isCollegeEmail ? emailDomain.replace('.edu', '').replace('.ac.in', '').split('.')[0].toUpperCase() : '';
  
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    pronouns: '',
    bio: '',
    city: '',
    college: detectedCollege,
    interests: [] as string[],
    looking_for: [] as string[],
    vibeStatus: 'chill',
    datingMode: 'dating',
    nonNegotiables: [] as string[],
  });
  
  const { createProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 7;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleLookingFor = (gender: string) => {
    setFormData(prev => ({
      ...prev,
      looking_for: prev.looking_for.includes(gender)
        ? prev.looking_for.filter(g => g !== gender)
        : [...prev.looking_for, gender]
    }));
  };

  const toggleNonNegotiable = (item: string) => {
    setFormData(prev => ({
      ...prev,
      nonNegotiables: prev.nonNegotiables.includes(item)
        ? prev.nonNegotiables.filter(i => i !== item)
        : prev.nonNegotiables.length < 5 ? [...prev.nonNegotiables, item] : prev.nonNegotiables
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length >= 2 && formData.age && parseInt(formData.age) >= 18;
      case 2:
        return formData.gender !== '';
      case 3:
        return true; // College is optional
      case 4:
        return formData.vibeStatus !== '';
      case 5:
        return formData.interests.length >= 3;
      case 6:
        return formData.looking_for.length > 0;
      case 7:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        const { error } = await createProfile({
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          bio: formData.bio || null,
          city: formData.city || null,
          college: formData.college || null,
          interests: formData.interests,
          looking_for: formData.looking_for,
        });

        if (error) {
          toast({
            title: 'Error',
            description: 'Failed to create profile. Please try again.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome to BUD AI! 🌟',
            description: 'Your authentic dating journey begins now.',
          });
          navigate('/discover');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                <User className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Let's get started ✨</h2>
              <p className="text-muted-foreground">No fake vibes here</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your first name</Label>
                <Input
                  id="name"
                  placeholder="What should we call you?"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="border-2 border-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="18+"
                    min="18"
                    max="100"
                    value={formData.age}
                    onChange={(e) => updateFormData('age', e.target.value)}
                    className="border-2 border-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronouns</Label>
                  <Input
                    id="pronouns"
                    placeholder="they/them"
                    value={formData.pronouns}
                    onChange={(e) => updateFormData('pronouns', e.target.value)}
                    className="border-2 border-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="city"
                    placeholder="Where are you based?"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className="pl-12 border-2 border-foreground"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4 border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                <Heart className="w-10 h-10 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">I identify as...</h2>
              <p className="text-muted-foreground">Be your authentic self</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map((gender) => (
                <motion.button
                  key={gender.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => updateFormData('gender', gender.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.gender === gender.value
                      ? 'border-foreground bg-primary text-primary-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))]'
                      : 'border-border bg-card hover:border-foreground'
                  }`}
                >
                  <span className="font-bold">{gender.label}</span>
                </motion.button>
              ))}
            </div>

            <div className="space-y-2 pt-4">
              <Label htmlFor="bio">Your story (keep it real 💯)</Label>
              <Textarea
                id="bio"
                placeholder="What makes you, you? No cringe bios please..."
                value={formData.bio}
                onChange={(e) => updateFormData('bio', e.target.value)}
                className="resize-none h-24 border-2 border-foreground"
              />
            </div>
          </motion.div>
        );

      case 3:
        const filteredColleges = collegeSearch
          ? POPULAR_COLLEGES.filter(c => c.toLowerCase().includes(collegeSearch.toLowerCase()))
          : POPULAR_COLLEGES;
        
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4 border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                <GraduationCap className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Your University 🎓</h2>
              <p className="text-muted-foreground">Find people from your campus</p>
            </div>

            {isCollegeEmail && (
              <div className="p-4 rounded-xl bg-primary/10 border-2 border-primary/30">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">College email detected!</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  We detected you signed up with: <span className="font-mono">{userEmail}</span>
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="college">Search or type your college</Label>
                <Input
                  id="college"
                  placeholder="Type to search or enter custom..."
                  value={formData.college}
                  onChange={(e) => {
                    updateFormData('college', e.target.value);
                    setCollegeSearch(e.target.value);
                  }}
                  className="border-2 border-foreground"
                />
              </div>

              <div className="max-h-[180px] overflow-y-auto space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Popular colleges:</p>
                <div className="flex flex-wrap gap-2">
                  {filteredColleges.slice(0, 12).map((college) => (
                    <motion.button
                      key={college}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => updateFormData('college', college)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
                        formData.college === college
                          ? 'bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))]'
                          : 'bg-card border-border hover:border-foreground'
                      }`}
                    >
                      {college}
                    </motion.button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => updateFormData('college', '')}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Skip - I'd rather not share
              </button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-accent/30 flex items-center justify-center mx-auto mb-4 border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                <Zap className="w-10 h-10 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Today's vibe?</h2>
              <p className="text-muted-foreground">Match based on energy, not just looks</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {VIBES.map((vibe) => (
                <motion.button
                  key={vibe.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateFormData('vibeStatus', vibe.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    formData.vibeStatus === vibe.id
                      ? 'border-foreground bg-primary text-primary-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))]'
                      : 'border-border bg-card hover:border-foreground'
                  }`}
                >
                  <span className="text-2xl block mb-1">{vibe.emoji}</span>
                  <span className="text-xs font-medium">{vibe.label}</span>
                </motion.button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-muted/50 border-2 border-dashed border-muted-foreground/30">
              <p className="text-sm text-center text-muted-foreground">
                💡 Your vibe status changes who you match with. Update it daily!
              </p>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Your interests</h2>
              <p className="text-muted-foreground">Pick at least 3 that define you</p>
            </div>

            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
              {INTERESTS.map((interest) => (
                <motion.button
                  key={interest}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border-2 ${
                    formData.interests.includes(interest)
                      ? 'bg-primary text-primary-foreground border-foreground shadow-[2px_2px_0px_0px_hsl(var(--foreground))]'
                      : 'bg-card border-border hover:border-foreground'
                  }`}
                >
                  {interest}
                </motion.button>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {formData.interests.length}/3 minimum • {formData.interests.length} selected
            </p>
          </motion.div>
        );

      case 6:
        return (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4 border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                <Heart className="w-10 h-10 text-secondary" fill="currentColor" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Looking for...</h2>
              <p className="text-muted-foreground">Who do you want to meet?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map((gender) => (
                <motion.button
                  key={gender.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleLookingFor(gender.value)}
                  className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${
                    formData.looking_for.includes(gender.value)
                      ? 'border-foreground bg-secondary text-secondary-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))]'
                      : 'border-border bg-card hover:border-foreground'
                  }`}
                >
                  {formData.looking_for.includes(gender.value) && (
                    <Check className="w-4 h-4" />
                  )}
                  <span className="font-bold">{gender.label}</span>
                </motion.button>
              ))}
            </div>

            <div className="space-y-3 pt-4">
              <Label>Dating mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {DATING_MODES.map((mode) => (
                  <motion.button
                    key={mode.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateFormData('datingMode', mode.id)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.datingMode === mode.id
                        ? 'border-foreground bg-primary/10 shadow-[2px_2px_0px_0px_hsl(var(--foreground))]'
                        : 'border-border hover:border-foreground'
                    }`}
                  >
                    <mode.icon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-xs font-medium block">{mode.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4 border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]">
                <Shield className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Non-negotiables</h2>
              <p className="text-muted-foreground">Things you won't compromise on (max 5)</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {NON_NEGOTIABLES.map((item) => (
                <motion.button
                  key={item}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleNonNegotiable(item)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border-2 ${
                    formData.nonNegotiables.includes(item)
                      ? 'bg-destructive/10 text-destructive border-destructive shadow-[2px_2px_0px_0px_hsl(var(--destructive))]'
                      : 'bg-card border-border hover:border-destructive/50'
                  }`}
                >
                  {item}
                </motion.button>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-primary/10 border-2 border-primary/30">
              <p className="text-sm text-center">
                🛡️ Your safety matters. We'll help you find authentic connections.
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-center">
        <img src={logo} alt="IRIS" className="h-14 object-contain" />
      </div>

      {/* Progress Bar */}
      <div className="px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-all duration-300 border ${
                  i < step 
                    ? 'bg-primary border-foreground' 
                    : 'bg-muted border-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center font-medium">
            Step {step} of {totalSteps}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl p-6 border-2 border-foreground shadow-[6px_6px_0px_0px_hsl(var(--foreground))]">
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center gap-4 mt-8">
              {step > 1 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 border-2 border-foreground"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
              )}
              <Button
                variant="hero"
                size="lg"
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : step === totalSteps ? (
                  <>
                    Let's go! 🚀
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
