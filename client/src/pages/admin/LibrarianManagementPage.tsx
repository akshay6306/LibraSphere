import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User, Branch } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { formatDate } from '../../lib/utils';
import { UserCheck, Plus, Mail, Phone, Building2, Ban, ShieldCheck } from 'lucide-react';

export const LibrarianManagementPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [librarians, setLibrarians] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Librarian Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    branchId: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, branchRes] = await Promise.all([
        api.get('/users?role=LIBRARIAN'),
        api.get('/branches')
      ]);
      setLibrarians(usersRes.data || []);
      setBranches(branchRes || []);
      if (branchRes?.length > 0) {
        setForm((prev) => ({ ...prev, branchId: branchRes[0].id }));
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch librarians.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLibrarian = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/librarians', form);
      toastSuccess(`Librarian account for "${form.name}" created successfully!`);
      setCreateModalOpen(false);
      setForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        branchId: branches[0]?.id || ''
      });
      fetchData();
    } catch (err: any) {
      toastError(err.message || 'Failed to create librarian.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const action = user.isActive ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${action} ${user.name}?`)) return;

    try {
      await api.put(`/users/${user.id}/${action}`, {});
      toastSuccess(`Librarian account ${action}ed.`);
      fetchData();
    } catch (err: any) {
      toastError(err.message || 'Status toggle failed.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <UserCheck className="w-8 h-8 text-indigo-600" />
            <span>Library Staff & Librarians</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage authorized circulation librarians, branch desk supervisors, and permissions
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Librarian Staff</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-800/60 uppercase font-bold text-gray-500 tracking-wider text-[10px] border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3">Librarian Name</th>
                  <th className="px-5 py-3">Contact Email</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Joined Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {librarians.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {l.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{l.name}</p>
                          <span className="text-[10px] font-bold text-indigo-600">LIBRARIAN STAFF</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 font-mono">
                      {l.email}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {l.phone || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {formatDate(l.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.isActive
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        {l.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleStatus(l)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition inline-flex items-center space-x-1 ${
                          l.isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60'
                        }`}
                      >
                        {l.isActive ? <Ban className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        <span>{l.isActive ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Librarian Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add Librarian Staff Member"
        description="Grants circulation desk permissions to manage inventory, checkouts, and holds"
      >
        <form onSubmit={handleCreateLibrarian} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Marcus Brody"
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="librarian@libra.test"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Initial Password *
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1-555-0155"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Assigned Branch Manager
              </label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
