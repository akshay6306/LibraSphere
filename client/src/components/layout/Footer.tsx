import React from 'react';
import { BookOpen, ShieldCheck, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">
                LibraSphere
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Modern, enterprise-grade multi-branch library management system empowering readers, scholars, and library professionals.
            </p>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Multi-branch real-time sync active</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3">
              Explore Catalog
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li><Link to="/catalog?category=Technology" className="hover:text-indigo-600">Technology & Computing</Link></li>
              <li><Link to="/catalog?category=Science" className="hover:text-indigo-600">Pure & Applied Science</Link></li>
              <li><Link to="/catalog?category=Fiction" className="hover:text-indigo-600">Classic & Modern Fiction</Link></li>
              <li><Link to="/catalog?category=Philosophy" className="hover:text-indigo-600">Philosophy & Ethics</Link></li>
              <li><Link to="/catalog?category=Medicine" className="hover:text-indigo-600">Medical Sciences</Link></li>
            </ul>
          </div>

          {/* Member Services */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3">
              Member Services
            </h4>
            <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <li><Link to="/dashboard/loans" className="hover:text-indigo-600">My Active Loans</Link></li>
              <li><Link to="/dashboard/reservations" className="hover:text-indigo-600">Hold Queue & Reservations</Link></li>
              <li><Link to="/dashboard/fines" className="hover:text-indigo-600">Pay Outstanding Fines</Link></li>
              <li><Link to="/dashboard/wishlist" className="hover:text-indigo-600">Personal Reading Wishlist</Link></li>
              <li><Link to="/dashboard/history" className="hover:text-indigo-600">Borrowing History</Link></li>
            </ul>
          </div>

          {/* Library Hours & Contacts */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3">
              Locations & Hours
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
              <strong>Central Library:</strong> Mon - Sat: 8:00 AM – 9:00 PM<br />
              <strong>North & South Campus:</strong> Mon - Fri: 9:00 AM – 7:00 PM
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Helpline: +1 (555) 010-0200<br />
              Email: support@libra.test
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400">
          <p>© {new Date().getFullYear()} LibraSphere LMS. All rights reserved.</p>
          <p className="flex items-center mt-2 sm:mt-0">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 mx-1 fill-rose-500" /> for libraries worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
};
