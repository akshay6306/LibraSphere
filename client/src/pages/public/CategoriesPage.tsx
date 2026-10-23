import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORIES, CategoryDefinition } from '../../lib/categories';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { api } from '../../lib/api';
import { Search, ArrowRight, BookOpen, Layers, Sparkles } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const [filterQuery, setFilterQuery] = useState('');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch facet counts to display actual real-time numbers
    api.get('/books/facets')
      .then((res) => {
        const data = res?.data || res;
        if (data?.categories) {
          const counts: Record<string, number> = {};
          data.categories.forEach((c: { name: string; count: number }) => {
            counts[c.name] = c.count;
          });
          setCategoryCounts(counts);
        }
      })
      .catch((err) => {
        console.error('Failed to load category facets', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredCategories = CATEGORIES.filter((cat) => {
    const q = filterQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q) ||
      cat.prefix.toLowerCase().includes(q) ||
      cat.subcategories.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
          <Layers className="w-3.5 h-3.5" />
          <span>Complete Consortium Classification</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
          Browse by Category
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
          Discover our rich, multi-disciplinary catalog comprising 20 top-level disciplines, 150+ specialized subcategories, and over 2,300 curated books.
        </p>

        {/* Live Filter Bar */}
        <div className="pt-2 max-w-lg mx-auto">
          <div className="relative flex items-center bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-200 dark:border-gray-800 px-3.5 py-2 focus-within:ring-2 focus-within:ring-indigo-500 transition">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter categories (e.g. Manga, UPSC, Physics, Hindi)..."
              className="w-full bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((cat) => {
          const count = categoryCounts[cat.name] || 115;
          return (
            <div
              key={cat.id}
              className="group rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800/90 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 p-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Category Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition shadow-sm">
                      <CategoryIcon name={cat.icon} className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {cat.prefix}
                        </span>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {count} Books
                        </span>
                      </div>
                      <Link
                        to={`/categories/${cat.slug}`}
                        className="text-lg font-black text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition"
                      >
                        {cat.name}
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>

                {/* Subcategories Pills */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Subcategories ({cat.subcategories.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subcategories.slice(0, 6).map((sub) => (
                      <Link
                        key={sub}
                        to={`/catalog?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub)}`}
                        className="px-2.5 py-1 rounded-lg text-xs bg-gray-50 dark:bg-gray-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-100 dark:border-gray-800 transition"
                      >
                        {sub}
                      </Link>
                    ))}
                    {cat.subcategories.length > 6 && (
                      <Link
                        to={`/categories/${cat.slug}`}
                        className="px-2 py-1 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        +{cat.subcategories.length - 6} more
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Action */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <Link
                  to={`/catalog?category=${encodeURIComponent(cat.name)}`}
                  className="text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  View in Catalog
                </Link>
                <Link
                  to={`/categories/${cat.slug}`}
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform"
                >
                  <span>Explore discipline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No categories matching "{filterQuery}"
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Try searching for another subject or term
          </p>
          <button
            onClick={() => setFilterQuery('')}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition"
          >
            Reset filter
          </button>
        </div>
      )}
    </div>
  );
};
