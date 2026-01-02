import { motion } from 'framer-motion';
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useEffect, useRef } from 'react';

interface VoiceRecorderProps {
  userId: string | undefined;
  onUploadComplete: (url: string) => void;
  existingUrl?: string | null;
}

const VoiceRecorder = ({ userId, onUploadComplete, existingUrl }: VoiceRecorderProps) => {
  const {
    isRecording,
    isPaused,
    duration,
    audioUrl,
    uploading,
    maxDuration,
    startRecording,
    stopRecording,
    pauseRecording,
    resetRecording,
    uploadVoiceIntro,
  } = useVoiceRecording(userId);

  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    const url = await uploadVoiceIntro();
    if (url) {
      onUploadComplete(url);
      resetRecording();
    }
  };

  const progressPercentage = (duration / maxDuration) * 100;

  return (
    <div className="bg-card rounded-xl border-2 border-foreground shadow-[4px_4px_0px_0px_hsl(var(--foreground))] p-6 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Mic className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-foreground">Voice Intro</h3>
        <span className="text-xs text-muted-foreground">(30 sec max)</span>
      </div>

      {existingUrl && !audioUrl && !isRecording && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Your current voice intro:</p>
          <audio 
            src={existingUrl} 
            controls 
            className="w-full h-10"
          />
          <Button 
            variant="retro" 
            size="sm" 
            onClick={startRecording}
            className="w-full"
          >
            <Mic className="w-4 h-4 mr-2" />
            Record New Intro
          </Button>
        </div>
      )}

      {!existingUrl && !audioUrl && !isRecording && (
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center">
            <Mic className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Record a 30-second voice intro to stand out!
          </p>
          <Button variant="hero" onClick={startRecording}>
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
        </div>
      )}

      {isRecording && (
        <div className="space-y-4">
          <motion.div 
            className="flex items-center justify-center gap-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              animate={{ scale: isPaused ? 1 : [1, 1.2, 1] }}
              transition={{ repeat: isPaused ? 0 : Infinity, duration: 1 }}
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isPaused ? 'bg-muted' : 'bg-destructive'
              }`}
            >
              <Mic className="w-8 h-8 text-white" />
            </motion.div>
          </motion.div>

          <div className="text-center">
            <span className="text-2xl font-bold text-foreground">
              {formatTime(duration)}
            </span>
            <span className="text-muted-foreground"> / {formatTime(maxDuration)}</span>
          </div>

          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              animate={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button
              variant="retro"
              size="icon"
              onClick={pauseRecording}
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={stopRecording}
              className="gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </Button>
          </div>
        </div>
      )}

      {audioUrl && !isRecording && (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Preview your recording:</p>
          </div>
          
          <audio 
            ref={audioRef}
            src={audioUrl} 
            controls 
            className="w-full h-10"
          />

          <div className="flex gap-3">
            <Button
              variant="retro"
              className="flex-1"
              onClick={resetRecording}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Re-record
            </Button>
            <Button
              variant="hero"
              className="flex-1"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : 'Save Intro'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
