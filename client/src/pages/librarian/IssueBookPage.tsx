import React, { useState } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../lib/utils';
import { ArrowUpRight, Search, Barcode, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const IssueBookPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [membershipId, setMembershipId] = useState('');
  const [copyBarcode, setCopyBarcode] = useState('');
  const [conditionNote, setConditionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastIssuedLoan, setLastIssuedLoan] = useState<any | null>(null);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membershipId.trim() || !copyBarcode.trim()) {
      toastError('Please provide both the member ID and the book copy barcode.');
      return;
    }

    setIsSubmitting(true);
    // Generate idempotency key
    const idempotencyKey = `issue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const loan = await api.post('/loans', {
        membershipId: membershipId.trim(),
        copyBarcode: copyBarcode.trim(),
        conditionNote: conditionNote.trim() || undefined,
        idempotencyKey
      });

      toastSuccess(`Loan successfully issued! Due date: ${formatDate(loan.dueDate)}`);
      setLastIssuedLoan(loan);
      setCopyBarcode('');
      setConditionNote('');
    } catch (err: any) {
      toastError(err.message || 'Failed to issue book loan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <ArrowUpRight className="w-8 h-8 text-indigo-600" />
          <span>Issue Circulation Book</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Scan the physical book barcode and member ID to create a 14-day checkout record
        </p>
      </div>

      {/* Quick Demo Helper Hint */}
      <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-start space-x-3">
        <UserCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Desk Reference Guidelines:</p>
          <p className="mt-0.5 text-indigo-700 dark:text-indigo-300">
            • Demo Member ID: <code className="bg-white/80 dark:bg-gray-800 px-1 py-0.5 rounded font-mono font-bold">LIB-1001</code> or <code className="bg-white/80 dark:bg-gray-800 px-1 py-0.5 rounded font-mono font-bold">member@libra.test</code><br />
            • Demo Book Copy Barcode: <code className="bg-white/80 dark:bg-gray-800 px-1 py-0.5 rounded font-mono font-bold">BC-0001-1</code> or <code className="bg-white/80 dark:bg-gray-800 px-1 py-0.5 rounded font-mono font-bold">BC-0002-1</code>
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleIssue} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Member Identifier (Membership ID or Email) *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={membershipId}
                onChange={(e) => setMembershipId(e.target.value)}
                placeholder="e.g. LIB-1001 or member@libra.test"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Book Copy Barcode *
            </label>
            <div className="relative">
              <Barcode className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={copyBarcode}
                onChange={(e) => setCopyBarcode(e.target.value)}
                placeholder="e.g. BC-0001-1 (Scan or type barcode)"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Condition Note (Optional)
            </label>
            <input
              type="text"
              value={conditionNote}
              onChange={(e) => setConditionNote(e.target.value)}
              placeholder="e.g. Minor spine creasing, all pages intact"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Verifying & Issuing...' : 'Complete Book Issue'}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Success Confirmation Card */}
        {lastIssuedLoan && (
          <div className="p-5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Checkout Confirmed!</span>
            </div>
            <p className="text-xs text-emerald-900 dark:text-emerald-200 font-medium">
              "{lastIssuedLoan.copy?.book?.title}" issued to {lastIssuedLoan.member?.user?.name} (ID: {lastIssuedLoan.member?.membershipId}).
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Scheduled Due Date: <strong>{formatDate(lastIssuedLoan.dueDate)}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
