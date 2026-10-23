import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Loan } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../lib/utils';
import {
  ArrowUpRight,
  ArrowDownLeft,
  BookMarked,
  AlertTriangle,
  BookmarkCheck,
  Library,
  Users,
  Search
} from 'lucide-react';

export const LibrarianOverviewPage: React.FC = () => {
  const { error: toastError } = useToast();
  const [stats, setStats] = useState({
    activeLoans: 30,
    overdueLoans: 15,
    pendingHolds: 12,
    totalBooks: 200
  });
  const [recentLoans, setRecentLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get('/reports/overview'),
      api.get('/loans?limit=6')
    ])
      .then(([overviewData, loansData]) => {
        if (overviewData) {
          setStats({
            activeLoans: overviewData.activeLoans,
            overdueLoans: overviewData.overdueLoans,
            pendingHolds: 12,
            totalBooks: overviewData.totalBooks
          });
        }
        if (loansData.data) {
          setRecentLoans(loansData.data);
        }
      })
      .catch((err) => toastError(err.message || 'Failed to load desk data.'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Circulation Desk
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time book issue, returns, inventory control, and member holds
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/librarian/issue"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Issue Book</span>
          </Link>
          <Link
            to="/librarian/return"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Return Book</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Borrowed Books"
          value={stats.activeLoans}
          subtitle="In circulation"
          icon={BookMarked}
          color="indigo"
        />
        <StatCard
          title="Overdue Notices"
          value={stats.overdueLoans}
          subtitle="Immediate follow-up"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="Catalog Inventory"
          value={stats.totalBooks}
          subtitle="Titles across branches"
          icon={Library}
          color="sky"
        />
        <StatCard
          title="Reservation Holds"
          value={stats.pendingHolds}
          subtitle="Pending desk pickup"
          icon={BookmarkCheck}
          color="amber"
        />
      </div>

      {/* Desk Quick Navigation Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/librarian/issue"
          className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Issue Circulation
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">Check out copy by member barcode</p>
            </div>
          </div>
        </Link>

        <Link
          to="/librarian/return"
          className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm hover:border-emerald-400 dark:hover:border-emerald-600 transition group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Process Return
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">Scan barcode, assess condition & fees</p>
            </div>
          </div>
        </Link>

        <Link
          to="/librarian/overdue"
          className="p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm hover:border-rose-400 dark:hover:border-rose-600 transition group"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Overdue Queue
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">Contact borrowers & review fines</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Recent Circulation Transactions
            </h2>
            <p className="text-xs text-gray-500">Live feed of loans issued and returns processed</p>
          </div>
          <Link
            to="/librarian/members"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Member Directory →
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : recentLoans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase font-bold text-gray-500 tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3">Book Title</th>
                  <th className="px-5 py-3">Barcode</th>
                  <th className="px-5 py-3">Member</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {recentLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                        {loan.copy.book.title}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono">
                        {loan.copy.book.isbn}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-gray-600 dark:text-gray-300">
                      {loan.copy.barcode}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {loan.member.user.name}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {loan.member.membershipId}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {formatDate(loan.dueDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={loan.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-6 text-gray-400 text-xs">
            No recent loans recorded.
          </p>
        )}
      </div>
    </div>
  );
};
