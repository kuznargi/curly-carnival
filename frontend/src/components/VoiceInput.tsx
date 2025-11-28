// src/components/VoiceInput.tsx
import { Mic, MicOff } from 'lucide-react';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { useEffect, useRef } from 'react';

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  onRecordingChange?: (isRecording: boolean) => void;
}

export const VoiceInput = ({ onTranscript, onRecordingChange }: VoiceInputProps) => {
  const {
    isRecording,
    transcript,
    recordingTime,
    liveTranscript,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
    isMicDenied,
  } = useVoiceRecognition();

  const hasSentRef = useRef(false); // ← запоминаем, что уже отправили

// Реал-тайм обновление инпута
  useEffect(() => {
    if (isRecording && liveTranscript) {
      onTranscript(liveTranscript);
    }
  }, [liveTranscript, isRecording, onTranscript]);

  // Отправляем транскрипт ТОЛЬКО когда запись закончилась и мы ещё не отправляли
  useEffect(() => {
    if (!isRecording && transcript && !hasSentRef.current) {
      onTranscript(transcript);
      hasSentRef.current = true; // больше не будем отправлять этот же текст
    }
  }, [isRecording, transcript, onTranscript]);

  // Сброс флага, когда начинаем новую запись
  useEffect(() => {
    if (isRecording) {
      hasSentRef.current = false;
      resetTranscript(); // очищаем предыдущий результат
    }
  }, [isRecording, resetTranscript]);

  useEffect(() => {
    onRecordingChange?.(isRecording);
  }, [isRecording, onRecordingChange]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const toggle = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={!isSupported || isMicDenied}
        className={`
          relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
          ${isRecording
            ? 'bg-red-500 text-white animate-pulse shadow-red-500/50'
            : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:scale-110'
          }
          ${(!isSupported || isMicDenied) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
      </button>

      {isRecording && (
        <>
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-black/90 text-white px-4 py-2 rounded-full text-sm font-medium">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              {formatTime(recordingTime)}
            </span>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-white/80 rounded-full animate-sound-wave"
                  style={{
                    animationDelay: `${i * 80}ms`,
                    height: `${8 + i * 4}px`,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};