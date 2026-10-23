import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { Loan, Reservation, Fine } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { BookCover } from '../../components/ui/BookCover';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate, formatCurrency } from '../../lib/utils';
import {
  BookMarked,
  BookmarkCheck,
  CreditCard,
  Heart,
  Calendar,
  AlertCircle,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

export const MemberOverviewPage: React.FC = () => {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [loans, setLoans] = useState<Loan[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [loansRes, resRes, finesRes, wishRes] = await Promise.all([
        api.get('/loans?limit=5&status=ACTIVE'),
        api.get('/reservations?limit=5'),
        api.get('/fines?isPaid=false'),
        api.get('/wishlist')
      ]);

      setLoans(loansRes.data || []);
      setReservations(resRes.data || []);
      setFines(finesRes || []);
      setWishlistCount(wishRes?.length || 0);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRenew = async (loanId: string) => {
    try {
      await api.put(`/loans/${loanId}/renew`, {});
      toastSuccess('Book renewed for another 14 days!');
      fetchData();
    } catch (err: any) {
      toastError(err.message || 'Could not renew loan.');
    }
  };

  const totalOutstandingFines = fines.reduce((sum, f) => sum + f.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Membership ID:{' '}
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
              {user?.memberProfile?.membershipId || 'LIB-MEM'}
            </span>
            {' • '}
            Expiry: {formatDate(user?.memberProfile?.membershipExpiry)}
          </p>
        </div>

        <Link
          to="/catalog"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
        >
          <span>Find More Books</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Loans"
          value={loans.length}
          subtitle="Limit: 5 concurrent books"
          icon={BookMarked}
          color="indigo"
        />
        <StatCard
          title="Active Holds"
          value={reservations.length}
          subtitle="FIFO position tracked"
          icon={BookmarkCheck}
          color="sky"
        />
        <StatCard
          title="Outstanding Fines"
          value={formatCurrency(totalOutstandingFines)}
          subtitle={totalOutstandingFines > 0 ? 'Pay to retain privileges' : 'Zero balance'}
          icon={CreditCard}
          color={totalOutstandingFines > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Saved Wishlist"
          value={wishlistCount}
          subtitle="Personal reading queue"
          icon={Heart}
          color="amber"
        />
      </div>

      {/* Outstanding Fines Warning Banner if any */}
      {totalOutstandingFines > 0 && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
                You have {formatCurrency(totalOutstandingFines)} in unpaid overdue fines.
              </p>
              <p className="text-[11px] text-rose-600 dark:text-rose-300">
                Borrowing privileges will be restricted if total fines exceed $500.00.
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/fines"
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex-shrink-0 ml-4"
          >
            Pay Now
          </Link>
        </div>
      )}

      {/* Current Active Loans Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Currently Borrowed Books
            </h2>
            <p className="text-xs text-gray-500">Books currently in your possession</p>
          </div>
          <Link
            to="/dashboard/loans"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View All ({loans.length})
          </Link>
        </div>

        {loans.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {loans.map((loan) => {
              const dueDate = new Date(loan.dueDate);
              const isOverdue = new Date() > dueDate;

              return (
                <div
                  key={loan.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <BookCover
                      title={loan.copy.book.title}
                      category={loan.copy.book.category}
                      coverUrl={loan.copy.book.coverUrl}
                      size="sm"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        {loan.copy.book.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {loan.copy.book.author} • Barcode: {loan.copy.barcode}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge status={isOverdue ? 'OVERDUE' : 'ACTIVE'} />
                        <span className="text-[11px] text-gray-500">
                          Due: <strong>{formatDate(loan.dueDate)}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:self-center">
                    <button
                      onClick={() => handleRenew(loan.id)}
                      disabled={isOverdue || loan.renewalCount >= 2}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-lg transition flex items-center space-x-1.5 disabled:opacity-40"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Renew ({loan.renewalCount}/2)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-xs">
            You currently have no active borrowed books.{' '}
            <Link to="/catalog" className="text-indigo-600 font-bold hover:underline">
              Browse the catalog
            </Link>
          </div>
        )}
      </div>

      {/* Holds & Reservations Summary */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Active Holds & Queue Positions
            </h2>
            <p className="text-xs text-gray-500">Real-time status of your reserved titles</p>
          </div>
          <Link
            to="/dashboard/reservations"
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Manage Holds
          </Link>
        </div>

        {reservations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reservations.map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
                    {res.book.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Pickup: {res.branch.name}
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                    {res.status === 'READY'
                      ? '✓ Ready for pickup at circulation desk!'
                      : `Queue position: #${res.queuePosition}`}
                  </p>
                </div>
                <Badge status={res.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 text-xs">
            No active holds in your queue.
          </div>
        )}
      </div>
    </div>
  );
};
