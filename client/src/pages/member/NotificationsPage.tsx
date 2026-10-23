import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { NotificationItem } from '../../types';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../lib/utils';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, BookmarkCheck } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res || []);
    } catch (err: any) {
      toastError(err.message || 'Failed to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`, {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err: any) {
      toastError(err.message || 'Failed to update notification.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all', {});
      toastSuccess('All notifications marked as read.');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err: any) {
      toastError(err.message || 'Failed to mark notifications.');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'RESERVATION_READY':
        return <BookmarkCheck className="w-5 h-5 text-emerald-500" />;
      case 'FINE_ASSESSED':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'LOAN_ISSUED':
      case 'WELCOME':
        return <CheckCircle2 className="w-5 h-5 text-indigo-500" />;
      default:
        return <Info className="w-5 h-5 text-sky-500" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Notifications & Alerts
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            System updates, pickup reminders, and hold queue notifications
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-xs rounded-xl transition"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                !n.isRead
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900 shadow-sm'
                  : 'bg-white dark:bg-gray-900 border-gray-200/80 dark:border-gray-800 opacity-80'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm flex-shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      {n.title}
                    </h4>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {formatDateTime(n.createdAt)}
                  </p>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(n.id);
                  }}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex-shrink-0"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Notifications"
          description="You're all caught up! No recent notifications to show."
          icon={Bell}
        />
      )}
    </div>
  );
};
