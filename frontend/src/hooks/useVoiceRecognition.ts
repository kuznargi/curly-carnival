// src/hooks/useVoiceRecognition.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseVoiceRecognitionReturn {
  isRecording: boolean;
  transcript: string;           // финальный текст (после остановки)
  liveTranscript: string;       // ← реал-тайм текст (обновляется по словам)
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  isMicDenied: boolean;
}

export const useVoiceRecognition = (): UseVoiceRecognitionReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveTranscript, setLiveTranscript] = useState(''); // ← реал-тайм
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [isMicDenied, setIsMicDenied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ru-RU';

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0].transcript.trim();

        if (res.isFinal) {
          final += text + ' ';
        } else {
          interim += text;
        }
      }

      // ← Это главное: обновляем live-транскрипт мгновенно
      const fullLive = (transcript + final + interim).trim();
      setLiveTranscript(fullLive);

      // Сохраняем финальные части в основной transcript
      if (final) {
        setTranscript(prev => (prev + final).trim());
      }

      // Автостоп после 3 секунд тишины
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (isRecording && final) {
          stopRecording();
        }
      }, 3000);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setIsMicDenied(true);
        toast.error('Нет доступа к микрофону', {
          description: 'Разрешите доступ в настройках браузера',
        });
      }
      stopRecording();
    };

    recognition.onend = () => {
      if (isRecording) {
        setTimeout(() => {
          if (isRecording) recognition.start();
        }, 100);
      }
    };

    recognitionRef.current = recognition;
  }, [isRecording, transcript]);

  const startRecording = useCallback(async () => {
    if (!isSupported || !recognitionRef.current) return;

    setIsRecording(true);
    setTranscript('');
    setLiveTranscript('');
    setRecordingTime(0);
    setIsMicDenied(false);

    try {
      recognitionRef.current.start();

      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);

      // Автостоп через 60 сек
      setTimeout(() => {
        if (isRecording) {
          toast.info('Запись остановлена (макс. 60 сек)');
          stopRecording();
        }
      }, 60000);
    } catch (err: any) {
      setIsMicDenied(true);
      toast.error('Микрофон заблокирован');
      setIsRecording(false);
    }
  }, [isSupported]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    setIsRecording(false);
    recognitionRef.current?.stop();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, [isRecording]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setLiveTranscript('');
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  return {
    isRecording,
    transcript: transcript.trim(),
    liveTranscript: liveTranscript.trim(),
    recordingTime,
    startRecording,
    stopRecording,
    resetTranscript,
    isSupported,
    isMicDenied,
  };
};