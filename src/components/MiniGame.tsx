import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gamepad2, X, CheckCircle, ArrowRight } from 'lucide-react';

interface MiniGameProps {
  gameType: 'would_you_rather' | 'two_truths' | 'emoji_story';
  onComplete: (answers: any, compatibilityBonus: number) => void;
  onClose: () => void;
  otherPlayerAnswers?: any;
}

const wouldYouRatherQuestions = [
  { a: 'Netflix and chill', b: 'Spontaneous road trip' },
  { a: 'Text all day', b: 'One long call' },
  { a: 'First date: coffee', b: 'First date: adventure' },
  { a: 'Morning person', b: 'Night owl' },
  { a: 'Plan everything', b: 'Go with the flow' },
];

const twoTruthsPrompt = "Share 2 truths and 1 lie about yourself. Let them guess!";

const emojiStories = [
  { emojis: '☕️📱💬😊🌅', hint: 'Morning routine' },
  { emojis: '🎵🎧🚶‍♂️🌆✨', hint: 'Perfect evening' },
  { emojis: '🍕🎬🛋️❤️😴', hint: 'Ideal date night' },
];

const MiniGame = ({ gameType, onComplete, onClose, otherPlayerAnswers }: MiniGameProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (answer: any) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (gameType === 'would_you_rather' && currentQuestion < wouldYouRatherQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Calculate compatibility bonus
      let bonus = 0;
      if (otherPlayerAnswers) {
        const matches = newAnswers.filter((a, i) => a === otherPlayerAnswers[i]).length;
        bonus = Math.round((matches / newAnswers.length) * 20);
      } else {
        bonus = Math.floor(Math.random() * 10) + 5;
      }
      setShowResults(true);
      setTimeout(() => onComplete(newAnswers, bonus), 2000);
    }
  };

  const renderWouldYouRather = () => {
    const question = wouldYouRatherQuestions[currentQuestion];
    return (
      <div className="space-y-6">
        <div className="text-center">
          <span className="text-4xl mb-4 block">🤔</span>
          <h3 className="text-xl font-bold text-foreground">Would You Rather...</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Question {currentQuestion + 1} of {wouldYouRatherQuestions.length}
          </p>
        </div>
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAnswer('a')}
            className="w-full p-4 rounded-xl border-2 border-foreground bg-primary/10 hover:bg-primary/20 text-left font-medium transition-colors"
          >
            {question.a}
          </motion.button>
          <div className="text-center text-muted-foreground font-bold">OR</div>
          <motion.button
            whileHover={{ scale: 1.02, x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAnswer('b')}
            className="w-full p-4 rounded-xl border-2 border-foreground bg-secondary/10 hover:bg-secondary/20 text-left font-medium transition-colors"
          >
            {question.b}
          </motion.button>
        </div>
      </div>
    );
  };

  const renderEmojiStory = () => {
    const story = emojiStories[currentQuestion];
    return (
      <div className="space-y-6 text-center">
        <span className="text-4xl mb-4 block">📖</span>
        <h3 className="text-xl font-bold text-foreground">Guess the Story!</h3>
        <div className="text-5xl tracking-widest py-6 bg-muted/50 rounded-xl">
          {story.emojis}
        </div>
        <p className="text-sm text-muted-foreground">Hint: {story.hint}</p>
        <textarea
          placeholder="What story do these emojis tell?"
          className="w-full p-4 rounded-xl border-2 border-foreground bg-background resize-none"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAnswer((e.target as HTMLTextAreaElement).value);
            }
          }}
        />
        <Button 
          onClick={() => handleAnswer('submitted')} 
          className="w-full"
          variant="hero"
        >
          Submit <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    );
  };

  if (showResults) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center space-y-4"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5 }}
          className="text-6xl"
        >
          🎉
        </motion.div>
        <h3 className="text-2xl font-bold text-foreground">Game Complete!</h3>
        <p className="text-muted-foreground">Calculating compatibility bonus...</p>
        <div className="flex items-center justify-center gap-2 text-primary font-bold">
          <CheckCircle className="w-5 h-5" />
          <span>+{Math.floor(Math.random() * 10) + 5}% compatibility!</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-card rounded-2xl border-2 border-foreground shadow-[6px_6px_0px_0px_hsl(var(--foreground))] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm uppercase tracking-wide">Mini Game</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {gameType === 'would_you_rather' && renderWouldYouRather()}
        {gameType === 'emoji_story' && renderEmojiStory()}
      </motion.div>
    </motion.div>
  );
};

export default MiniGame;
