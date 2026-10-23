import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../lib/utils';
import {
  BarChart3,
  TrendingUp,
  Download,
  Users,
  CreditCard,
  Calendar,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [fineRevenue, setFineRevenue] = useState<any[]>([]);
  const [memberGrowth, setMemberGrowth] = useState<any[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get('/reports/fine-revenue'),
      api.get('/reports/member-growth'),
      api.get('/reports/category-distribution')
    ])
      .then(([revenueData, growthData, categoryData]) => {
        setFineRevenue(revenueData || []);
        setMemberGrowth(growthData || []);
        setCategoryDistribution(categoryData || []);
      })
      .catch((err) => toastError(err.message || 'Failed to load report analytics.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleExportReportCSV = (title: string, data: any[]) => {
    if (!data || data.length === 0) {
      toastError('No data available to export.');
      return;
    }

    const keys = Object.keys(data[0]);
    const rows = data.map((d) => keys.map((k) => `"${d[k]}"`).join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [keys.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LibraSphere_${title}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toastSuccess(`Report "${title}" exported to CSV.`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <span>Executive Intelligence Reports</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Detailed metrics covering revenue streams, membership acquisition, and collection depth
        </p>
      </div>

      <div className="space-y-8">
        {/* Fine Revenue Timeline */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Fine Revenue Collections by Month</span>
              </h3>
              <p className="text-xs text-gray-500">Total fees settled from overdue book checkouts</p>
            </div>
            <button
              onClick={() => handleExportReportCSV('Revenue_Timeline', fineRevenue)}
              className="px-3.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-1.5 self-start sm:self-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fineRevenue}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{ backgroundColor: '#1E1B4B', borderColor: '#4338CA', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="revenue" fill="#10B981" radius={[8, 8, 0, 0]} name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Growth Trend */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Cumulative Member Growth Trend</span>
              </h3>
              <p className="text-xs text-gray-500">Total verified registered campus patrons over time</p>
            </div>
            <button
              onClick={() => handleExportReportCSV('Member_Growth', memberGrowth)}
              className="px-3.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-1.5 self-start sm:self-center"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={memberGrowth}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1B4B', borderColor: '#4338CA', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#4F46E5"
                  fill="#818CF8"
                  fillOpacity={0.25}
                  name="Total Members"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
