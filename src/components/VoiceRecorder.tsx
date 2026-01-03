import { motion } from 'framer-motion';
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useEffect, useRef, useState } from 'react';

interface VoiceRecorderProps {
  userId: string | undefined;
  onUploadComplete: (url: string) => void;
  existingUrl?: string | null;
}

// Waveform visualization component
const WaveformBars = ({ isAnimating = false }: { isAnimating?: boolean }) => {
  const bars = 35;
  return (
    <div className="flex items-center justify-center gap-[2px] h-8">
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = Math.sin((i / bars) * Math.PI * 2) * 0.5 + 0.5;
        const height = 4 + baseHeight * 24;
        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-full bg-white"
            initial={{ height: height }}
            animate={isAnimating ? {
              height: [height * 0.4, height, height * 0.6, height * 0.9, height * 0.4],
            } : { height: height }}
            transition={isAnimating ? {
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.02,
              ease: "easeInOut"
            } : {}}
          />
        );
      })}
    </div>
  );
};

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
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUpload = async () => {
    const url = await uploadVoiceIntro();
    if (url) {
      onUploadComplete(url);
      resetRecording();
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
    }
  }, [audioUrl, existingUrl]);

  // Pill-style audio player component (yellow theme)
  const AudioPill = ({ src, showUpload = false }: { src: string; showUpload?: boolean }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-3 bg-[#F4C430] rounded-full px-4 py-3 shadow-lg">
        {/* Play button */}
        <button
          onClick={togglePlayback}
          className="w-10 h-10 rounded-full bg-[#3D3D3D]/80 flex items-center justify-center flex-shrink-0 hover:bg-[#3D3D3D] transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>

        {/* Waveform */}
        <div className="flex-1">
          <WaveformBars isAnimating={isPlaying} />
        </div>

        {/* Duration */}
        <span className="text-sm font-medium text-white min-w-[40px] text-right">
          {formatTime(duration || 30)}
        </span>

        <audio ref={audioRef} src={src} className="hidden" />
      </div>

      {showUpload && (
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
      )}
    </div>
  );

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
          <AudioPill src={existingUrl} />
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
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#F4C430]/20 border-2 border-dashed border-[#F4C430] flex items-center justify-center">
            <Mic className="w-8 h-8 text-[#F4C430]" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Record a 30-second voice intro to stand out!
          </p>
          <Button variant="hero" onClick={startRecording} className="bg-[#F4C430] hover:bg-[#E0B42A] text-black">
            <Mic className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
        </div>
      )}

      {isRecording && (
        <div className="space-y-4">
          {/* Recording pill */}
          <div className="flex items-center gap-3 bg-[#F4C430] rounded-full px-4 py-3 shadow-lg">
            {/* Recording indicator */}
            <motion.div
              animate={{ scale: isPaused ? 1 : [1, 1.2, 1], opacity: isPaused ? 0.5 : 1 }}
              transition={{ repeat: isPaused ? 0 : Infinity, duration: 1 }}
              className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0"
            >
              <Mic className="w-5 h-5 text-white" />
            </motion.div>

            {/* Animated waveform */}
            <div className="flex-1">
              <WaveformBars isAnimating={!isPaused} />
            </div>

            {/* Duration */}
            <span className="text-sm font-medium text-white min-w-[40px] text-right">
              {formatTime(duration)}
            </span>
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
          <AudioPill src={audioUrl} showUpload />
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
