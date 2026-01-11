import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription, FREE_LIMITS } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Crown, 
  Check, 
  X, 
  ArrowLeft, 
  Sparkles, 
  Heart, 
  MessageCircle, 
  Users, 
  Zap,
  Shield,
  Loader2
} from 'lucide-react';
import logo from '@/assets/logo.png';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const Premium = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, loading, refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const [processingPayment, setProcessingPayment] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setProcessingPayment(true);

    try {
      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to continue');
      }

      // Create order
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error || !data) {
        throw new Error(error?.message || 'Failed to create order');
      }

      // Open Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'Bud AI',
        description: 'Lifetime Premium Membership',
        image: logo,
        order_id: data.orderId,
        prefill: {
          name: data.profileName,
          email: data.userEmail,
        },
        theme: {
          color: '#7a8a3c',
        },
        handler: async (response: any) => {
          // Verify payment
          const { error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              profile_id: data.profileId,
            },
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (verifyError) {
            throw new Error('Payment verification failed');
          }

          toast({
            title: "Welcome to Premium! 🎉",
            description: "You now have unlimited access to all features!",
          });

          await refreshSubscription();
          setProcessingPayment(false);
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      setProcessingPayment(false);
    }
  };

  const freeFeatures = [
    { text: `${FREE_LIMITS.MATCHES_PER_DAY} curated matches per day`, included: true },
    { text: 'Basic profile creation', included: true },
    { text: 'Text chat after mutual match', included: true },
    { text: `${FREE_LIMITS.OPENERS_PER_DAY} openers per day`, included: true },
    { text: `${FREE_LIMITS.AI_PROMPTS_PER_DAY} AI prompts per day`, included: true },
    { text: `Join ${FREE_LIMITS.MAX_COMMUNITIES} community`, included: true },
    { text: 'Block & report', included: true },
    { text: 'Unlimited matches', included: false },
    { text: 'Unlimited AI insights', included: false },
    { text: 'See "why this match"', included: false },
    { text: 'Join unlimited communities', included: false },
  ];

  const premiumFeatures = [
    { text: 'Unlimited curated matches', icon: Heart },
    { text: 'Unlimited AI prompts & insights', icon: Sparkles },
    { text: 'Unlimited openers & messages', icon: MessageCircle },
    { text: 'Join unlimited communities', icon: Users },
    { text: 'Deep "why this match" analysis', icon: Zap },
    { text: 'Priority support', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-background p-4">
        <nav className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Premium</h1>
        </nav>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-auto text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
            <Crown className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">You're Premium! 👑</h2>
          <p className="text-muted-foreground mb-6">
            Enjoy unlimited access to all Bud AI features.
          </p>
          <div className="space-y-3">
            {premiumFeatures.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-left p-3 bg-card rounded-lg border">
                <feature.icon className="w-5 h-5 text-primary" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="p-4 flex items-center gap-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold">Premium</h1>
      </nav>

      <div className="p-4 max-w-4xl mx-auto">
        {/* Hero */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
            <Crown className="w-10 h-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Unlock Bud AI Premium</h2>
          <p className="text-muted-foreground">
            Get unlimited access to all features for a one-time payment
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Free Plan */}
          <Card className="border-2">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-1">Explore</h3>
              <p className="text-muted-foreground text-sm mb-4">Free forever</p>
              <p className="text-3xl font-bold mb-6">₹0</p>
              <div className="space-y-3">
                {freeFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={feature.included ? '' : 'text-muted-foreground'}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-medium rounded-bl-lg">
              BEST VALUE
            </div>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-1">Premium</h3>
              <p className="text-muted-foreground text-sm mb-4">Lifetime access</p>
              <p className="text-3xl font-bold mb-6">
                ₹2,000
                <span className="text-sm font-normal text-muted-foreground ml-2">one-time</span>
              </p>
              <div className="space-y-3 mb-6">
                {premiumFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <feature.icon className="w-4 h-4 text-primary" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handlePurchase}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Get Premium
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Trust badges */}
        <div className="text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Secure payment powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
};

export default Premium;
