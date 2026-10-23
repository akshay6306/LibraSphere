import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Loan } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { BookCover } from '../../components/ui/BookCover';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import { Download, History, Search } from 'lucide-react';

export const BorrowHistoryPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.get('/loans?status=RETURNED')
      .then((res) => setLoans(res.data || []))
      .catch((err) => toastError(err.message || 'Failed to load borrowing history.'))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredLoans = loans.filter((l) =>
    l.copy.book.title.toLowerCase().includes(search.toLowerCase()) ||
    l.copy.barcode.toLowerCase().includes(search.toLowerCase()) ||
    l.copy.book.author.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    if (loans.length === 0) {
      toastError('No loans available to export.');
      return;
    }

    const headers = ['Title', 'Author', 'ISBN', 'Barcode', 'Branch', 'Issued At', 'Returned At', 'Status'];
    const rows = loans.map((l) => [
      `"${l.copy.book.title.replace(/"/g, '""')}"`,
      `"${l.copy.book.author.replace(/"/g, '""')}"`,
      `"${l.copy.book.isbn}"`,
      `"${l.copy.barcode}"`,
      `"${l.branch.name}"`,
      `"${formatDate(l.issuedAt)}"`,
      `"${formatDate(l.returnedAt)}"`,
      `"${l.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LibraSphere_Borrow_History_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toastSuccess('Borrowing history exported as CSV successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Borrowing History
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Complete archive of books checked out and returned across all library branches
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={loans.length === 0}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Archive</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by title, author, barcode..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : filteredLoans.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase font-bold text-gray-500 tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3">Book Title</th>
                  <th className="px-5 py-3">Barcode</th>
                  <th className="px-5 py-3">Branch</th>
                  <th className="px-5 py-3">Borrowed On</th>
                  <th className="px-5 py-3">Returned On</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                        {loan.copy.book.title}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {loan.copy.book.author}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-gray-500">
                      {loan.copy.barcode}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {loan.branch.name}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {formatDate(loan.issuedAt)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {formatDate(loan.returnedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={loan.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No Historical Records"
          description="You haven't returned any book loans yet."
          icon={History}
        />
      )}
    </div>
  );
};
