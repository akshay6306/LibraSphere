import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Reservation } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { BookCover } from '../../components/ui/BookCover';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate, formatDateTime } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { BookmarkCheck, Clock, MapPin, XCircle, AlertCircle } from 'lucide-react';

export const ReservationsPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/reservations');
      setReservations(res.data || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch reservations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this reservation hold?')) {
      return;
    }

    setCancellingId(id);
    try {
      await api.put(`/reservations/${id}/cancel`, {});
      toastSuccess('Reservation cancelled successfully.');
      fetchReservations();
    } catch (err: any) {
      toastError(err.message || 'Could not cancel reservation.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Reservations & Hold Queue
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Track real-time queue position and 48-hour pickup windows for reserved books
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : reservations.length > 0 ? (
        <div className="space-y-4">
          {reservations.map((res) => {
            const isReady = res.status === 'READY';
            const isPending = res.status === 'PENDING';
            const canCancel = isPending || isReady;

            return (
              <div
                key={res.id}
                className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isReady
                    ? 'border-emerald-300 dark:border-emerald-900 bg-emerald-50/20'
                    : 'border-gray-200/80 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <BookCover
                    title={res.book.title}
                    category={res.book.category}
                    coverUrl={res.book.coverUrl}
                    size="md"
                  />
                  <div className="space-y-1">
                    <Link
                      to={`/books/${res.book.id}`}
                      className="text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 transition"
                    >
                      {res.book.title}
                    </Link>
                    <p className="text-xs text-gray-500">
                      Author: {res.book.author} • Category: {res.book.category}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>Pickup Branch: <strong>{res.branch.name}</strong></span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Requested on: {formatDate(res.requestedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-right sm:text-left">
                    <div className="flex items-center justify-end sm:justify-start space-x-2">
                      <Badge status={res.status} />
                    </div>

                    {isReady && res.expiresAt && (
                      <p className="text-[11px] font-bold text-emerald-600 mt-1">
                        Hold expires: {formatDateTime(res.expiresAt)}
                      </p>
                    )}

                    {isPending && (
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        Queue Position: #{res.queuePosition}
                      </p>
                    )}
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => handleCancel(res.id)}
                      disabled={cancellingId === res.id}
                      className="px-3.5 py-2 border border-rose-200 dark:border-rose-900 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-40"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{cancellingId === res.id ? 'Cancelling...' : 'Cancel Hold'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Active Reservations"
          description="You don't have any book hold reservations at this time."
          icon={BookmarkCheck}
          actionText="Browse Books to Reserve"
          onAction={() => (window.location.href = '/catalog')}
        />
      )}
    </div>
  );
};
