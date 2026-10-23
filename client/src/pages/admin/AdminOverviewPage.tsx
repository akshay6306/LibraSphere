import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { StatCard } from '../../components/ui/StatCard';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatCurrency } from '../../lib/utils';
import {
  Users,
  BookOpen,
  BookmarkCheck,
  CreditCard,
  Building2,
  TrendingUp,
  BarChart3,
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
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const AdminOverviewPage: React.FC = () => {
  const { error: toastError } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [loansPerDay, setLoansPerDay] = useState<any[]>([]);
  const [topBooks, setTopBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [branchComparison, setBranchComparison] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get('/reports/overview'),
      api.get('/reports/loans-per-day?days=14'),
      api.get('/reports/top-books?limit=6'),
      api.get('/reports/category-distribution'),
      api.get('/reports/branch-comparison')
    ])
      .then(([overviewData, loansData, topData, catData, branchData]) => {
        setStats(overviewData);
        setLoansPerDay(loansData);
        setTopBooks(topData);
        setCategories(catData);
        setBranchComparison(branchData);
      })
      .catch((err) => toastError(err.message || 'Failed to fetch analytics.'))
      .finally(() => setIsLoading(false));
  }, []);

  const COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#3B82F6'];

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
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <span>System Analytics & Operations</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Executive performance dashboard tracking multi-branch circulation, revenues, and volume distribution
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Members"
          value={stats?.totalMembers || 0}
          subtitle="Registered patrons"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Catalog Titles"
          value={stats?.totalBooks || 0}
          subtitle={`${stats?.totalCopies || 0} physical copies`}
          icon={BookOpen}
          color="sky"
        />
        <StatCard
          title="Total Loans Circulated"
          value={stats?.totalLoans || 0}
          subtitle={`${stats?.activeLoans || 0} currently active`}
          icon={BookmarkCheck}
          color="emerald"
        />
        <StatCard
          title="Fine Revenue Collected"
          value={formatCurrency(stats?.totalRevenueCollected || 0)}
          subtitle={`${formatCurrency(stats?.totalFineAmount || 0)} total assessed`}
          icon={CreditCard}
          color="amber"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Circulation Velocity: Loans Per Day */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Circulation Activity (Last 14 Days)
              </h3>
              <p className="text-xs text-gray-500">Daily checkout velocity across campus branches</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loansPerDay}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(val) => val.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1B4B', borderColor: '#4338CA', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#4F46E5' }}
                  name="Loans Issued"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Borrowed Titles */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Top Borrowed Books
              </h3>
              <p className="text-xs text-gray-500">Highest circulation titles in the library</p>
            </div>
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBooks} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="title" type="category" width={110} tick={{ fontSize: 9 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1B4B', borderColor: '#4338CA', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="borrowCount" fill="#4F46E5" radius={[0, 8, 8, 0]} name="Loans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Volume Distribution */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Catalog Categories Distribution
              </h3>
              <p className="text-xs text-gray-500">Distribution of holdings across major disciplines</p>
            </div>
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="category" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1B4B', borderColor: '#4338CA', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#06B6D4" radius={[6, 6, 0, 0]} name="Titles" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Inventory & Circulation Comparison */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Branch Comparison
              </h3>
              <p className="text-xs text-gray-500">Inventory copies vs. total checkouts per campus</p>
            </div>
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchComparison}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1E1B4B', borderColor: '#4338CA', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="totalCopies" fill="#8B5CF6" radius={[6, 6, 0, 0]} name="Copies Stocked" />
                <Bar dataKey="totalLoans" fill="#10B981" radius={[6, 6, 0, 0]} name="Loans Processed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
