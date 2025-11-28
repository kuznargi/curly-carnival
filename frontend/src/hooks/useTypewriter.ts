import { useState, useEffect } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export const useTypewriter = ({ text, speed = 40, onComplete }: UseTypewriterOptions) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const currentChar = text[currentIndex];
      let delay = speed;

      // Add pauses for punctuation
      if (currentChar === '.') delay += 200;
      else if (currentChar === ',') delay += 100;
      else if (currentChar === '\n') delay += 300;

      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + currentChar);
        setCurrentIndex(prev => prev + 1);
      }, delay);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && isTyping) {
      setIsTyping(false);
      onComplete?.();
    }
  }, [currentIndex, text, speed, isTyping, onComplete]);

  const skipAnimation = () => {
    setDisplayedText(text);
    setCurrentIndex(text.length);
    setIsTyping(false);
    onComplete?.();
  };

  return { displayedText, isTyping, skipAnimation };
};
