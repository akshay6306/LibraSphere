import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Book } from '../../types';
import { BookCover } from '../ui/BookCover';
import { Badge } from '../ui/Badge';
import { Star, ChevronLeft, ChevronRight, ArrowRight, Sparkles, BookOpen } from 'lucide-react';

interface BookCarouselRowProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  viewAllUrl: string;
  books: Book[];
  isLoading?: boolean;
}

export const BookCarouselRow: React.FC<BookCarouselRowProps> = ({
  title,
  subtitle,
  icon,
  badge,
  badgeColor = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  viewAllUrl,
  books,
  isLoading = false
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!isLoading && (!books || books.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Row Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            {icon && <span className="text-xl">{icon}</span>}
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {title}
            </h2>
            {badge && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <Link
            to={viewAllUrl}
            className="hidden sm:inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition mr-2"
          >
            <span>Explore all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-sm transition"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-sm transition"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-44 sm:w-48 shrink-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3 space-y-3 animate-pulse"
              >
                <div className="w-full h-52 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              </div>
            ))
          : books.map((book) => {
              const bookRating = book.rating || book.avgRating || 4.5;
              return (
                <Link
                  key={book.id}
                  to={`/books/${book.id}`}
                  className="group w-44 sm:w-52 shrink-0 bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800/90 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl p-3 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200"
                >
                  <div className="space-y-3">
                    {/* Cover Container */}
                    <div className="relative flex justify-center bg-gray-50 dark:bg-gray-950/60 rounded-xl p-2.5 overflow-hidden">
                      <BookCover
                        title={book.title}
                        category={book.category}
                        coverUrl={book.coverUrl}
                        size="md"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {book.isNewArrival && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white shadow-sm">
                            NEW
                          </span>
                        )}
                        {book.isStaffPick && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white shadow-sm">
                            PICK
                          </span>
                        )}
                      </div>

                      {/* Preview badge */}
                      {book.previewUrl && (
                        <div className="absolute bottom-2 right-2">
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-black/70 text-white backdrop-blur-sm">
                            Preview
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Book Metadata */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="font-semibold truncate max-w-[110px] text-indigo-600 dark:text-indigo-400">
                          {book.subcategory || book.category}
                        </span>
                        <div className="flex items-center space-x-0.5 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{bookRating.toFixed(1)}</span>
                        </div>
                      </div>

                      <h3
                        className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug"
                        title={book.title}
                      >
                        {book.title}
                      </h3>

                      <p
                        className="text-[11px] text-gray-500 dark:text-gray-400 truncate"
                        title={book.author}
                      >
                        {book.author}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Footer Pill */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                      {book.format || 'Hardcover'}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">
                      Details →
                    </span>
                  </div>
                </Link>
              );
            })}
      </div>
    </div>
  );
};
