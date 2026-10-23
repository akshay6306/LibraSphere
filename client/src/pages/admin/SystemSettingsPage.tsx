import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { Sliders, Save, RotateCcw, ShieldCheck } from 'lucide-react';

export const SystemSettingsPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [settings, setSettings] = useState<Record<string, string>>({
    loanPeriodDays: '14',
    maxBooksPerMember: '5',
    finePerDay: '5',
    gracePeriod: '2',
    maxRenewals: '2',
    fineThreshold: '500',
    holdPeriodHours: '48'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api.get('/admin/settings')
      .then((data) => {
        if (data) setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch((err) => toastError(err.message || 'Failed to load system settings.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/admin/settings', settings);
      toastSuccess('System circulation settings successfully applied!');
    } catch (err: any) {
      toastError(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings({
      loanPeriodDays: '14',
      maxBooksPerMember: '5',
      finePerDay: '5',
      gracePeriod: '2',
      maxRenewals: '2',
      fineThreshold: '500',
      holdPeriodHours: '48'
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <Sliders className="w-8 h-8 text-indigo-600" />
          <span>System Circulation Policies</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Tune loan durations, overdue fine rates, holding periods, and borrowing caps across all branches
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Circulation Limits Group */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Borrowing & Renewal Limits</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Standard Loan Period (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.loanPeriodDays}
                  onChange={(e) => handleChange('loanPeriodDays', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl font-bold"
                />
                <p className="text-[11px] text-gray-400 mt-1">Standard checkout period for books (default 14 days)</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Max Active Books per Member
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.maxBooksPerMember}
                  onChange={(e) => handleChange('maxBooksPerMember', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl font-bold"
                />
                <p className="text-[11px] text-gray-400 mt-1">Concurrent borrowed books limit per patron (default 5)</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Maximum Online Renewals
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={settings.maxRenewals}
                  onChange={(e) => handleChange('maxRenewals', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl font-bold"
                />
                <p className="text-[11px] text-gray-400 mt-1">Times a member can extend loan if no holds exist (default 2)</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Reservation Pickup Window (Hours)
                </label>
                <input
                  type="number"
                  min="12"
                  max="168"
                  value={settings.holdPeriodHours}
                  onChange={(e) => handleChange('holdPeriodHours', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl font-bold"
                />
                <p className="text-[11px] text-gray-400 mt-1">Hours a hold is preserved at desk before passing to next in queue (default 48h)</p>
              </div>
            </div>
          </div>

          {/* Fines and Penalties Group */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-rose-600" />
              <span>Overdue Fines & Penalty Rates</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Fine Amount per Overdue Day ($)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={settings.finePerDay}
                  onChange={(e) => handleChange('finePerDay', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl font-bold text-rose-600"
                />
                <p className="text-[11px] text-gray-400 mt-1">Daily fee assessed past due date (default $5/day)</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Overdue Grace Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={settings.gracePeriod}
                  onChange={(e) => handleChange('gracePeriod', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl font-bold"
                />
                <p className="text-[11px] text-gray-400 mt-1">Buffer days before fines begin accruing (default 2 days)</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Suspension Fine Threshold ($)
                </label>
                <input
                  type="number"
                  min="10"
                  max="2000"
                  value={settings.fineThreshold}
                  onChange={(e) => handleChange('fineThreshold', e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl font-bold text-rose-600"
                />
                <p className="text-[11px] text-gray-400 mt-1">Total unpaid balance that blocks new borrowings (default $500)</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Applying Settings...' : 'Save System Settings'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
