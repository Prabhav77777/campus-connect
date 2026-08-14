'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getNotifications() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return { success: true, notifications };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { error: 'Failed to fetch notifications' };
  }
}

export async function markAsRead(notificationId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    await prisma.notification.updateMany({
      where: { 
        id: notificationId,
        userId: session.user.id
      },
      data: { read: true },
    });

    revalidatePath('/notifications');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification read:', error);
    return { error: 'Failed to update notification' };
  }
}

export async function markAllAsRead() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });

    revalidatePath('/notifications');
    return { success: true };
  } catch (error) {
    console.error('Error marking all read:', error);
    return { error: 'Failed to update notifications' };
  }
}

export async function getUnreadCount() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const count = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    });

    return { success: true, count };
  } catch (error) {
    console.error('Error getting unread count:', error);
    return { error: 'Failed to fetch count' };
  }
}

export async function createNotification(userId: string, message: string, link?: string) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        message,
        link,
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { error: 'Failed to create notification' };
  }
}
