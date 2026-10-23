import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Link } from 'react-router-dom';
import { AlertTriangle, Bell, Mail, Phone, ArrowDownLeft, CheckCircle2 } from 'lucide-react';

export const OverdueListPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [overdueItems, setOverdueItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notifiedMap, setNotifiedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsLoading(true);
    api.get('/reports/overdue')
      .then((data) => setOverdueItems(data || []))
      .catch((err) => toastError(err.message || 'Failed to load overdue report.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSendReminder = (item: any) => {
    setNotifiedMap((prev) => ({ ...prev, [item.loanId]: true }));
    toastSuccess(`Overdue return notification dispatched to ${item.memberName} (${item.memberEmail})!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <AlertTriangle className="w-8 h-8 text-rose-600" />
            <span>Overdue Circulation List</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Track unreturned books past their 14-day checkout window and dispatch notifications
          </p>
        </div>

        <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
          <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
            {overdueItems.length} Overdue Copies
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : overdueItems.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase font-bold text-gray-500 tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3">Book & Barcode</th>
                  <th className="px-5 py-3">Borrower Details</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Overdue Days</th>
                  <th className="px-5 py-3">Accrued Fine</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {overdueItems.map((item) => (
                  <tr key={item.loanId} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                        {item.bookTitle}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono">
                        {item.copyBarcode} • {item.branchName}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {item.memberName}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono">
                        {item.membershipId} • {item.memberEmail}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-rose-600 font-semibold">
                      {formatDate(item.dueDate)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-rose-600">
                      {item.overdueDays} days
                    </td>
                    <td className="px-5 py-3.5 font-black text-rose-600 text-sm">
                      {formatCurrency(item.fineAmount)}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleSendReminder(item)}
                        disabled={notifiedMap[item.loanId]}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[11px] rounded-lg transition inline-flex items-center space-x-1 disabled:opacity-50"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        <span>{notifiedMap[item.loanId] ? 'Sent' : 'Remind'}</span>
                      </button>
                      <Link
                        to="/librarian/return"
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] rounded-lg transition inline-flex items-center space-x-1"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Return</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Zero Overdue Loans"
          description="Remarkable! All circulating book copies are currently within their active loan periods."
          icon={CheckCircle2}
        />
      )}
    </div>
  );
};
