import prisma from '../lib/prisma';
import { AppError } from '../middleware/error.middleware';

export class NotificationService {
  static async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  static async markAsRead(id: string, userId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification || notification.userId !== userId) {
      throw new AppError('Notification not found.', 404);
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return { message: 'All notifications marked as read.' };
  }

  static async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
  }) {
    return prisma.notification.create({
      data
    });
  }
}
