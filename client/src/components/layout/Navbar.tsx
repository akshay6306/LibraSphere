import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CATEGORIES } from '../../lib/categories';
import { CategoryIcon } from '../ui/CategoryIcon';
import { api } from '../../lib/api';
import {
  BookOpen,
  Sun,
  Moon,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Search,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Loader2,
  Grid
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [isSurpriseLoading, setIsSurpriseLoading] = useState(false);

  const megaMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'LIBRARIAN') return '/librarian';
    return '/dashboard';
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  const handleSurpriseMe = async () => {
    try {
      setIsSurpriseLoading(true);
      const res = await api.get('/books/random');
      const bookId = res?.id || res?.data?.id;
      if (bookId) {
        setCategoryMenuOpen(false);
        setMobileMenuOpen(false);
        navigate(`/books/${bookId}`);
      }
    } catch (err) {
      console.error('Failed to get random book', err);
    } finally {
      setIsSurpriseLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 transition-transform group-hover:scale-105">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-indigo-800 dark:from-indigo-400 dark:to-indigo-300 bg-clip-text text-transparent">
              LibraSphere
            </span>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 tracking-wider uppercase -mt-1">
              Library Consortium
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium text-gray-600 dark:text-gray-300">
          <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            Home
          </Link>

          {/* Browse Categories Mega-Menu Trigger */}
          <div className="relative" ref={megaMenuRef}>
            <button
              onClick={() => setCategoryMenuOpen(!categoryMenuOpen)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition ${
                categoryMenuOpen
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/60'
              }`}
            >
              <Grid className="w-4 h-4 text-indigo-500" />
              <span>Browse Categories</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  categoryMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Mega-Menu Overlay */}
            {categoryMenuOpen && (
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[920px] max-h-[82vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>Curated Catalog Directory</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold">
                        20 Categories • 2,300+ Books
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Explore literature, science, competitive exams, regional languages, and digital previews
                    </p>
                  </div>
                  <Link
                    to="/categories"
                    onClick={() => setCategoryMenuOpen(false)}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <span>View All Categories</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Categories Grid (4 columns) */}
                <div className="grid grid-cols-4 gap-4 py-4">
                  {CATEGORIES.map((cat) => (
                    <div
                      key={cat.id}
                      className="group p-2.5 rounded-xl hover:bg-indigo-50/70 dark:hover:bg-gray-800/80 transition border border-transparent hover:border-indigo-100 dark:hover:border-gray-700"
                    >
                      <Link
                        to={`/categories/${cat.slug}`}
                        onClick={() => setCategoryMenuOpen(false)}
                        className="flex items-center space-x-2.5 mb-1.5"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                          <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 leading-tight">
                          {cat.name}
                        </span>
                      </Link>

                      {/* Top subcategories */}
                      <div className="flex flex-wrap gap-1 pl-9">
                        {cat.subcategories.slice(0, 3).map((sub) => (
                          <Link
                            key={sub}
                            to={`/catalog?category=${encodeURIComponent(cat.name)}&subcategory=${encodeURIComponent(sub)}`}
                            onClick={() => setCategoryMenuOpen(false)}
                            className="text-[10px] text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:underline truncate max-w-[120px]"
                            title={sub}
                          >
                            {sub}
                          </Link>
                        ))}
                        {cat.subcategories.length > 3 && (
                          <Link
                            to={`/categories/${cat.slug}`}
                            onClick={() => setCategoryMenuOpen(false)}
                            className="text-[10px] text-indigo-500 font-medium hover:underline"
                          >
                            +{cat.subcategories.length - 3} more
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer bar with Surprise Me and Fast filters */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/60 dark:bg-gray-950/40 -mx-6 -mb-6 p-4 rounded-b-2xl">
                  <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">Popular shortcuts:</span>
                    <Link
                      to="/catalog?isNewArrival=true"
                      onClick={() => setCategoryMenuOpen(false)}
                      className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:text-indigo-600 transition"
                    >
                      ✨ New Arrivals
                    </Link>
                    <Link
                      to="/catalog?isStaffPick=true"
                      onClick={() => setCategoryMenuOpen(false)}
                      className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:text-indigo-600 transition"
                    >
                      ⭐ Staff Picks
                    </Link>
                    <Link
                      to="/catalog?category=Indian%20Authors%20%26%20Culture"
                      onClick={() => setCategoryMenuOpen(false)}
                      className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:text-indigo-600 transition"
                    >
                      🇮🇳 Indian Literature
                    </Link>
                    <Link
                      to="/catalog?hasPreview=true"
                      onClick={() => setCategoryMenuOpen(false)}
                      className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:text-indigo-600 transition"
                    >
                      📖 Free Previews
                    </Link>
                  </div>

                  <button
                    onClick={handleSurpriseMe}
                    disabled={isSurpriseLoading}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    {isSurpriseLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Surprise Me!</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link to="/catalog" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition">
            Browse Catalog
          </Link>

          {isAuthenticated && (
            <Link
              to={getDashboardPath()}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center space-x-1"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          )}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Quick Surprise Me Button for Desktop & Tablet */}
          <button
            onClick={handleSurpriseMe}
            disabled={isSurpriseLoading}
            title="Discover a random book from the collection"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800/60 transition disabled:opacity-50"
          >
            {isSurpriseLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            )}
            <span>Surprise Me</span>
          </button>

          {/* Quick Search Shortcut */}
          <Link
            to="/catalog"
            className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            title="Search Catalog"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Auth Menu */}
          {isAuthenticated && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 p-1.5 pl-3 rounded-full border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-gray-800 text-sm font-semibold transition"
              >
                <span className="text-gray-800 dark:text-gray-200 truncate max-w-[120px]">
                  {user.name}
                </span>
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800 py-1.5 z-50 animate-in fade-in">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                      {user.role}
                    </span>
                  </div>

                  <Link
                    to={getDashboardPath()}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 mr-2" />
                    Dashboard
                  </Link>

                  {user.role === 'MEMBER' && (
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <UserIcon className="w-3.5 h-3.5 mr-2" />
                      My Profile
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs font-semibold px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm shadow-indigo-600/30 transition"
              >
                Join Library
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 pt-2 pb-6 space-y-3 max-h-[85vh] overflow-y-auto">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Home
          </Link>

          <Link
            to="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Catalog Search
          </Link>

          <button
            onClick={handleSurpriseMe}
            disabled={isSurpriseLoading}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center space-x-2"
          >
            {isSurpriseLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Surprise Me (Random Book)</span>
          </button>

          {/* Mobile Categories Dropdown */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div className="flex items-center space-x-2">
                <Grid className="w-4 h-4 text-indigo-600" />
                <span>Categories Directory ({CATEGORIES.length})</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
            </button>

            {mobileCategoriesOpen && (
              <div className="pl-4 pr-2 pt-1 pb-2 space-y-1">
                <Link
                  to="/categories"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-1.5 rounded text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  View All 20 Categories Page →
                </Link>
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated && (
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30"
            >
              Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
