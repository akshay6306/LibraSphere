import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Fine } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate, formatCurrency } from '../../lib/utils';
import { CreditCard, CheckCircle2, DollarSign, ShieldAlert, Receipt } from 'lucide-react';

export const FinesPage: React.FC = () => {
  const { refreshProfile } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();

  const [fines, setFines] = useState<Fine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Payment modal state
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CAMPUS_CARD' | 'ONLINE'>('CARD');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchFines = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/fines');
      setFines(res || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch fines.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, []);

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFine) return;

    setIsProcessing(true);
    try {
      await api.post(`/fines/${selectedFine.id}/pay`, {
        method: paymentMethod,
        amount: selectedFine.amount
      });
      toastSuccess(`Payment of ${formatCurrency(selectedFine.amount)} processed successfully!`);
      setSelectedFine(null);
      await refreshProfile();
      fetchFines();
    } catch (err: any) {
      toastError(err.message || 'Payment processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const unpaidFines = fines.filter((f) => !f.isPaid);
  const paidFines = fines.filter((f) => f.isPaid);
  const totalDue = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Fines & Fee Settlements
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Overdue fines are assessed at $5.00/day and capped at book replacement cost
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-2xl shadow-sm">
          <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <p className="text-[10px] uppercase font-bold text-gray-400">Total Unpaid Balance</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">
              {formatCurrency(totalDue)}
            </p>
          </div>
        </div>
      </div>

      {/* Unpaid Fines Table */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Outstanding Unpaid Fines ({unpaidFines.length})
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : unpaidFines.length > 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase font-bold text-gray-500 tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Reason</th>
                    <th className="px-5 py-3">Assessed Date</th>
                    <th className="px-5 py-3">Fine Amount</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {unpaidFines.map((fine) => (
                    <tr key={fine.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-900 dark:text-white">
                          {fine.loan.copy.book.title}
                        </p>
                        <p className="text-[11px] text-gray-500 font-mono">
                          Barcode: {fine.loan.copy.barcode}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                        {fine.reason}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {formatDate(fine.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-rose-600 text-sm">
                        {formatCurrency(fine.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedFine(fine)}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          Pay Fine
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-2xl flex items-center space-x-3 text-emerald-800 dark:text-emerald-200 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Zero Outstanding Fines!</strong> Your library account is in good standing with full borrowing privileges.
            </span>
          </div>
        )}
      </div>

      {/* Paid Fines History */}
      {paidFines.length > 0 && (
        <div className="space-y-4 pt-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-gray-400" />
            <span>Settled Payment Receipts ({paidFines.length})</span>
          </h2>

          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase font-bold text-gray-500 tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Transaction ID</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Amount Paid</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                  {paidFines.map((fine) => {
                    const payment = fine.payments?.[0];
                    return (
                      <tr key={fine.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                        <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                          {fine.loan.copy.book.title}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-gray-500">
                          {payment?.transactionId || 'TXN-SETTLED'}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                          {payment?.method || 'CARD'}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-emerald-600">
                          {formatCurrency(fine.amount)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge status="PAID" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Mock Payment Dialog */}
      {selectedFine && (
        <Modal
          isOpen={!!selectedFine}
          onClose={() => setSelectedFine(null)}
          title="Settle Overdue Fine"
          description={`Payment for "${selectedFine.loan.copy.book.title}"`}
        >
          <form onSubmit={handlePaySubmit} className="space-y-4 text-xs">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div>
                <p className="text-gray-500 font-medium">Total Amount Due</p>
                <p className="text-xl font-black text-rose-600 mt-0.5">
                  {formatCurrency(selectedFine.amount)}
                </p>
              </div>
              <Badge status="OVERDUE" />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Select Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CARD', label: 'Credit Card' },
                  { id: 'CAMPUS_CARD', label: 'Campus ID' },
                  { id: 'ONLINE', label: 'Digital Pay' }
                ].map((m) => (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 px-3 border rounded-xl font-bold text-xs transition ${
                      paymentMethod === m.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Card / Account Identifier
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-xs text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Expiry
                </label>
                <input
                  type="text"
                  defaultValue="12/28"
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-xs text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  defaultValue="888"
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-xs text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setSelectedFine(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
              >
                {isProcessing ? 'Processing Payment...' : `Confirm Pay ${formatCurrency(selectedFine.amount)}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
