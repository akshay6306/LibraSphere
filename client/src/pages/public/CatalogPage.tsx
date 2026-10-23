import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Book, Branch } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { BookCover } from '../../components/ui/BookCover';
import {
  Search,
  Filter,
  Star,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  Sparkles,
  Check,
  ChevronDown,
  RotateCcw,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter state synced with URL searchParams
  const query = searchParams.get('query') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  const selectedSubcategory = searchParams.get('subcategory') || '';
  const selectedLanguage = searchParams.get('language') || '';
  const selectedFormat = searchParams.get('format') || '';
  const selectedAgeRange = searchParams.get('ageRange') || '';
  const minRating = searchParams.get('minRating') || '';
  const selectedBranch = searchParams.get('branchId') || '';
  const onlyAvailable = searchParams.get('available') === 'true';
  const isNewArrival = searchParams.get('isNewArrival') === 'true';
  const isStaffPick = searchParams.get('isStaffPick') === 'true';
  const hasPreview = searchParams.get('hasPreview') === 'true';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;

  // Local state for search input to allow smooth typing
  const [searchInput, setSearchInput] = useState(query);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Data state
  const [books, setBooks] = useState<Book[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [facets, setFacets] = useState<{
    categories: { name: string; count: number }[];
    subcategories: { name: string; count: number }[];
    languages: { code: string; count: number }[];
    formats: { name: string; count: number }[];
    ageRanges: { name: string; count: number }[];
  }>({
    categories: [],
    subcategories: [],
    languages: [],
    formats: [],
    ageRanges: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync search input if URL changes
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  // Load branches and facets on mount
  useEffect(() => {
    api.get('/branches')
      .then((data) => setBranches(data || []))
      .catch(() => {});

    api.get('/books/facets')
      .then((res) => {
        const data = res?.data || res;
        if (data) {
          setFacets({
            categories: data.categories || [],
            subcategories: data.subcategories || [],
            languages: data.languages || [],
            formats: data.formats || [],
            ageRanges: data.ageRanges || []
          });
        }
      })
      .catch(() => {});
  }, []);

  // Fetch search suggestions when search input has 2+ characters
  useEffect(() => {
    if (searchInput.trim().length >= 2) {
      const timer = setTimeout(() => {
        api.get(`/books/suggestions?q=${encodeURIComponent(searchInput.trim())}`)
          .then((res) => {
            const list = res?.data || (Array.isArray(res) ? res : []);
            setSuggestions(list.slice(0, 5));
          })
          .catch(() => setSuggestions([]));
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [searchInput]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch books whenever URL query params change
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (selectedCategory && selectedCategory !== 'All') params.set('category', selectedCategory);
    if (selectedSubcategory) params.set('subcategory', selectedSubcategory);
    if (selectedLanguage) params.set('language', selectedLanguage);
    if (selectedFormat) params.set('format', selectedFormat);
    if (selectedAgeRange) params.set('ageRange', selectedAgeRange);
    if (minRating) params.set('minRating', minRating);
    if (selectedBranch) params.set('branchId', selectedBranch);
    if (onlyAvailable) params.set('available', 'true');
    if (isNewArrival) params.set('isNewArrival', 'true');
    if (isStaffPick) params.set('isStaffPick', 'true');
    if (hasPreview) params.set('hasPreview', 'true');
    if (sort) params.set('sort', sort);
    params.set('page', String(page));
    params.set('limit', '12');

    api.get(`/books?${params.toString()}`)
      .then((res: any) => {
        const bookList = res?.data || (Array.isArray(res) ? res : []);
        setBooks(bookList);
        if (res?.pagination) {
          setPagination(res.pagination);
        }
      })
      .catch((err) => {
        console.error('Failed to load books', err);
        setBooks([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [
    query,
    selectedCategory,
    selectedSubcategory,
    selectedLanguage,
    selectedFormat,
    selectedAgeRange,
    minRating,
    selectedBranch,
    onlyAvailable,
    isNewArrival,
    isStaffPick,
    hasPreview,
    sort,
    page
  ]);

  const updateParam = (key: string, value: string | boolean | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === null || value === '' || value === false || value === 'All') {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value));
    }
    newParams.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    updateParam('query', searchInput.trim());
  };

  const handleResetAllFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  // Get current active subcategories based on chosen category
  const activeCategoryDefinition = useMemo(() => {
    return CATEGORIES.find((c) => c.name === selectedCategory);
  }, [selectedCategory]);

  // Language code map for human-readable labels
  const getLanguageLabel = (code: string) => {
    const map: Record<string, string> = {
      en: 'English (en)',
      English: 'English',
      hi: 'Hindi (हिन्दी)',
      bn: 'Bengali (বাংলা)',
      sa: 'Sanskrit (संस्कृतम्)',
      ur: 'Urdu (اردو)',
      ta: 'Tamil (தமிழ்)',
      te: 'Telugu (తెలుగు)',
      mr: 'Marathi (मराठी)',
      pa: 'Punjabi (ਪੰਜਾਬੀ)',
      gu: 'Gujarati (ગુજરાતી)',
      ml: 'Malayalam (മലയാളം)',
      kn: 'Kannada (ಕನ್ನಡ)',
      fr: 'French (Français)',
      de: 'German (Deutsch)',
      es: 'Spanish (Español)',
      ja: 'Japanese (日本語)'
    };
    return map[code] || code;
  };

  const activeFiltersCount = [
    selectedCategory !== 'All',
    Boolean(selectedSubcategory),
    Boolean(selectedLanguage),
    Boolean(selectedFormat),
    Boolean(selectedAgeRange),
    Boolean(minRating),
    Boolean(selectedBranch),
    onlyAvailable,
    isNewArrival,
    isStaffPick,
    hasPreview
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Library Catalog
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Search 2,300+ titles across 20 disciplines with multi-branch copy availability
          </p>
        </div>

        {/* Search Bar with autocomplete suggestions */}
        <div className="relative w-full md:w-[420px]" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5" />
            <input
              type="text"
              value={searchInput}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="Search title, author, ISBN, series..."
              className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white shadow-sm"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  updateParam('query', null);
                }}
                className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Autocomplete / Typo suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in">
              <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Matching Suggestions
              </div>
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchInput(item);
                    setShowSuggestions(false);
                    updateParam('query', item);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:text-indigo-600 flex items-center justify-between"
                >
                  <span className="truncate">{item}</span>
                  <Search className="w-3 h-3 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Layout: Left Filters + Right Books Grid */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden w-full flex items-center justify-between">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span>Faceted Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-600 text-white text-[10px]">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetAllFilters}
              className="text-xs font-semibold text-rose-600 hover:underline"
            >
              Reset all
            </button>
          )}
        </div>

        {/* Sidebar Filters */}
        <aside
          className={`w-full lg:w-72 shrink-0 space-y-6 ${
            mobileFilterOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/90 dark:border-gray-800 p-5 space-y-6 shadow-sm">
            {/* Filter Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                  Filters
                </span>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </div>

              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetAllFilters}
                  className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center space-x-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Quick Feature Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                Availability & Flags
              </label>

              <label className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => updateParam('available', e.target.checked ? true : null)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Available to borrow now</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={(e) => updateParam('isNewArrival', e.target.checked ? true : null)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center space-x-1">
                  <span>✨ New Arrivals</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStaffPick}
                  onChange={(e) => updateParam('isStaffPick', e.target.checked ? true : null)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center space-x-1">
                  <span>⭐ Staff Picks</span>
                </span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPreview}
                  onChange={(e) => updateParam('hasPreview', e.target.checked ? true : null)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center space-x-1">
                  <span>📖 Free Previews</span>
                </span>
              </label>
            </div>

            {/* Branch Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                Campus Branch
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => updateParam('branchId', e.target.value || null)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">All Branches (All Campuses)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                Discipline Category ({CATEGORIES.length})
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  updateParam('category', e.target.value === 'All' ? null : e.target.value);
                  updateParam('subcategory', null); // Reset subcategory when category changes
                }}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="All">All Categories (2,300+)</option>
                {CATEGORIES.map((c) => {
                  const facet = facets.categories.find((fc) => fc.name === c.name);
                  const count = facet ? facet.count : 115;
                  return (
                    <option key={c.id} value={c.name}>
                      {c.name} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Subcategory Filter (if category selected) */}
            {activeCategoryDefinition && (
              <div className="space-y-2 animate-in fade-in">
                <label className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Subcategory in {activeCategoryDefinition.name}
                </label>
                <select
                  value={selectedSubcategory}
                  onChange={(e) => updateParam('subcategory', e.target.value || null)}
                  className="w-full bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="">All Subcategories</option>
                  {activeCategoryDefinition.subcategories.map((sub) => {
                    const facet = facets.subcategories.find((sf) => sf.name === sub);
                    return (
                      <option key={sub} value={sub}>
                        {sub} {facet ? `(${facet.count})` : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Language Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => updateParam('language', e.target.value || null)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">All Languages</option>
                {facets.languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {getLanguageLabel(l.code)} ({l.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Format Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                Book Format
              </label>
              <div className="space-y-1">
                {facets.formats.map((f) => (
                  <label
                    key={f.name}
                    className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300 cursor-pointer p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="format_filter"
                        checked={selectedFormat === f.name}
                        onChange={() =>
                          updateParam('format', selectedFormat === f.name ? null : f.name)
                        }
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{f.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">({f.count})</span>
                  </label>
                ))}
                {selectedFormat && (
                  <button
                    onClick={() => updateParam('format', null)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline pt-1 block"
                  >
                    Clear format filter
                  </button>
                )}
              </div>
            </div>

            {/* Age Range Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                Target Age Group
              </label>
              <select
                value={selectedAgeRange}
                onChange={(e) => updateParam('ageRange', e.target.value || null)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="">All Age Groups</option>
                {facets.ageRanges.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name} ({a.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Minimum Rating Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                Minimum Rating
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { label: 'Any Rating', val: '' },
                  { label: '4.0+ ★', val: '4' },
                  { label: '4.5+ ★', val: '4.5' },
                  { label: '5.0 ★', val: '5' }
                ].map((r) => (
                  <button
                    key={r.val}
                    onClick={() => updateParam('minRating', r.val || null)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold text-center border transition ${
                      minRating === r.val
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex-1 w-full space-y-6">
          {/* Active Filter Badges Bar */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                Active Filters:
              </span>

              {selectedCategory !== 'All' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-medium">
                  <span>Category: {selectedCategory}</span>
                  <button onClick={() => updateParam('category', null)}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-700" />
                  </button>
                </span>
              )}

              {selectedSubcategory && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-medium">
                  <span>Subfield: {selectedSubcategory}</span>
                  <button onClick={() => updateParam('subcategory', null)}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-700" />
                  </button>
                </span>
              )}

              {selectedLanguage && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-medium">
                  <span>Lang: {selectedLanguage}</span>
                  <button onClick={() => updateParam('language', null)}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-700" />
                  </button>
                </span>
              )}

              {selectedFormat && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-medium">
                  <span>Format: {selectedFormat}</span>
                  <button onClick={() => updateParam('format', null)}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-700" />
                  </button>
                </span>
              )}

              {minRating && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-medium">
                  <span>Rating: {minRating}★+</span>
                  <button onClick={() => updateParam('minRating', null)}>
                    <X className="w-3 h-3 text-gray-400 hover:text-gray-700" />
                  </button>
                </span>
              )}

              {onlyAvailable && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold">
                  <span>Available Now</span>
                  <button onClick={() => updateParam('available', null)}>
                    <X className="w-3 h-3 hover:opacity-75" />
                  </button>
                </span>
              )}

              <button
                onClick={handleResetAllFilters}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Result Count and Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-gray-200 dark:border-gray-800">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing <span className="font-bold text-gray-900 dark:text-white">{books.length}</span> of{' '}
              <span className="font-bold text-gray-900 dark:text-white">{pagination.total.toLocaleString()}</span>{' '}
              cataloged books
              {query && (
                <span>
                  {' '}
                  matching "<span className="font-bold text-indigo-600 dark:text-indigo-400">{query}</span>"
                </span>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="text-xs font-semibold bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-1.5 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="rating">Highest Rated ★</option>
                <option value="popular">Most Popular</option>
                <option value="title_asc">Title (A - Z)</option>
                <option value="year_desc">Year (Latest First)</option>
              </select>
            </div>
          </div>

          {/* Book Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-3 animate-pulse"
                >
                  <div className="w-full h-52 bg-gray-200 dark:bg-gray-800 rounded-xl" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {books.map((book) => {
                const bookRating = book.rating || book.avgRating || 4.5;
                return (
                  <div
                    key={book.id}
                    className="group bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800/90 hover:border-indigo-400 dark:hover:border-indigo-600 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200"
                  >
                    <div className="space-y-3">
                      {/* Cover & Badges */}
                      <Link
                        to={`/books/${book.id}`}
                        className="relative flex justify-center bg-gray-50 dark:bg-gray-950/60 rounded-xl p-2.5 overflow-hidden"
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
                              PICK
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
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400 truncate max-w-[110px]">
                            {book.subcategory || book.category}
                          </span>
                          <div className="flex items-center space-x-0.5 text-amber-500 font-bold shrink-0">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{bookRating.toFixed(1)}</span>
                          </div>
                        </div>

                        <Link to={`/books/${book.id}`}>
                          <h3
                            className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug"
                            title={book.title}
                          >
                            {book.title}
                          </h3>
                        </Link>

                        <Link
                          to={`/authors/${encodeURIComponent(book.author)}`}
                          className="text-[11px] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:underline block truncate"
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

                    {/* Bottom Pill & Details Action */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px]">
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium">
                        {book.format || 'Hardcover'}
                      </span>
                      <Link
                        to={`/books/${book.id}`}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center space-x-0.5"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 space-y-4">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                No catalog titles match your filter criteria
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Try loosening your filters or resetting query terms to browse across our full 2,300+ book collection.
              </p>
              <button
                onClick={handleResetAllFilters}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md transition"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-3 pt-8 pb-4">
              <button
                onClick={() => updateParam('page', String(Math.max(1, page - 1)))}
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
                onClick={() => updateParam('page', String(Math.min(pagination.totalPages, page + 1)))}
                disabled={page >= pagination.totalPages}
                className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
