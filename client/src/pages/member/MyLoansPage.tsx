import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Loan } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { BookCover } from '../../components/ui/BookCover';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { RefreshCw, Calendar, AlertTriangle, BookOpen } from 'lucide-react';

export const MyLoansPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/loans?status=ACTIVE');
      setLoans(res.data || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch loans');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleRenew = async (loanId: string) => {
    setRenewingId(loanId);
    try {
      await api.put(`/loans/${loanId}/renew`, {});
      toastSuccess('Loan renewed successfully for 14 days!');
      fetchLoans();
    } catch (err: any) {
      toastError(err.message || 'Could not renew loan.');
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            My Active Loans
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage books currently checked out. Renew online before the due date.
          </p>
        </div>
        <Link
          to="/dashboard/history"
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          View Past Borrowing History →
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : loans.length > 0 ? (
        <div className="space-y-4">
          {loans.map((loan) => {
            const dueDate = new Date(loan.dueDate);
            const now = new Date();
            const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue = diffDays < 0;

            return (
              <div
                key={loan.id}
                className={`bg-white dark:bg-gray-900 border rounded-2xl p-5 shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isOverdue
                    ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20'
                    : 'border-gray-200/80 dark:border-gray-800'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <BookCover
                    title={loan.copy.book.title}
                    category={loan.copy.book.category}
                    coverUrl={loan.copy.book.coverUrl}
                    size="md"
                  />
                  <div className="space-y-1">
                    <Link
                      to={`/books/${loan.copy.book.id}`}
                      className="text-sm font-bold text-gray-900 dark:text-white hover:text-indigo-600 transition"
                    >
                      {loan.copy.book.title}
                    </Link>
                    <p className="text-xs text-gray-500">
                      Author: {loan.copy.book.author} • Category: {loan.copy.book.category}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      Copy Barcode: {loan.copy.barcode} • Shelf: {loan.copy.shelfLocation}
                    </p>
                    <div className="flex items-center space-x-3 text-xs pt-1">
                      <span className="text-gray-500">
                        Issued: <strong>{formatDate(loan.issuedAt)}</strong>
                      </span>
                      <span className="text-gray-500">
                        Branch: <strong>{loan.branch.name}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-right sm:text-left">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Due Date</p>
                    <p className={`text-sm font-bold ${isOverdue ? 'text-rose-600' : 'text-gray-900 dark:text-white'}`}>
                      {formatDate(loan.dueDate)}
                    </p>
                    <p className={`text-[11px] font-semibold ${isOverdue ? 'text-rose-500 font-bold' : 'text-emerald-600'}`}>
                      {isOverdue ? `${Math.abs(diffDays)} days overdue!` : `${diffDays} days remaining`}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRenew(loan.id)}
                    disabled={isOverdue || loan.renewalCount >= 2 || renewingId === loan.id}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${renewingId === loan.id ? 'animate-spin' : ''}`} />
                    <span>Renew ({loan.renewalCount}/2)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No Active Loans"
          description="You don't have any books currently borrowed from any library branch."
          icon={BookOpen}
          actionText="Browse Library Catalog"
          onAction={() => (window.location.href = '/catalog')}
        />
      )}
    </div>
  );
};
