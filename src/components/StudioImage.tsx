import React, { useState } from 'react';
import { Layers } from 'lucide-react';

interface StudioImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const StudioImage: React.FC<StudioImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackLabel,
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-zinc-800 dark:to-zinc-900 text-stone-500 dark:text-zinc-400 p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Layers className="w-6 h-6 opacity-60 mb-1.5" />
        {fallbackLabel && (
          <span className="text-xs font-medium tracking-tight text-center">{fallbackLabel}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
