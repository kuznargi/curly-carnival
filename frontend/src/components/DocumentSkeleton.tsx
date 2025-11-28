export const DocumentSkeleton = () => {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-4 animate-fade-in">
        <div className="h-10 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg w-3/5 animate-shimmer" 
             style={{ backgroundSize: '200% 100%' }} />
        <div className="h-5 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg w-1/3 animate-shimmer" 
             style={{ backgroundSize: '200% 100%', animationDelay: '0.1s' }} />
      </div>

      {/* Sections */}
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="space-y-4 animate-fade-in"
          style={{ animationDelay: `${i * 0.15}s` }}
        >
          <div className="h-8 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg w-1/4 animate-shimmer" 
               style={{ backgroundSize: '200% 100%' }} />
          <div className="space-y-3">
            <div className="h-4 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg w-full animate-shimmer" 
                 style={{ backgroundSize: '200% 100%', animationDelay: '0.1s' }} />
            <div className="h-4 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg w-5/6 animate-shimmer" 
                 style={{ backgroundSize: '200% 100%', animationDelay: '0.2s' }} />
            <div className="h-4 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg w-4/5 animate-shimmer" 
                 style={{ backgroundSize: '200% 100%', animationDelay: '0.3s' }} />
          </div>
        </div>
      ))}

      {/* Diagram Placeholder */}
      <div className="h-72 bg-gradient-to-br from-muted/50 to-muted rounded-2xl flex items-center justify-center animate-fade-in overflow-hidden relative"
           style={{ animationDelay: '0.5s' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" 
             style={{ backgroundSize: '200% 100%' }} />
        <div className="relative flex items-center gap-3">
          <div className="w-20 h-20 bg-muted rounded-xl animate-pulse" />
          <div className="space-y-2">
            <div className="w-32 h-3 bg-muted/70 rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-24 h-3 bg-muted/70 rounded animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>

      {/* Table Placeholder */}
      <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <div className="h-12 bg-gradient-to-r from-muted via-muted/60 to-muted rounded-lg animate-shimmer" 
             style={{ backgroundSize: '200% 100%' }} />
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="h-10 bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 rounded-lg animate-shimmer"
            style={{ backgroundSize: '200% 100%', animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </div>
  );
};
