import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate, formatCurrency } from '../../lib/utils';
import { Users, Search, ShieldAlert, CheckCircle2, Eye, Ban, UserCheck } from 'lucide-react';

export const MemberManagementPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [members, setMembers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Selected member detail modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userLoans, setUserLoans] = useState<any[]>([]);
  const [userFines, setUserFines] = useState<any[]>([]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/users?role=MEMBER&page=${page}&limit=15&search=${encodeURIComponent(search)}`);
      setMembers(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch members directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page, search]);

  const handleToggleStatus = async (user: User) => {
    const action = user.isActive ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${action} account for ${user.name}?`)) {
      return;
    }

    try {
      await api.put(`/users/${user.id}/${action}`, {});
      toastSuccess(`Account ${action}ed successfully.`);
      fetchMembers();
    } catch (err: any) {
      toastError(err.message || `Failed to ${action} account.`);
    }
  };

  const handleViewMemberDetails = async (user: User) => {
    setSelectedUser(user);
    try {
      const [loans, fines] = await Promise.all([
        api.get(`/users/${user.id}/loans`),
        api.get(`/users/${user.id}/fines`)
      ]);
      setUserLoans(loans || []);
      setUserFines(fines || []);
    } catch {
      setUserLoans([]);
      setUserFines([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2.5">
          <Users className="w-8 h-8 text-indigo-600" />
          <span>Member Directory</span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Search registered patrons, view current checkouts and fines, or manage account suspension
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name, email, membership card ID..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
        />
      </div>

      {/* Members Directory Table */}
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
                  <th className="px-5 py-3">Member Name & Email</th>
                  <th className="px-5 py-3">Membership ID</th>
                  <th className="px-5 py-3">Fines Balance</th>
                  <th className="px-5 py-3">Account Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
                      <p className="text-[11px] text-gray-500">{m.email}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-gray-700 dark:text-gray-300 font-bold">
                      {m.memberProfile?.membershipId || 'LIB-9999'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-bold ${m.memberProfile?.totalFines && m.memberProfile.totalFines > 0 ? 'text-rose-600' : 'text-gray-500'}`}>
                        {formatCurrency(m.memberProfile?.totalFines || 0)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {m.isActive ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleViewMemberDetails(m)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-[11px] font-bold transition inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(m)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition inline-flex items-center space-x-1 ${
                          m.isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60'
                        }`}
                      >
                        {m.isActive ? <Ban className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        <span>{m.isActive ? 'Suspend' : 'Activate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`Member Dossier: ${selectedUser.name}`}
          description={`ID: ${selectedUser.memberProfile?.membershipId || ''} • Joined: ${formatDate(selectedUser.createdAt)}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px]">Email</span>
                <p className="font-bold text-gray-900 dark:text-white mt-0.5">{selectedUser.email}</p>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px]">Phone</span>
                <p className="font-bold text-gray-900 dark:text-white mt-0.5">{selectedUser.phone || 'None provided'}</p>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px]">Membership Expiry</span>
                <p className="font-bold text-gray-900 dark:text-white mt-0.5">{formatDate(selectedUser.memberProfile?.membershipExpiry)}</p>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px]">Unpaid Fines</span>
                <p className="font-bold text-rose-600 mt-0.5">{formatCurrency(selectedUser.memberProfile?.totalFines || 0)}</p>
              </div>
            </div>

            {/* Loans list */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                Borrowing Records ({userLoans.length})
              </h4>
              <div className="max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 border rounded-xl p-2">
                {userLoans.length > 0 ? (
                  userLoans.map((l) => (
                    <div key={l.id} className="py-2 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{l.copy.book.title}</p>
                        <p className="text-[10px] text-gray-500">Due: {formatDate(l.dueDate)}</p>
                      </div>
                      <Badge status={l.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic py-2">No loans on record.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
