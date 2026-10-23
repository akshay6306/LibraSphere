import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Branch } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { Building2, Plus, Edit, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';

export const BranchManagementPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    isActive: true
  });

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const data = await api.get('/branches');
      setBranches(data || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch branches.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setForm({
      name: '',
      address: '',
      phone: '',
      email: '',
      isActive: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (b: Branch) => {
    setEditingBranch(b);
    setForm({
      name: b.name,
      address: b.address,
      phone: b.phone,
      email: b.email,
      isActive: b.isActive
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await api.put(`/branches/${editingBranch.id}`, form);
        toastSuccess(`Branch "${form.name}" updated successfully.`);
      } else {
        await api.post('/branches', form);
        toastSuccess(`Branch "${form.name}" created successfully.`);
      }
      setModalOpen(false);
      fetchBranches();
    } catch (err: any) {
      toastError(err.message || 'Failed to save branch.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center space-x-2.5">
            <Building2 className="w-8 h-8 text-indigo-600" />
            <span>Library Branches</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage physical campus library facilities, contact numbers, and assigned librarians
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {branches.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {b.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                    }`}
                  >
                    {b.isActive ? 'OPERATIONAL' : 'INACTIVE'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-500">
                  <p className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 mt-0.5" />
                    <span>{b.address}</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    <span>{b.phone}</span>
                  </p>
                  <p className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    <span>{b.email}</span>
                  </p>
                </div>

                {b.manager && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs">
                    <span className="text-[10px] font-bold uppercase text-gray-400 block">
                      Branch Manager
                    </span>
                    <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                      {b.manager.name}
                    </p>
                    <p className="text-[11px] text-gray-500">{b.manager.email}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-500">
                  {b._count?.copies || 0} Stocked Copies
                </span>
                <button
                  onClick={() => handleOpenEdit(b)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-[11px] transition inline-flex items-center space-x-1"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit Facility</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Branch Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBranch ? 'Edit Branch Details' : 'Create Library Branch'}
        description="Physical facility address and contact configurations"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
              Branch Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Science & Engineering Library"
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
              Address *
            </label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Building 4, Room 100, North Campus"
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Phone *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1-555-0199"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="branch@libra.test"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <label htmlFor="isActive" className="font-semibold text-gray-700 dark:text-gray-300">
              Active & Operational
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              Save Branch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
