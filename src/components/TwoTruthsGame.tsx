import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gamepad2, Send, Trophy, Clock, Loader2, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TwoTruthsGameProps {
  matchId: string;
  profileId: string;
  otherProfileName: string;
  onClose: () => void;
}

interface GameSession {
  id: string;
  current_round: number;
  max_rounds: number;
  player1_score: number;
  player2_score: number;
  current_question: any;
  player1_answer: string | null;
  player2_answer: string | null;
  status: string;
}

const TwoTruthsGame = ({ matchId, profileId, otherProfileName, onClose }: TwoTruthsGameProps) => {
  const [gameSession, setGameSession] = useState<GameSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statements, setStatements] = useState(['', '', '']);
  const [lieIndex, setLieIndex] = useState<number | null>(null);
  const [selectedGuess, setSelectedGuess] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch or create game session
  useEffect(() => {
    const fetchOrCreateGame = async () => {
      setLoading(true);
      
      // Check for existing active game
      const { data: existingGame } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('match_id', matchId)
        .eq('game_type', 'two_truths')
        .in('status', ['waiting', 'playing'])
        .maybeSingle();

      if (existingGame) {
        setGameSession(existingGame as GameSession);
      } else {
        // Create new game
        const { data: newGame, error } = await supabase
          .from('game_sessions')
          .insert({
            match_id: matchId,
            game_type: 'two_truths',
            max_rounds: 3,
            status: 'waiting',
          })
          .select()
          .single();

        if (!error && newGame) {
          setGameSession(newGame as GameSession);
        }
      }
      
      setLoading(false);
    };

    fetchOrCreateGame();
  }, [matchId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!gameSession?.id) return;

    const channel = supabase
      .channel(`game-${gameSession.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `id=eq.${gameSession.id}`,
        },
        (payload) => {
          setGameSession(payload.new as GameSession);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameSession?.id]);

  const submitStatements = async () => {
    if (statements.some(s => !s.trim()) || lieIndex === null) {
      toast({
        title: 'Complete all fields',
        description: 'Please enter all statements and mark which one is the lie',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const question = {
      statements,
      lieIndex,
      submittedBy: profileId,
    };

    const { error } = await supabase
      .from('game_sessions')
      .update({
        current_question: question,
        status: 'playing',
      })
      .eq('id', gameSession?.id);

    if (!error) {
      toast({
        title: 'Statements submitted!',
        description: `Waiting for ${otherProfileName} to guess...`,
      });
    }

    setSubmitting(false);
  };

  const submitGuess = async () => {
    if (selectedGuess === null || !gameSession) return;

    setSubmitting(true);

    const isCorrect = selectedGuess === gameSession.current_question?.lieIndex;
    
    // Update scores based on whose turn it is
    const isPlayer1 = gameSession.current_question?.submittedBy !== profileId;
    const scoreUpdate = isPlayer1 
      ? { player1_score: gameSession.player1_score + (isCorrect ? 1 : 0) }
      : { player2_score: gameSession.player2_score + (isCorrect ? 1 : 0) };

    const newRound = gameSession.current_round + 1;
    const isGameOver = newRound > gameSession.max_rounds;

    await supabase
      .from('game_sessions')
      .update({
        ...scoreUpdate,
        current_round: newRound,
        current_question: null,
        player1_answer: null,
        player2_answer: null,
        status: isGameOver ? 'completed' : 'waiting',
      })
      .eq('id', gameSession.id);

    toast({
      title: isCorrect ? 'Correct! 🎉' : 'Wrong guess!',
      description: isCorrect 
        ? 'You spotted the lie!' 
        : `The lie was: "${gameSession.current_question?.statements[gameSession.current_question?.lieIndex]}"`,
    });

    setSelectedGuess(null);
    setStatements(['', '', '']);
    setLieIndex(null);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-card p-8 rounded-xl border-2 border-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  const isMyTurnToSubmit = !gameSession?.current_question || 
    gameSession.current_question.submittedBy === profileId;
  const isMyTurnToGuess = gameSession?.current_question && 
    gameSession.current_question.submittedBy !== profileId;
  const isGameOver = gameSession?.status === 'completed';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-card rounded-2xl border-2 border-foreground shadow-[6px_6px_0px_0px_hsl(var(--foreground))] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-foreground bg-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-foreground">Two Truths & A Lie</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Board */}
        <div className="p-4 bg-muted/30 flex items-center justify-around text-center">
          <div>
            <p className="text-sm text-muted-foreground">You</p>
            <p className="text-2xl font-bold text-primary">
              {gameSession?.player1_score || 0}
            </p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              Round {Math.min(gameSession?.current_round || 1, gameSession?.max_rounds || 3)}/{gameSession?.max_rounds || 3}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{otherProfileName}</p>
            <p className="text-2xl font-bold text-accent">
              {gameSession?.player2_score || 0}
            </p>
          </div>
        </div>

        {/* Game Content */}
        <div className="p-6">
          {isGameOver ? (
            <div className="text-center space-y-4">
              <Trophy className="w-16 h-16 mx-auto text-secondary" />
              <h3 className="text-xl font-bold">Game Over!</h3>
              <p className="text-muted-foreground">
                {(gameSession?.player1_score || 0) > (gameSession?.player2_score || 0)
                  ? 'You won! 🎉'
                  : (gameSession?.player1_score || 0) < (gameSession?.player2_score || 0)
                    ? `${otherProfileName} won!`
                    : "It's a tie!"}
              </p>
              <Button variant="hero" onClick={onClose}>
                Close Game
              </Button>
            </div>
          ) : isMyTurnToGuess ? (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Guess which statement is the lie!
              </p>
              {gameSession?.current_question?.statements.map((statement: string, idx: number) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedGuess(idx)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    selectedGuess === idx
                      ? 'border-destructive bg-destructive/10'
                      : 'border-foreground hover:border-primary'
                  }`}
                >
                  <span className="text-sm">{idx + 1}. {statement}</span>
                </motion.button>
              ))}
              <Button
                variant="hero"
                className="w-full"
                onClick={submitGuess}
                disabled={selectedGuess === null || submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit Guess
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-muted-foreground">
                Enter two truths and one lie about yourself!
              </p>
              {statements.map((statement, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={statement}
                    onChange={(e) => {
                      const newStatements = [...statements];
                      newStatements[idx] = e.target.value;
                      setStatements(newStatements);
                    }}
                    placeholder={`Statement ${idx + 1}`}
                    className="flex-1 border-2 border-foreground"
                  />
                  <Button
                    variant={lieIndex === idx ? 'destructive' : 'retro'}
                    size="icon"
                    onClick={() => setLieIndex(idx)}
                    title="Mark as lie"
                  >
                    🤥
                  </Button>
                </div>
              ))}
              <p className="text-xs text-center text-muted-foreground">
                Click 🤥 to mark which statement is the lie
              </p>
              <Button
                variant="hero"
                className="w-full"
                onClick={submitStatements}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Statements
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TwoTruthsGame;
