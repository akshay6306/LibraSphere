import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookMarked,
  History,
  BookmarkCheck,
  CreditCard,
  Heart,
  User,
  Bell,
  ArrowUpRight,
  ArrowDownLeft,
  Library,
  Users,
  AlertTriangle,
  Building2,
  UserCheck,
  Sliders,
  FileText,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const memberLinks = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/dashboard/loans', label: 'My Loans', icon: BookMarked },
    { to: '/dashboard/history', label: 'Borrow History', icon: History },
    { to: '/dashboard/reservations', label: 'Reservations', icon: BookmarkCheck },
    { to: '/dashboard/fines', label: 'Fines & Payments', icon: CreditCard },
    { to: '/dashboard/wishlist', label: 'Saved Wishlist', icon: Heart },
    { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { to: '/dashboard/profile', label: 'My Profile', icon: User }
  ];

  const librarianLinks = [
    { to: '/librarian', label: 'Desk Overview', icon: LayoutDashboard, end: true },
    { to: '/librarian/issue', label: 'Issue Book', icon: ArrowUpRight },
    { to: '/librarian/return', label: 'Return Book', icon: ArrowDownLeft },
    { to: '/librarian/catalog', label: 'Catalog & Copies', icon: Library },
    { to: '/librarian/members', label: 'Member Directory', icon: Users },
    { to: '/librarian/overdue', label: 'Overdue List', icon: AlertTriangle },
    { to: '/librarian/reservations', label: 'Hold Queue', icon: BookmarkCheck }
  ];

  const adminLinks = [
    { to: '/admin', label: 'Analytics Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/branches', label: 'Branches', icon: Building2 },
    { to: '/admin/librarians', label: 'Librarians', icon: UserCheck },
    { to: '/admin/settings', label: 'System Settings', icon: Sliders },
    { to: '/admin/audit-log', label: 'Audit Trail', icon: FileText },
    { to: '/admin/reports', label: 'Performance Reports', icon: BarChart3 }
  ];

  let links = memberLinks;
  let sectionTitle = 'Member Portal';

  if (user.role === 'ADMIN') {
    links = adminLinks;
    sectionTitle = 'Admin Administration';
  } else if (user.role === 'LIBRARIAN') {
    links = librarianLinks;
    sectionTitle = 'Circulation Desk';
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Role badge header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
          {sectionTitle}
        </p>
        <div className="flex items-center space-x-2 mt-1">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            {user.role} ACCESS
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer shortcut to catalog */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <NavLink
          to="/catalog"
          className="flex items-center space-x-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          <BookOpen className="w-4 h-4" />
          <span>Browse Public Catalog</span>
        </NavLink>
      </div>
    </aside>
  );
};
