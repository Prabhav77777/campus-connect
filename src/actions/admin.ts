'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getOutlets() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const outlets = await prisma.outlet.findMany({
      include: {
        menuItems: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return { success: true, outlets };
  } catch (error) {
    console.error('Error fetching outlets:', error);
    return { error: 'Failed to fetch outlets' };
  }
}

export async function createOutlet(data: { name: string; hasFixedMenu: boolean }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    const outlet = await prisma.outlet.create({
      data,
    });

    revalidatePath('/admin');
    return { success: true, outlet };
  } catch (error) {
    console.error('Error creating outlet:', error);
    return { error: 'Failed to create outlet' };
  }
}

export async function updateOutlet(id: string, data: { name?: string; hasFixedMenu?: boolean; isClosed?: boolean }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    const outlet = await prisma.outlet.update({
      where: { id },
      data,
    });

    revalidatePath('/admin');
    return { success: true, outlet };
  } catch (error) {
    console.error('Error updating outlet:', error);
    return { error: 'Failed to update outlet' };
  }
}

export async function deleteOutlet(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    await prisma.outlet.delete({
      where: { id },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error deleting outlet:', error);
    return { error: 'Failed to delete outlet' };
  }
}

export async function getMenuItems(outletId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const menuItems = await prisma.menuItem.findMany({
      where: { outletId },
      orderBy: { name: 'asc' },
    });

    return { success: true, menuItems };
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return { error: 'Failed to fetch menu items' };
  }
}

export async function createMenuItem(data: { outletId: string; name: string; price: number }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    const menuItem = await prisma.menuItem.create({
      data,
    });

    revalidatePath(`/admin/outlets/${data.outletId}`);
    return { success: true, menuItem };
  } catch (error) {
    console.error('Error creating menu item:', error);
    return { error: 'Failed to create menu item' };
  }
}

export async function updateMenuItem(id: string, data: { name: string; price: number }) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data,
    });

    revalidatePath(`/admin`); // Or more specific if needed
    return { success: true, menuItem };
  } catch (error) {
    console.error('Error updating menu item:', error);
    return { error: 'Failed to update menu item' };
  }
}

export async function deleteMenuItem(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { error: 'Unauthorized' };
    }

    await prisma.menuItem.delete({
      where: { id },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return { error: 'Failed to delete menu item' };
  }
}
