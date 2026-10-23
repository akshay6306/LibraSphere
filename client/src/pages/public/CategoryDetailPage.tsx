import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { CATEGORY_SLUG_MAP, CategoryDefinition } from '../../lib/categories';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { BookCover } from '../../components/ui/BookCover';
import { api } from '../../lib/api';
import { Book } from '../../types';
import {
  ChevronRight,
  Star,
  BookOpen,
  ArrowRight,
  Filter,
  Layers,
  ChevronLeft,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export const CategoryDetailPage: React.FC = () => {
  const { categorySlug, subcategorySlug } = useParams<{
    categorySlug: string;
    subcategorySlug?: string;
  }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const category = CATEGORY_SLUG_MAP.get(categorySlug || '');

  // Active subcategory from url param or query param
  const activeSubcategory =
    subcategorySlug || searchParams.get('subcategory') || 'all';

  const [sort, setSort] = useState(searchParams.get('sort') || 'rating');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 16, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!category) return;

    setIsLoading(true);
    const params = new URLSearchParams();
    params.set('category', category.name);
    if (activeSubcategory && activeSubcategory !== 'all') {
      params.set('subcategory', activeSubcategory);
    }
    params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', '16');

    api.get(`/books?${params.toString()}`)
      .then((res: any) => {
        const bookList = res?.data || (Array.isArray(res) ? res : []);
        setBooks(bookList);
        if (res?.pagination) {
          setPagination(res.pagination);
        }
      })
      .catch((err) => {
        console.error('Failed to load category books', err);
        setBooks([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [category, activeSubcategory, sort, page]);

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
          Category Not Found
        </h2>
        <p className="text-sm text-gray-500">
          The requested category "{categorySlug}" does not exist in our library catalog.
        </p>
        <Link
          to="/categories"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
        >
          View All Categories
        </Link>
      </div>
    );
  }

  const handleSubcategoryClick = (sub: string) => {
    setPage(1);
    if (sub === 'all') {
      searchParams.delete('subcategory');
    } else {
      searchParams.set('subcategory', sub);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/categories" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Categories
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 dark:text-white font-semibold">
          {category.name}
        </span>
        {activeSubcategory !== 'all' && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              {activeSubcategory}
            </span>
          </>
        )}
      </nav>

      {/* Hero Category Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center shrink-0 border border-white/20">
              <CategoryIcon name={category.icon} className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wider">
                  PREFIX: {category.prefix}
                </span>
                <span className="text-indigo-200 text-xs font-semibold">
                  {pagination.total > 0 ? `${pagination.total} Available Books` : '100+ Books'}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                {category.name}
              </h1>
              <p className="text-sm text-indigo-100 leading-relaxed">
                {category.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to={`/catalog?category=${encodeURIComponent(category.name)}`}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 shadow-md transition"
            >
              Open in Filterable Catalog
            </Link>
          </div>
        </div>
      </div>

      {/* Subcategories Horizontal Pills Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Subcategories in {category.name}
          </span>
          <span className="text-xs text-gray-400">
            {category.subcategories.length} subfields
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleSubcategoryClick('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-sm ${
              activeSubcategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-indigo-400'
            }`}
          >
            All Subcategories
          </button>
          {category.subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => handleSubcategoryClick(sub)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition shadow-sm ${
                activeSubcategory === sub
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-indigo-400'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Sort and Results Counter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Showing <span className="font-bold text-gray-900 dark:text-white">{books.length}</span> of{' '}
          <span className="font-bold text-gray-900 dark:text-white">{pagination.total}</span> books in{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {activeSubcategory === 'all' ? category.name : `${category.name} › ${activeSubcategory}`}
          </span>
        </div>

        {/* Sort selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="rating">Highest Rated ★</option>
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="title_asc">Title (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-3 animate-pulse"
            >
              <div className="w-full h-60 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => {
            const bookRating = book.rating || book.avgRating || 4.5;
            return (
              <div
                key={book.id}
                className="group bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800/90 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200"
              >
                <div className="space-y-3.5">
                  {/* Cover */}
                  <Link
                    to={`/books/${book.id}`}
                    className="relative flex justify-center bg-gray-50 dark:bg-gray-950/60 rounded-xl p-3 overflow-hidden"
                  >
                    <BookCover
                      title={book.title}
                      category={book.category}
                      coverUrl={book.coverUrl}
                      size="md"
                      className="group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                      {book.isNewArrival && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white shadow-sm">
                          NEW
                        </span>
                      )}
                      {book.isStaffPick && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-600 text-white shadow-sm">
                          STAFF PICK
                        </span>
                      )}
                    </div>

                    {book.previewUrl && (
                      <div className="absolute bottom-2 right-2">
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-black/70 text-white backdrop-blur-sm">
                          Preview
                        </span>
                      </div>
                    )}
                  </Link>

                  {/* Metadata */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[130px]">
                        {book.subcategory || book.category}
                      </span>
                      <div className="flex items-center space-x-0.5 text-amber-500 font-bold shrink-0">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{bookRating.toFixed(1)}</span>
                      </div>
                    </div>

                    <Link to={`/books/${book.id}`}>
                      <h3
                        className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug"
                        title={book.title}
                      >
                        {book.title}
                      </h3>
                    </Link>

                    <Link
                      to={`/authors/${encodeURIComponent(book.author)}`}
                      className="text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:underline block truncate"
                      title={book.author}
                    >
                      {book.author}
                    </Link>

                    {book.seriesName && (
                      <Link
                        to={`/series/${encodeURIComponent(book.seriesName)}`}
                        className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold block truncate hover:underline"
                      >
                        Series: {book.seriesName} {book.seriesNumber ? `#${book.seriesNumber}` : ''}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-medium">
                    {book.format || 'Hardcover'}
                  </span>
                  <Link
                    to={`/books/${book.id}`}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>View Book</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 space-y-3">
          <BookOpen className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No books found in this subcategory
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Try switching to "All Subcategories" to browse all {category.name} titles.
          </p>
          <button
            onClick={() => handleSubcategoryClick('all')}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
          >
            Show All {category.name} Books
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-3 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold px-2">
            Page {page} of {pagination.totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
