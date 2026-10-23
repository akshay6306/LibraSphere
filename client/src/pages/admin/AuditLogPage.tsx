import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { AuditLogItem } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDateTime } from '../../lib/utils';
import { FileText, Download, Search, Filter, ShieldCheck } from 'lucide-react';

export const AuditLogPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('action', search);
      if (actionFilter) params.set('entityType', actionFilter);

      const res = await api.get(`/admin/audit-log?${params.toString()}`);
      setLogs(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch audit log.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search, actionFilter]);

  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = ['Action', 'Entity Type', 'User Name', 'User Role', 'Details', 'IP Address', 'Timestamp'];
    const rows = logs.map((l) => [
      `"${l.action}"`,
      `"${l.entityType}"`,
      `"${l.user?.name || 'System'}"`,
      `"${l.user?.role || 'SYSTEM'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || '127.0.0.1'}"`,
      `"${l.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LibraSphere_AuditLog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toastSuccess('Audit logs exported to CSV.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <FileText className="w-8 h-8 text-indigo-600" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tamper-evident logs of every state change, checkout, return, hold, and admin configuration
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-bold text-xs rounded-xl shadow-sm transition disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by action name (e.g. LOAN_ISSUED)..."
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300"
        >
          <option value="">All Entity Types</option>
          <option value="LOAN">Loan Circulation</option>
          <option value="BOOK">Catalog Titles</option>
          <option value="BOOK_COPY">Physical Copies</option>
          <option value="RESERVATION">Reservations</option>
          <option value="FINE">Fines & Payments</option>
          <option value="USER">User Accounts</option>
          <option value="BRANCH">Branches</option>
          <option value="SETTING">System Settings</option>
        </select>
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase font-bold text-gray-500 tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3">Performed By</th>
                  <th className="px-5 py-3">Audit Details</th>
                  <th className="px-5 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-gray-600 dark:text-gray-300">
                      {log.entityType}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {log.user?.name || 'System Agent'}
                      </p>
                      {log.user?.role && (
                        <span className="text-[10px] text-gray-400 uppercase font-bold">
                          {log.user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="px-5 py-3 font-mono text-[10px] text-gray-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4">
          <p className="text-xs text-gray-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} audit events)
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
