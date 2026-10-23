import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Book, Branch } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { BookCover } from '../../components/ui/BookCover';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Plus,
  Search,
  Barcode,
  Edit,
  Trash2,
  CopyPlus,
  BookOpen,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const CatalogManagementPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Add Book Modal State
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    isbn: '',
    title: '',
    author: '',
    category: 'Technology',
    publishedYear: 2024,
    publisher: '',
    pages: 350,
    price: 29.99,
    description: ''
  });

  // Add Copy Modal State
  const [addCopyModalOpen, setAddCopyModalOpen] = useState(false);
  const [selectedBookForCopy, setSelectedBookForCopy] = useState<Book | null>(null);
  const [copyBranchId, setCopyBranchId] = useState('');
  const [shelfLocation, setShelfLocation] = useState('Floor 1-Aisle T1-Sec 1');
  const [barcode, setBarcode] = useState('');

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/books?page=${page}&limit=10&query=${encodeURIComponent(search)}`);
      setBooks(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch catalog.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [page, search]);

  useEffect(() => {
    api.get('/branches').then((data) => {
      setBranches(data || []);
      if (data?.length > 0) setCopyBranchId(data[0].id);
    });
  }, []);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/books', newBook);
      toastSuccess('New title successfully added to library catalog!');
      setAddBookModalOpen(false);
      setNewBook({
        isbn: '',
        title: '',
        author: '',
        category: 'Technology',
        publishedYear: 2024,
        publisher: '',
        pages: 350,
        price: 29.99,
        description: ''
      });
      fetchBooks();
    } catch (err: any) {
      toastError(err.message || 'Failed to add title.');
    }
  };

  const handleOpenAddCopy = (book: Book) => {
    setSelectedBookForCopy(book);
    setBarcode(`BC-${Math.floor(Math.random() * 9000 + 1000)}-${Date.now().toString().slice(-2)}`);
    setAddCopyModalOpen(true);
  };

  const handleCreateCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookForCopy || !copyBranchId) return;

    try {
      await api.post('/copies', {
        bookId: selectedBookForCopy.id,
        branchId: copyBranchId,
        barcode,
        shelfLocation
      });
      toastSuccess(`Barcode ${barcode} registered for "${selectedBookForCopy.title}"!`);
      setAddCopyModalOpen(false);
      fetchBooks();
    } catch (err: any) {
      toastError(err.message || 'Failed to add copy.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Catalog & Copies Management
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Maintain catalog records, assign barcodes, and manage shelf inventory
          </p>
        </div>

        <button
          onClick={() => setAddBookModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Title</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Filter by title, author, ISBN..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
        />
      </div>

      {/* Catalog Table */}
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
                  <th className="px-5 py-3">Title & Author</th>
                  <th className="px-5 py-3">ISBN</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Copies (Avail/Total)</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-gray-900 dark:text-white line-clamp-1">
                        {book.title}
                      </p>
                      <p className="text-[11px] text-gray-500">{book.author}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                      {book.isbn}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {book.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={(book.availableCopies || 0) > 0 ? 'AVAILABLE' : 'BORROWED'}>
                        {book.availableCopies} / {book.totalCopies} In Stock
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenAddCopy(book)}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] rounded-lg transition inline-flex items-center space-x-1"
                      >
                        <CopyPlus className="w-3.5 h-3.5" />
                        <span>Add Copy</span>
                      </button>
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
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} titles)
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

      {/* Add New Title Modal */}
      <Modal
        isOpen={addBookModalOpen}
        onClose={() => setAddBookModalOpen(false)}
        title="Add New Catalog Book"
        description="Register a new academic or literary title into LibraSphere"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateBook} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Title *
              </label>
              <input
                type="text"
                required
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Author *
              </label>
              <input
                type="text"
                required
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                ISBN *
              </label>
              <input
                type="text"
                required
                value={newBook.isbn}
                onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                placeholder="978-0-..."
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Category
              </label>
              <select
                value={newBook.category}
                onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              >
                {['Technology', 'Science', 'Fiction', 'Non-Fiction', 'History', 'Philosophy', 'Art', 'Mathematics', 'Engineering', 'Medicine'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Year
              </label>
              <input
                type="number"
                value={newBook.publishedYear}
                onChange={(e) => setNewBook({ ...newBook, publishedYear: parseInt(e.target.value) || 2024 })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Publisher
              </label>
              <input
                type="text"
                value={newBook.publisher}
                onChange={(e) => setNewBook({ ...newBook, publisher: e.target.value })}
                placeholder="Academic Press"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Pages
              </label>
              <input
                type="number"
                value={newBook.pages}
                onChange={(e) => setNewBook({ ...newBook, pages: parseInt(e.target.value) || 100 })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Replacement Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={newBook.price}
                onChange={(e) => setNewBook({ ...newBook, price: parseFloat(e.target.value) || 19.99 })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
              Description / Synopsis
            </label>
            <textarea
              rows={3}
              value={newBook.description}
              onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setAddBookModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
            >
              Save Title
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Copy Modal */}
      {selectedBookForCopy && (
        <Modal
          isOpen={addCopyModalOpen}
          onClose={() => setAddCopyModalOpen(false)}
          title="Add Physical Copy"
          description={`Add inventory copy for "${selectedBookForCopy.title}"`}
        >
          <form onSubmit={handleCreateCopy} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Target Library Branch *
              </label>
              <select
                value={copyBranchId}
                onChange={(e) => setCopyBranchId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Generated / Scanned Barcode *
              </label>
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Shelf Location *
              </label>
              <input
                type="text"
                required
                value={shelfLocation}
                onChange={(e) => setShelfLocation(e.target.value)}
                placeholder="Floor 2-Aisle B4-Sec 2"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setAddCopyModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
              >
                Register Copy
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
