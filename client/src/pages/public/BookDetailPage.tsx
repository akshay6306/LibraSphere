import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { BookCover } from '../../components/ui/BookCover';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { buildAmazonUrl, buildGooglePreviewUrl } from '../../lib/amazon';
import { CATEGORY_MAP } from '../../lib/categories';
import {
  Star,
  BookOpen,
  MapPin,
  Clock,
  Heart,
  BookmarkCheck,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  Share2,
  Send,
  ExternalLink,
  ShoppingCart,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isMember } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [book, setBook] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Reservation modal state
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [isReserving, setIsReserving] = useState(false);

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Wishlist state
  const [isWishlisted, setIsWishlisted] = useState(false);

  const fetchBookDetails = async () => {
    try {
      setIsLoading(true);
      const [bookData, availData] = await Promise.all([
        api.get(`/books/${id}`),
        api.get(`/books/${id}/availability`)
      ]);
      setBook(bookData);
      setAvailability(availData);
      if (availData && availData.length > 0) {
        setSelectedBranchId(availData[0].branchId);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load book information.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const handleReserve = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!isMember) {
      toastError('Only library members can place holds.');
      return;
    }

    setIsReserving(true);
    try {
      await api.post('/reservations', {
        bookId: book.id,
        branchId: selectedBranchId
      });
      toastSuccess(`Hold placed successfully! Track position in your dashboard.`);
      setReserveModalOpen(false);
      fetchBookDetails();
    } catch (err: any) {
      toastError(err.message || 'Could not place reservation hold.');
    } finally {
      setIsReserving(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await api.del(`/wishlist/${book.id}`);
        setIsWishlisted(false);
        toastSuccess('Removed from reading wishlist.');
      } else {
        await api.post('/wishlist', { bookId: book.id });
        setIsWishlisted(true);
        toastSuccess('Added to reading wishlist.');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to update wishlist.');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!comment.trim()) {
      toastError('Please enter a comment for your review.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.post(`/books/${book.id}/reviews`, { rating, comment });
      toastSuccess('Your review has been posted! Thank you for sharing.');
      setComment('');
      fetchBookDetails();
    } catch (err: any) {
      toastError(err.message || 'Could not post review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-96" />
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-gray-500">Book could not be found.</p>
        <Link to="/catalog" className="text-indigo-600 font-bold hover:underline">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const isAvailable = (book.availableCopies || 0) > 0;
  const amazonUrl = book.amazonUrl || buildAmazonUrl(book.isbn, book.title, book.author);
  const previewUrl = buildGooglePreviewUrl(book.isbn, book.previewUrl);
  const categoryDef = CATEGORY_MAP.get(book.category);
  const categorySlug = categoryDef?.slug || 'fiction';
  const bookRating = book.rating || book.avgRating || 4.5;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/catalog" className="hover:text-indigo-600 dark:hover:text-indigo-400">
          Catalog
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          to={`/categories/${categorySlug}`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          {book.category}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 dark:text-white font-semibold truncate max-w-[200px]">
          {book.title}
        </span>
      </nav>

      {/* Main Book Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Cover Column & Action Buttons */}
        <div className="flex flex-col items-center bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-5">
          <div className="relative">
            <BookCover
              title={book.title}
              category={book.category}
              coverUrl={book.coverUrl}
              size="xl"
              className="shadow-2xl"
            />
            {book.isNewArrival && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-md">
                NEW ARRIVAL
              </span>
            )}
            {book.isStaffPick && (
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white shadow-md">
                STAFF PICK
              </span>
            )}
          </div>

          <div className="w-full space-y-2.5 pt-2">
            {/* Primary Hold Button */}
            <button
              onClick={() => setReserveModalOpen(true)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-indigo-600/30 transition flex items-center justify-center space-x-2"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{isAvailable ? 'Place Hold / Reserve' : 'Join Waiting Queue'}</span>
            </button>

            {/* Google Books Sample Preview Button */}
            <button
              onClick={() => setPreviewModalOpen(true)}
              className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
            >
              <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Preview Sample Pages</span>
            </button>

            {/* Buy on Amazon Link */}
            <a
              href={amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <span>Buy Physical Copy on Amazon</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            {/* Wishlist Button */}
            <button
              onClick={handleToggleWishlist}
              className={`w-full py-2.5 border rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2 ${
                isWishlisted
                  ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
            </button>
          </div>
        </div>

        {/* Book Details Column */}
        <div className="md:col-span-2 space-y-6">
          <div>
            {/* Category and Subcategory Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Link
                to={`/categories/${categorySlug}`}
                className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 uppercase tracking-wide hover:bg-indigo-100 transition"
              >
                {book.category}
              </Link>

              {book.subcategory && (
                <Link
                  to={`/catalog?category=${encodeURIComponent(book.category)}&subcategory=${encodeURIComponent(book.subcategory)}`}
                  className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-100 transition"
                >
                  {book.subcategory}
                </Link>
              )}

              <Badge status={isAvailable ? 'AVAILABLE' : 'BORROWED'}>
                {isAvailable ? `${book.availableCopies} available in consortium` : 'Checked Out (Reservable)'}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              {book.title}
            </h1>

            {/* Clickable Author */}
            <div className="mt-2 flex items-center space-x-2 text-base font-semibold text-gray-600 dark:text-gray-300">
              <span>By</span>
              <Link
                to={`/authors/${encodeURIComponent(book.author)}`}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
              >
                {book.author}
              </Link>
            </div>

            {/* Clickable Series (if present) */}
            {book.seriesName && (
              <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs text-purple-700 dark:text-purple-300 font-semibold">
                <Layers className="w-3.5 h-3.5" />
                <span>Part of Series:</span>
                <Link
                  to={`/series/${encodeURIComponent(book.seriesName)}`}
                  className="font-black hover:underline"
                >
                  {book.seriesName} {book.seriesNumber ? `(Volume ${book.seriesNumber})` : ''}
                </Link>
              </div>
            )}

            {/* Ratings & Star Count */}
            <div className="flex items-center space-x-3 mt-4">
              <div className="flex items-center text-amber-500 space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(bookRating) ? 'fill-amber-500 text-amber-500' : 'text-gray-300 dark:text-gray-700'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-black text-gray-900 dark:text-white">
                {bookRating.toFixed(1)} / 5.0
              </span>
              <span className="text-xs text-gray-500">
                ({book.ratingCount || book.reviews?.length || 24} community ratings)
              </span>
            </div>
          </div>

          {/* About / Description */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Book Synopsis & Edition Overview
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line font-sans">
              {book.description}
            </p>
          </div>

          {/* Technical Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-3xl p-5 shadow-sm text-xs">
            <div>
              <p className="text-gray-400 uppercase font-semibold text-[10px]">ISBN-13</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">{book.isbn}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase font-semibold text-[10px]">Format</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                {book.format || 'Hardcover'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 uppercase font-semibold text-[10px]">Publisher</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">{book.publisher}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase font-semibold text-[10px]">Published Year</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">{book.publishedYear}</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase font-semibold text-[10px]">Pages & Language</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                {book.pages} pp ({book.language})
              </p>
            </div>
            <div>
              <p className="text-gray-400 uppercase font-semibold text-[10px]">Target Age</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                {book.ageRange || 'All Ages'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 uppercase font-semibold text-[10px]">Edition</p>
              <p className="font-bold text-gray-900 dark:text-white mt-0.5">
                {book.edition || 'Standard Edition'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 uppercase font-semibold text-[10px]">Reference Code</p>
              <p className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {categoryDef ? `${categoryDef.prefix}-${book.publishedYear}` : 'LIB-001'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Availability Section */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Branch Copy Availability & Shelf Locations
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Real-time shelf tracking across physical library branch holdings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availability.map((b) => (
            <div
              key={b.branchId}
              className="border border-gray-200 dark:border-gray-800 rounded-2xl p-5 bg-gray-50/50 dark:bg-gray-800/40 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    {b.branchName}
                  </h4>
                  <Badge status={b.availableCopies > 0 ? 'AVAILABLE' : 'BORROWED'}>
                    {b.availableCopies} / {b.totalCopies} Available
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-start space-x-1">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                  <span>{b.address}</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700/60 text-[11px] text-gray-600 dark:text-gray-300">
                <span className="font-bold text-gray-400 uppercase text-[10px] block mb-1">
                  Shelf Location Codes:
                </span>
                {b.shelfLocations?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {b.shelfLocations.map((loc: string, i: number) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-mono text-[10px] font-semibold"
                      >
                        {loc}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="italic text-gray-400">In circulation / processing</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews & Community Rating Section */}
      <section className="bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Community Reader Reviews
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Perspectives from verified campus library members
          </p>
        </div>

        {/* Add Review Form */}
        <form
          onSubmit={handleReviewSubmit}
          className="bg-indigo-50/40 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-4"
        >
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
            Write a Member Review
          </h4>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Rating:</span>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRating(s)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-5 h-5 ${
                      s <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts on the thesis, writing style, or usefulness of this book..."
            className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={isSubmittingReview}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmittingReview ? 'Posting...' : 'Submit Review'}</span>
          </button>
        </form>

        {/* Reviews List */}
        <div className="space-y-4">
          {book.reviews && book.reviews.length > 0 ? (
            book.reviews.map((rev: any) => (
              <div
                key={rev.id}
                className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {rev.member?.user?.name?.charAt(0) || 'M'}
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {rev.member?.user?.name || 'Verified Member'}
                    </span>
                  </div>
                  <div className="flex items-center text-amber-500 space-x-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= rev.rating ? 'fill-amber-500' : 'text-gray-300 dark:text-gray-600'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed pl-9">
                  "{rev.comment}"
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-400 italic text-center py-4">
              Be the first to review this book!
            </p>
          )}
        </div>
      </section>

      {/* Google Preview Modal */}
      <Modal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={`Preview: ${book.title}`}
        description="Interactive sample viewer powered by Google Books API."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200 space-y-2">
            <p className="font-bold flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Digital Sample Reading Available</span>
            </p>
            <p>
              You can read excerpt chapters, table of contents, and introductory pages directly via Google Books Preview.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs text-center shadow-md transition flex items-center justify-center space-x-2"
            >
              <span>Launch Google Books Reader</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setPreviewModalOpen(false)}
              className="py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Reservation Modal */}
      <Modal
        isOpen={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        title="Place Reservation Hold"
        description={`Reserve "${book.title}" for pickup.`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
              Select Preferred Pickup Branch
            </label>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
            >
              {availability.map((b) => (
                <option key={b.branchId} value={b.branchId}>
                  {b.branchName} ({b.availableCopies} available now)
                </option>
              ))}
            </select>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 space-y-1">
            <p className="font-semibold">Library Policy Notice:</p>
            <p>
              • If copies are available, your reservation will be fulfilled upon desk processing.<br />
              • If all copies are loaned out, you are queued FIFO.<br />
              • Once ready, you have 48 hours to collect before hold expires.
            </p>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setReserveModalOpen(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReserve}
              disabled={isReserving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition"
            >
              {isReserving ? 'Processing...' : 'Confirm Hold'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
