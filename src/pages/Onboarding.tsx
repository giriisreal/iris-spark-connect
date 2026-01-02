import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Heart, User, MapPin, Sparkles, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react';

const INTERESTS = [
  'Travel', 'Music', 'Movies', 'Gaming', 'Fitness', 'Cooking',
  'Art', 'Photography', 'Reading', 'Dancing', 'Sports', 'Nature',
  'Technology', 'Fashion', 'Food', 'Yoga', 'Hiking', 'Coffee'
];

const GENDERS = [
  { value: 'male', label: 'Man' },
  { value: 'female', label: 'Woman' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    bio: '',
    city: '',
    interests: [] as string[],
    looking_for: [] as string[],
  });
  
  const { createProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 4;

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

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length >= 2 && formData.age && parseInt(formData.age) >= 18;
      case 2:
        return formData.gender !== '';
      case 3:
        return formData.interests.length >= 3;
      case 4:
        return formData.looking_for.length > 0;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      setLoading(true);
      try {
        const { error } = await createProfile({
          name: formData.name,
          age: parseInt(formData.age),
          gender: formData.gender,
          bio: formData.bio || null,
          city: formData.city || null,
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
            title: 'Profile Created! 🎉',
            description: 'Welcome to IRIS. Start discovering matches!',
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground mx-auto mb-4">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Let's get started</h2>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your first name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Your age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="Enter your age"
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={(e) => updateFormData('age', e.target.value)}
                />
                {formData.age && parseInt(formData.age) < 18 && (
                  <p className="text-sm text-destructive">You must be 18 or older</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City (optional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="city"
                    placeholder="Where are you located?"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className="pl-12"
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-secondary flex items-center justify-center text-secondary-foreground mx-auto mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">I am a...</h2>
              <p className="text-muted-foreground">Select your gender identity</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map((gender) => (
                <button
                  key={gender.value}
                  onClick={() => updateFormData('gender', gender.value)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                    formData.gender === gender.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <span className="font-medium">{gender.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-4">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                placeholder="Tell potential matches a bit about yourself..."
                value={formData.bio}
                onChange={(e) => updateFormData('bio', e.target.value)}
                className="resize-none h-24"
              />
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground mx-auto mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Your interests</h2>
              <p className="text-muted-foreground">Select at least 3 interests</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    formData.interests.includes(interest)
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {formData.interests.length}/3 minimum selected
            </p>
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-secondary flex items-center justify-center text-secondary-foreground mx-auto mb-4">
                <Heart className="w-8 h-8" fill="currentColor" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Looking for...</h2>
              <p className="text-muted-foreground">Who would you like to meet?</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {GENDERS.map((gender) => (
                <button
                  key={gender.value}
                  onClick={() => toggleLookingFor(gender.value)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
                    formData.looking_for.includes(gender.value)
                      ? 'border-secondary bg-secondary/10 text-secondary'
                      : 'border-border bg-card hover:border-secondary/50'
                  }`}
                >
                  {formData.looking_for.includes(gender.value) && (
                    <Check className="w-4 h-4" />
                  )}
                  <span className="font-medium">{gender.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Progress Bar */}
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Step {step} of {totalSteps}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-3xl shadow-elevated p-8 border border-border">
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
                  className="flex-1"
                >
                  <ArrowLeft className="w-5 h-5" />
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
                    Complete
                    <Check className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
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
