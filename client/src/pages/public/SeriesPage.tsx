import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Book } from '../../types';
import { BookCover } from '../../components/ui/BookCover';
import {
  ChevronRight,
  Layers,
  Star,
  BookOpen,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export const SeriesPage: React.FC = () => {
  const { seriesName } = useParams<{ seriesName: string }>();
  const decodedSeries = decodeURIComponent(seriesName || '');

  const [seriesData, setSeriesData] = useState<{
    seriesName: string;
    volumeCount: number;
    books: Book[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!seriesName) return;

    setIsLoading(true);
    api.get(`/books/series/${encodeURIComponent(decodedSeries)}`)
      .then((res) => {
        const data = res?.data || res;
        setSeriesData(data);
      })
      .catch((err) => {
        console.error('Failed to load series details', err);
        setSeriesData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [seriesName, decodedSeries]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/catalog" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Catalog
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 dark:text-white font-semibold">
          Series: {decodedSeries}
        </span>
      </nav>

      {/* Series Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-900 to-purple-950 text-white p-8 sm:p-10 shadow-xl border border-purple-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="w-20 h-20 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shrink-0">
            <Layers className="w-10 h-10" />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/40">
              Book Series Collection
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              {decodedSeries}
            </h1>
            {seriesData && (
              <p className="text-xs text-purple-200">
                {seriesData.volumeCount} {seriesData.volumeCount === 1 ? 'Volume' : 'Volumes'} cataloged in the consortium
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Series Volumes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <h2 className="text-xl font-black text-gray-900 dark:text-white">
            Volumes in this Series
          </h2>
          <Link
            to="/catalog"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Catalog</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-3 animate-pulse"
              >
                <div className="w-full h-60 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : seriesData && seriesData.books.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {seriesData.books.map((book) => {
              const bookRating = book.rating || book.avgRating || 4.5;
              return (
                <div
                  key={book.id}
                  className="group bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800/90 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200"
                >
                  <div className="space-y-3.5">
                    <Link
                      to={`/books/${book.id}`}
                      className="relative flex justify-center bg-gray-50 dark:bg-gray-950/60 rounded-xl p-3 overflow-hidden"
                    >
                      <BookCover
                        title={book.title}
                        category={book.category}
                        coverUrl={book.coverUrl}
                        size="md"
                        className="group-hover:scale-105 transition-transform duration-300"
                      />

                      {book.seriesNumber && (
                        <div className="absolute top-2 left-2 z-10">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-md">
                            Vol. {book.seriesNumber}
                          </span>
                        </div>
                      )}
                    </Link>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[130px]">
                          {book.category}
                        </span>
                        <div className="flex items-center space-x-0.5 text-amber-500 font-bold shrink-0">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{bookRating.toFixed(1)}</span>
                        </div>
                      </div>

                      <Link to={`/books/${book.id}`}>
                        <h3
                          className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug"
                          title={book.title}
                        >
                          {book.title}
                        </h3>
                      </Link>

                      <Link
                        to={`/authors/${encodeURIComponent(book.author)}`}
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:underline block truncate"
                        title={book.author}
                      >
                        {book.author}
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium">
                      {book.format || 'Hardcover'}
                    </span>
                    <Link
                      to={`/books/${book.id}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <span>Read More</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8">
            <Layers className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No volumes found for this series
            </h3>
            <Link
              to="/catalog"
              className="mt-4 inline-block px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
            >
              Back to Catalog
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
