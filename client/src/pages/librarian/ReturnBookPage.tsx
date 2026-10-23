import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Loan } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { ArrowDownLeft, Barcode, CheckCircle2, AlertTriangle, Search, Bell } from 'lucide-react';

export const ReturnBookPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [conditionNote, setConditionNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [returnResult, setReturnResult] = useState<any | null>(null);

  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);

  useEffect(() => {
    api.get('/loans?status=ACTIVE&limit=20')
      .then((res) => setActiveLoans(res.data || []))
      .catch(() => {});
  }, []);

  const handleBarcodeLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery.trim()) return;

    const match = activeLoans.find(
      (l) => l.copy.barcode.toLowerCase() === barcodeQuery.trim().toLowerCase()
    );

    if (match) {
      setSelectedLoan(match);
      setReturnResult(null);
    } else {
      // Query server for loan by barcode
      api.get(`/loans?search=${encodeURIComponent(barcodeQuery.trim())}&status=ACTIVE`)
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setSelectedLoan(res.data[0]);
            setReturnResult(null);
          } else {
            toastError(`No active loan found for barcode "${barcodeQuery}".`);
          }
        })
        .catch(() => toastError('Error looking up barcode.'));
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    setIsProcessing(true);
    try {
      const res = await api.put(`/loans/${selectedLoan.id}/return`, {
        conditionNote: conditionNote.trim() || undefined
      });

      toastSuccess('Book returned and copy status updated!');
      setReturnResult(res);
      setSelectedLoan(null);
      setBarcodeQuery('');
      setConditionNote('');

      // Refresh active loans list
      api.get('/loans?status=ACTIVE&limit=20').then((r) => setActiveLoans(r.data || []));
    } catch (err: any) {
      toastError(err.message || 'Failed to process return.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <ArrowDownLeft className="w-8 h-8 text-emerald-600" />
          <span>Process Book Return</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Scan book copy barcode to check-in, calculate overdue fees, and trigger hold notifications
        </p>
      </div>

      {/* Barcode Search Form */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-sm">
        <form onSubmit={handleBarcodeLookup} className="flex gap-3">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
              placeholder="Scan or enter book barcode (e.g. BC-0001-1)..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 flex-shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Lookup Loan</span>
          </button>
        </form>
      </div>

      {/* Selected Loan Check-in Card */}
      {selectedLoan && (
        <div className="bg-white dark:bg-gray-900 border border-emerald-300 dark:border-emerald-900 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in">
          <div className="flex items-start justify-between">
            <div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                Active Loan Found
              </span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                {selectedLoan.copy.book.title}
              </h3>
              <p className="text-xs text-gray-500 font-mono mt-0.5">
                Barcode: {selectedLoan.copy.barcode} • ISBN: {selectedLoan.copy.book.isbn}
              </p>
            </div>
            <Badge status={selectedLoan.status} />
          </div>

          {/* Borrower & Due Dates */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-xs">
            <div>
              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Borrower</span>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">{selectedLoan.member.user.name}</p>
              <p className="text-[10px] text-gray-500 font-mono">{selectedLoan.member.membershipId}</p>
            </div>
            <div>
              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Issued Date</span>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">{formatDate(selectedLoan.issuedAt)}</p>
            </div>
            <div>
              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Due Date</span>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">{formatDate(selectedLoan.dueDate)}</p>
            </div>
            <div>
              <span className="text-gray-400 uppercase font-semibold text-[10px] block">Overdue Check</span>
              {new Date() > new Date(selectedLoan.dueDate) ? (
                <span className="text-rose-600 font-bold">Past Due (Fine applies)</span>
              ) : (
                <span className="text-emerald-600 font-bold">On Time (No Fine)</span>
              )}
            </div>
          </div>

          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Return Inspection Condition Note
              </label>
              <input
                type="text"
                value={conditionNote}
                onChange={(e) => setConditionNote(e.target.value)}
                placeholder="e.g. Good condition, normal wear, barcode scanned cleanly"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedLoan(null)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isProcessing ? 'Processing Return...' : 'Confirm Book Return'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Return Outcome Confirmation */}
      {returnResult && (
        <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-3xl space-y-3 animate-in fade-in">
          <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Return Processed Successfully!</span>
          </div>
          <p className="text-xs text-emerald-900 dark:text-emerald-200">
            Book has been checked in and restored to system inventory.
          </p>
          {returnResult.fineAmount > 0 && (
            <p className="text-xs text-rose-700 dark:text-rose-400 font-bold flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Overdue fine of {formatCurrency(returnResult.fineAmount)} assessed to member.</span>
            </p>
          )}
          {returnResult.reservationNotified && (
            <p className="text-xs text-indigo-700 dark:text-indigo-300 font-bold flex items-center space-x-1.5">
              <Bell className="w-4 h-4" />
              <span>Queue Alert: Next pending member was notified and copy is held as RESERVED (48h window).</span>
            </p>
          )}
        </div>
      )}

      {/* Active Loans Quick Pick List */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Quick Pick: Currently Out on Loan ({activeLoans.length})
        </h3>
        <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto">
          {activeLoans.map((l) => (
            <div
              key={l.id}
              onClick={() => {
                setSelectedLoan(l);
                setReturnResult(null);
              }}
              className="py-3 px-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-xl cursor-pointer transition text-xs"
            >
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{l.copy.book.title}</p>
                <p className="text-[11px] text-gray-500 font-mono">
                  Barcode: {l.copy.barcode} • Borrower: {l.member.user.name} ({l.member.membershipId})
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-[11px] text-gray-400">Due {formatDate(l.dueDate)}</span>
                <button className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-[11px] transition">
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
