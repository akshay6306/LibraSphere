import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Book, Branch } from '../../types';
import { CATEGORIES } from '../../lib/categories';
import { CategoryIcon } from '../../components/ui/CategoryIcon';
import { BookCarouselRow } from '../../components/books/BookCarouselRow';
import {
  Search,
  BookOpen,
  Users,
  Building2,
  BookmarkCheck,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Compass,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  GraduationCap,
  Languages,
  Headphones,
  Award
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalMembers: 30,
    totalBooks: 2300,
    totalBranches: 3,
    totalLoans: 101
  });

  const [homeSections, setHomeSections] = useState<{
    newArrivals: Book[];
    staffPicks: Book[];
    topRated: Book[];
    trending: Book[];
    childrenCorner: Book[];
    indianAuthors: Book[];
    examPrep: Book[];
    freePreviews: Book[];
  }>({
    newArrivals: [],
    staffPicks: [],
    topRated: [],
    trending: [],
    childrenCorner: [],
    indianAuthors: [],
    examPrep: [],
    freePreviews: []
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(true);

  useEffect(() => {
    // Fetch overview stats
    api.get('/reports/overview')
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});

    // Fetch home merchandising sections
    setIsLoadingSections(true);
    api.get('/books/home-sections')
      .then((res) => {
        const data = res?.data || res;
        if (data) {
          setHomeSections({
            newArrivals: data.newArrivals || [],
            staffPicks: data.staffPicks || [],
            topRated: data.topRated || [],
            trending: data.trending || [],
            childrenCorner: data.childrenCorner || [],
            indianAuthors: data.indianAuthors || [],
            examPrep: data.examPrep || [],
            freePreviews: data.freePreviews || []
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load home sections', err);
      })
      .finally(() => {
        setIsLoadingSections(false);
      });

    // Fetch branches
    api.get('/branches')
      .then((res) => {
        if (res) setBranches(res);
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  const handleSurpriseMe = async () => {
    try {
      const res = await api.get('/books/random');
      const bookId = res?.id || res?.data?.id;
      if (bookId) {
        navigate(`/books/${bookId}`);
      }
    } catch {
      navigate('/catalog');
    }
  };

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-transparent dark:from-indigo-950/30 dark:via-gray-950 dark:to-gray-950 pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-100/90 dark:bg-indigo-950/90 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-6 border border-indigo-200 dark:border-indigo-800 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>20 Categories • 2,300+ Verified Books • 6,600+ Physical Copies</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight">
            Discover, reserve, and borrow from over{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 bg-clip-text text-transparent">
              2,300+ curated volumes
            </span>.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            LibraSphere powers high-performance catalog search, instant multi-branch hold queues, exam preparation resources, and multilingual literature for 5M readers.
          </p>

          {/* Quick Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 max-w-2xl mx-auto flex items-center bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200/90 dark:border-gray-800 p-2 focus-within:ring-2 focus-within:ring-indigo-500 transition"
          >
            <div className="pl-3 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, ISBN, series, or keywords..."
              className="w-full px-4 py-2.5 bg-transparent text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center space-x-1.5 shrink-0"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Quick Category Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            <span className="text-xs text-gray-400 font-medium">Popular:</span>
            {[
              { name: 'Fiction', slug: 'fiction' },
              { name: 'UPSC & JEE Prep', slug: 'education-exam-prep' },
              { name: 'Indian Classics', slug: 'indian-authors-culture' },
              { name: 'Manga & Comics', slug: 'comics-manga-graphic-novels' },
              { name: 'Tech & AI', slug: 'technology-computing' },
              { name: 'Children’s Corner', slug: 'childrens-books' }
            ].map((chip) => (
              <Link
                key={chip.slug}
                to={`/categories/${chip.slug}`}
                className="px-3 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-600 text-gray-700 dark:text-gray-300 hover:text-indigo-600 transition"
              >
                {chip.name}
              </Link>
            ))}
            <button
              onClick={handleSurpriseMe}
              className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition inline-flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Surprise Me</span>
            </button>
          </div>
        </div>
      </section>

      {/* Real-time Library Metrics Counter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 shadow-xl">
          <div className="flex items-center space-x-3.5 p-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {stats.totalBooks.toLocaleString()}+
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Curated Volumes
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 p-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {stats.totalMembers.toLocaleString()}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Active Members
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 p-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {stats.totalBranches}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Connected Branches
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 p-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookmarkCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
                {stats.totalLoans.toLocaleString()}
              </p>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Circulations Completed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Merchandising Section 1: Trending & New Arrivals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <BookCarouselRow
          title="Trending This Month"
          subtitle="Most circulated books across all branches"
          icon="🔥"
          badge="High Demand"
          badgeColor="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
          viewAllUrl="/catalog?sort=popular"
          books={homeSections.trending}
          isLoading={isLoadingSections}
        />

        <BookCarouselRow
          title="New Arrivals"
          subtitle="Fresh additions just cataloged and placed on shelves"
          icon="✨"
          badge="Latest Intake"
          badgeColor="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
          viewAllUrl="/catalog?isNewArrival=true"
          books={homeSections.newArrivals}
          isLoading={isLoadingSections}
        />

        <BookCarouselRow
          title="Staff Picks & Librarian Curations"
          subtitle="Hand-selected by senior librarians across North, South & Central branches"
          icon="⭐"
          badge="Curator Choice"
          badgeColor="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          viewAllUrl="/catalog?isStaffPick=true"
          books={homeSections.staffPicks}
          isLoading={isLoadingSections}
        />
      </section>

      {/* Featured Categories Directory Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Explore by Category
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Browse 20 distinct academic and literary disciplines with 100+ volumes each
            </p>
          </div>
          <Link
            to="/categories"
            className="inline-flex items-center space-x-1.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>View All 20 Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {CATEGORIES.slice(0, 12).map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="group p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                <CategoryIcon name={cat.icon} className="w-5 h-5" />
              </div>
              <div className="mt-4">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {cat.subcategories.length} subfields
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Merchandising Section 2: Indian Authors, Exam Prep, Children's, Previews */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <BookCarouselRow
          title="Indian Authors & Cultural Classics"
          subtitle="Celebrated regional literature, civilizational epics, and modern Indian narratives"
          icon="🇮🇳"
          badge="Multilingual & Heritage"
          badgeColor="bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
          viewAllUrl="/catalog?category=Indian%20Authors%20%26%20Culture"
          books={homeSections.indianAuthors}
          isLoading={isLoadingSections}
        />

        <BookCarouselRow
          title="Competitive Exam Prep & Academic Success"
          subtitle="Essential resources for GATE, JEE, NEET, UPSC Civil Services, and CAT"
          icon="🎯"
          badge="Exam Hall"
          badgeColor="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
          viewAllUrl="/catalog?category=Education%20%26%20Exam%20Prep"
          books={homeSections.examPrep}
          isLoading={isLoadingSections}
        />

        <BookCarouselRow
          title="Children's Corner & Middle Grade"
          subtitle="Captivating tales, illustrated adventures, and early learning favorites"
          icon="🎈"
          badge="Ages 4-12"
          badgeColor="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300"
          viewAllUrl="/catalog?category=Children%27s%20Books"
          books={homeSections.childrenCorner}
          isLoading={isLoadingSections}
        />

        <BookCarouselRow
          title="Interactive Digital Previews"
          subtitle="Read sample pages and chapters online before placing your hold"
          icon="📖"
          badge="Sample Available"
          badgeColor="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
          viewAllUrl="/catalog?hasPreview=true"
          books={homeSections.freePreviews}
          isLoading={isLoadingSections}
        />

        <BookCarouselRow
          title="Highest Rated Masterpieces"
          subtitle="Top rated 5.0-star books based on reader reviews and consortium ratings"
          icon="🏆"
          badge="5.0 ★ Club"
          badgeColor="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          viewAllUrl="/catalog?sort=rating"
          books={homeSections.topRated}
          isLoading={isLoadingSections}
        />
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900/40 dark:to-gray-950 py-16 border-y border-gray-200/80 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              Effortless Multi-Campus Borrowing
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              Three simple steps to access millions of pages across our connected branches
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Search & Locate
              </h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Query our real-time inventory across Central, North, and South Campus libraries. Filter by shelf code, branch availability, format, and language.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Place Smart Hold
              </h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                If all copies are checked out, join the automated FIFO reservation queue. When returned, the book is held exclusively for you for 48 hours.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Pickup & Easy Renewals
              </h3>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Show your digital membership QR code at the circulation desk to collect. Renew online up to 2 times directly from your member dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Connected Branches Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Our Library Locations
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pick up and return books at any of our campus branches
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-600 transition space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {branch.name}
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Open Today • 8:00 AM – 10:00 PM</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <span>{branch.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{branch.phone}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {branch._count?.copies || '2,200+'} copies available
                </span>
                <Link
                  to={`/catalog?branchId=${branch.id}`}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Browse Branch Catalog →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 sm:p-12 shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ready to explore your next great read?
            </h2>
            <p className="text-indigo-200 text-sm sm:text-base leading-relaxed">
              Join thousands of faculty, researchers, and students. Get instant hold privileges, digital preview access, and seamless renewals.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-white text-indigo-900 font-extrabold text-sm hover:bg-indigo-50 shadow-lg transition"
              >
                Join Library Today
              </Link>
              <Link
                to="/catalog"
                className="px-6 py-3 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-bold text-sm border border-indigo-500/50 transition"
              >
                Browse Full Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
