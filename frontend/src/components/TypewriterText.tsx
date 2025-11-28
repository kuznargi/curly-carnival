import { useTypewriter } from '@/hooks/useTypewriter';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

export const TypewriterText = ({ text, speed = 20, onComplete, className = '' }: TypewriterTextProps) => {
  const { displayedText, isTyping, skipAnimation } = useTypewriter({ text, speed, onComplete });

  return (
    <div onClick={skipAnimation} className={`cursor-pointer ${className}`}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-0.5 h-5 bg-foreground ml-1 animate-blink">|</span>
      )}
    </div>
  );
};
