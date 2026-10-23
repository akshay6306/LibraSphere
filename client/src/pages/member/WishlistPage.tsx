import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { WishlistItem } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { BookCover } from '../../components/ui/BookCover';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Link } from 'react-router-dom';
import { Heart, Trash2, BookmarkCheck, BookOpen } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/wishlist');
      setItems(res || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch wishlist.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (bookId: string) => {
    try {
      await api.del(`/wishlist/${bookId}`);
      toastSuccess('Removed from reading wishlist.');
      setItems((prev) => prev.filter((i) => i.bookId !== bookId));
    } catch (err: any) {
      toastError(err.message || 'Failed to remove from wishlist.');
    }
  };

  const handleReserve = async (bookId: string) => {
    try {
      await api.post('/reservations', { bookId });
      toastSuccess('Reservation hold placed! Track it under Reservations.');
    } catch (err: any) {
      toastError(err.message || 'Could not place reservation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Saved Reading Wishlist
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Personal bookmark queue of titles you plan to read
          </p>
        </div>

        <Link
          to="/catalog"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Add More from Catalog →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {items.map((item) => {
            const book = item.book;
            const availableCount = book.copies?.filter((c) => c.status === 'AVAILABLE').length ?? 0;

            return (
              <div
                key={item.id}
                className="group flex flex-col justify-between bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition"
              >
                <div className="flex flex-col items-center">
                  <BookCover
                    title={book.title}
                    category={book.category}
                    coverUrl={book.coverUrl}
                    size="md"
                  />
                  <Link
                    to={`/books/${book.id}`}
                    className="text-xs font-bold text-gray-900 dark:text-white mt-3 text-center line-clamp-2 hover:text-indigo-600 transition"
                  >
                    {book.title}
                  </Link>
                  <p className="text-[11px] text-gray-500 text-center truncate w-full mt-0.5">
                    {book.author}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge status={availableCount > 0 ? 'AVAILABLE' : 'BORROWED'}>
                      {availableCount > 0 ? `${availableCount} in stock` : 'Out'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={() => handleReserve(book.id)}
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1"
                      title="Hold / Reserve"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span>Hold</span>
                    </button>
                    <button
                      onClick={() => handleRemove(book.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Wishlist is Empty"
          description="You haven't bookmarked any titles to your wishlist yet."
          icon={Heart}
          actionText="Explore Catalog"
          onAction={() => (window.location.href = '/catalog')}
        />
      )}
    </div>
  );
};
