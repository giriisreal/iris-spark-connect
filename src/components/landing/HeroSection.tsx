import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, MessageCircle, Shield, ArrowRight, Zap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container relative mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img src={logo} alt="IRIS" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold text-foreground">IRIS</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="sm">Get Started</Button>
            </Link>
          </motion.div>
        </nav>

        {/* Hero Content */}
        <div className="max-w-4xl mx-auto text-center pt-12">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium mb-8 border-2 border-foreground shadow-[3px_3px_0px_0px_hsl(var(--foreground))]"
          >
            <Sparkles className="w-4 h-4" />
            New: AI-Powered Matchmaking
            <ArrowRight className="w-4 h-4" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
          >
            Find Your Match.{' '}
            <br className="hidden sm:block" />
            Swipe Smart.{' '}
            <span className="inline-block px-4 py-1 border-2 border-dashed border-primary text-primary rounded-lg mt-2">
              Start Free.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            A modern dating platform powered by AI to find meaningful connections. 
            Smart matching, real conversations, genuine people.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="lg" className="w-full sm:w-auto">
                Start for free
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="heroSecondary" size="lg" className="w-full sm:w-auto">
                Book a Demo
              </Button>
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-sm text-muted-foreground"
          >
            <p className="mb-6">Trusted by thousands of happy couples</p>
            <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Users className="w-5 h-5" />
                2M+ Users
              </div>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Heart className="w-5 h-5" />
                500K+ Matches
              </div>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Zap className="w-5 h-5" />
                AI-Powered
              </div>
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Shield className="w-5 h-5" />
                Verified
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid md:grid-cols-3 gap-6 mt-24"
        >
          <FeatureCard
            icon={<Heart className="w-6 h-6" />}
            title="AI Matchmaking"
            description="Smart algorithms analyze compatibility to find your perfect match."
            highlight
          />
          <FeatureCard
            icon={<MessageCircle className="w-6 h-6" />}
            title="AI Chat Suggestions"
            description="Get intelligent conversation starters and message ideas."
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Safe & Secure"
            description="All profiles verified. Your privacy is our top priority."
          />
        </motion.div>

        {/* App Preview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-24 flex justify-center gap-4"
        >
          <div className="w-48 h-80 rounded-2xl bg-card border-2 border-foreground shadow-[6px_6px_0px_0px_hsl(var(--foreground))] overflow-hidden -rotate-6">
            <div className="h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-end p-4">
              <div>
                <p className="font-bold text-foreground">Sarah, 26</p>
                <p className="text-sm text-muted-foreground">2 miles away</p>
              </div>
            </div>
          </div>
          <div className="w-52 h-88 rounded-2xl bg-card border-2 border-foreground shadow-[6px_6px_0px_0px_hsl(var(--foreground))] overflow-hidden z-10">
            <div className="p-3 bg-primary text-primary-foreground flex items-center justify-between border-b-2 border-foreground">
              <span className="text-sm font-medium">DISCOVER</span>
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="h-64 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-end p-4">
              <div>
                <p className="font-bold text-foreground text-lg">Emma, 28</p>
                <p className="text-sm text-muted-foreground">98% Match</p>
              </div>
            </div>
            <div className="p-4 flex justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-destructive/20 border-2 border-foreground flex items-center justify-center">
                <span className="text-destructive text-lg">✕</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-success/20 border-2 border-foreground flex items-center justify-center">
                <Heart className="w-5 h-5 text-success" />
              </div>
            </div>
          </div>
          <div className="w-48 h-80 rounded-2xl bg-card border-2 border-foreground shadow-[6px_6px_0px_0px_hsl(var(--foreground))] overflow-hidden rotate-6">
            <div className="h-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-end p-4">
              <div>
                <p className="font-bold text-foreground">Mike, 29</p>
                <p className="text-sm text-muted-foreground">5 miles away</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description,
  highlight = false 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  highlight?: boolean;
}) => (
  <div className={`p-6 rounded-xl border-2 border-foreground ${highlight ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))]' : 'bg-card shadow-[4px_4px_0px_0px_hsl(var(--foreground))]'}`}>
    <div className={`w-12 h-12 rounded-lg border-2 ${highlight ? 'border-primary-foreground bg-primary-foreground/20' : 'border-foreground bg-secondary'} flex items-center justify-center mb-4`}>
      {icon}
    </div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className={`text-sm ${highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{description}</p>
  </div>
);

export default HeroSection;
