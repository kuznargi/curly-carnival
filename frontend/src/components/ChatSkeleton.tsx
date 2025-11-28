export const ChatSkeleton = () => {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="flex gap-4 animate-fade-in"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 animate-pulse">
            <div className="absolute inset-1 rounded-full bg-muted animate-shimmer" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg w-3/4 animate-shimmer" 
                 style={{ backgroundSize: '200% 100%' }} />
            <div className="h-4 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg w-full animate-shimmer" 
                 style={{ backgroundSize: '200% 100%', animationDelay: '0.1s' }} />
            <div className="h-4 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg w-5/6 animate-shimmer" 
                 style={{ backgroundSize: '200% 100%', animationDelay: '0.2s' }} />
          </div>
        </div>
      ))}
    </div>
  );
};
