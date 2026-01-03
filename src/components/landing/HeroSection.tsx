import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Shield, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/logo.png';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-background">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.3) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container relative mx-auto px-4 py-8">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img
              src={logo}
              alt="IRIS"
              className="w-12 h-12 object-contain"
            />
            <span className="text-2xl font-bold text-foreground">
              
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link to="/auth">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="sm">
                Get Started
              </Button>
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
            Find Your Match.
            <br className="hidden sm:block" />
            Swipe Smart.
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
            A modern dating platform powered by AI to find meaningful
            connections. Smart matching, real conversations, genuine
            people.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/auth?mode=signup">
              <Button variant="hero" size="lg">
                Start for free
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="heroSecondary" size="lg">
                Book a Demo
              </Button>
            </Link>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-sm text-muted-foreground"
          >
            <div className="flex items-center justify-center gap-8 flex-wrap opacity-60">
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
      </div>
    </section>
  );
};

export default HeroSection;
