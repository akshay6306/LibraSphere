import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Reservation } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate, formatDateTime } from '../../lib/utils';
import { BookmarkCheck, Clock, CheckCircle2, Search, Filter } from 'lucide-react';

export const ReservationManagementPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const url = statusFilter !== 'ALL' ? `/reservations?status=${statusFilter}` : '/reservations';
      const res = await api.get(url);
      setReservations(res.data || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch hold queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const filtered = reservations.filter((r) =>
    r.book.title.toLowerCase().includes(search.toLowerCase()) ||
    r.member?.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    r.branch.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <BookmarkCheck className="w-8 h-8 text-indigo-600" />
            <span>Hold Queue Management</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            FIFO queue monitoring, ready holds, and 48-hour pickup window enforcement
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1.5 rounded-2xl">
          {['ALL', 'READY', 'PENDING', 'FULFILLED', 'EXPIRED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by book title, member name, branch..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase font-bold text-gray-500 tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3">Book Title</th>
                  <th className="px-5 py-3">Reserved By</th>
                  <th className="px-5 py-3">Branch Location</th>
                  <th className="px-5 py-3">Queue Position</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Hold Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {filtered.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                      {res.book.title}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {res.member?.user?.name || 'Library Member'}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {res.member?.membershipId}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {res.branch.name}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                      {res.status === 'READY' ? 'Ready at Desk' : `#${res.queuePosition}`}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={res.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-[11px] text-gray-500">
                      {res.expiresAt ? formatDateTime(res.expiresAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Reservations Found"
          description="No reservations matching the selected filter criteria."
          icon={BookmarkCheck}
        />
      )}
    </div>
  );
};
