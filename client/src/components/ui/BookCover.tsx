import React, { useState } from 'react';
import { getCategoryGradient, cn } from '../../lib/utils';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  title: string;
  category: string;
  coverUrl?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BookCover: React.FC<BookCoverProps> = ({
  title,
  category,
  coverUrl,
  className,
  size = 'md'
}) => {
  const [hasError, setHasError] = useState(false);
  const gradient = getCategoryGradient(category);
  const firstLetter = (title || 'B').trim().charAt(0).toUpperCase();

  const sizeClasses = {
    sm: 'w-12 h-16 text-sm',
    md: 'w-24 h-36 text-xl',
    lg: 'w-36 h-52 text-3xl',
    xl: 'w-48 h-72 text-5xl'
  };

  if (coverUrl && !hasError) {
    return (
      <div
        className={cn(
          'relative rounded-md shadow-md overflow-hidden bg-gray-200 dark:bg-gray-800 flex-shrink-0',
          sizeClasses[size],
          className
        )}
      >
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-lg shadow-lg flex flex-col justify-between p-3 select-none flex-shrink-0 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/20 bg-gradient-to-br',
        gradient.bg,
        sizeClasses[size],
        className
      )}
    >
      {/* Decorative Book Spine Edge */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-black/20 rounded-l-md" />

      {/* Category Tag on Book */}
      <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase opacity-80 pl-1 text-white">
        <span className="truncate max-w-[80%]">{category}</span>
        <BookOpen className="w-3 h-3 flex-shrink-0 ml-1" />
      </div>

      {/* Center Initial Letter */}
      <div className="flex items-center justify-center font-serif font-black text-white/90 drop-shadow-md">
        {firstLetter}
      </div>

      {/* Bottom Title Snippet */}
      <div className="text-[10px] font-medium leading-tight text-white/90 line-clamp-2 pl-1 font-sans">
        {title}
      </div>
    </div>
  );
};
