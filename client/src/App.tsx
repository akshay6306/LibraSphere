import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/ui/Toast';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { CatalogPage } from './pages/public/CatalogPage';
import { BookDetailPage } from './pages/public/BookDetailPage';
import { CategoriesPage } from './pages/public/CategoriesPage';
import { CategoryDetailPage } from './pages/public/CategoryDetailPage';
import { AuthorPage } from './pages/public/AuthorPage';
import { SeriesPage } from './pages/public/SeriesPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';

// Member Pages
import { MemberOverviewPage } from './pages/member/MemberOverviewPage';
import { MyLoansPage } from './pages/member/MyLoansPage';
import { BorrowHistoryPage } from './pages/member/BorrowHistoryPage';
import { ReservationsPage } from './pages/member/ReservationsPage';
import { FinesPage } from './pages/member/FinesPage';
import { WishlistPage } from './pages/member/WishlistPage';
import { ProfilePage } from './pages/member/ProfilePage';
import { NotificationsPage } from './pages/member/NotificationsPage';

// Librarian Pages
import { LibrarianOverviewPage } from './pages/librarian/LibrarianOverviewPage';
import { IssueBookPage } from './pages/librarian/IssueBookPage';
import { ReturnBookPage } from './pages/librarian/ReturnBookPage';
import { CatalogManagementPage } from './pages/librarian/CatalogManagementPage';
import { MemberManagementPage } from './pages/librarian/MemberManagementPage';
import { OverdueListPage } from './pages/librarian/OverdueListPage';
import { ReservationManagementPage } from './pages/librarian/ReservationManagementPage';

// Admin Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { BranchManagementPage } from './pages/admin/BranchManagementPage';
import { LibrarianManagementPage } from './pages/admin/LibrarianManagementPage';
import { SystemSettingsPage } from './pages/admin/SystemSettingsPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { ReportsPage } from './pages/admin/ReportsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/catalog" element={<CatalogPage />} />
                  <Route path="/books/:id" element={<BookDetailPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/categories/:categorySlug" element={<CategoryDetailPage />} />
                  <Route path="/categories/:categorySlug/:subcategorySlug" element={<CategoryDetailPage />} />
                  <Route path="/authors/:authorName" element={<AuthorPage />} />
                  <Route path="/series/:seriesName" element={<SeriesPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                </Route>

                {/* Member Dashboard Routes */}
                <Route element={<DashboardLayout allowedRoles={['MEMBER']} />}>
                  <Route path="/dashboard" element={<MemberOverviewPage />} />
                  <Route path="/dashboard/loans" element={<MyLoansPage />} />
                  <Route path="/dashboard/history" element={<BorrowHistoryPage />} />
                  <Route path="/dashboard/reservations" element={<ReservationsPage />} />
                  <Route path="/dashboard/fines" element={<FinesPage />} />
                  <Route path="/dashboard/wishlist" element={<WishlistPage />} />
                  <Route path="/dashboard/profile" element={<ProfilePage />} />
                  <Route path="/dashboard/notifications" element={<NotificationsPage />} />
                </Route>

                {/* Librarian Desk Routes */}
                <Route element={<DashboardLayout allowedRoles={['LIBRARIAN', 'ADMIN']} />}>
                  <Route path="/librarian" element={<LibrarianOverviewPage />} />
                  <Route path="/librarian/issue" element={<IssueBookPage />} />
                  <Route path="/librarian/return" element={<ReturnBookPage />} />
                  <Route path="/librarian/catalog" element={<CatalogManagementPage />} />
                  <Route path="/librarian/members" element={<MemberManagementPage />} />
                  <Route path="/librarian/overdue" element={<OverdueListPage />} />
                  <Route path="/librarian/reservations" element={<ReservationManagementPage />} />
                </Route>

                {/* Admin Administration Routes */}
                <Route element={<DashboardLayout allowedRoles={['ADMIN']} />}>
                  <Route path="/admin" element={<AdminOverviewPage />} />
                  <Route path="/admin/branches" element={<BranchManagementPage />} />
                  <Route path="/admin/librarians" element={<LibrarianManagementPage />} />
                  <Route path="/admin/settings" element={<SystemSettingsPage />} />
                  <Route path="/admin/audit-log" element={<AuditLogPage />} />
                  <Route path="/admin/reports" element={<ReportsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
