'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createRequest(data: {
  outletId: string;
  itemName: string;
  quantity: number;
  priceEstimate: number;
  deliverToHostel: string;
  deliverToRoom?: string;
  note?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const request = await prisma.request.create({
      data: {
        userId: session.user.id,
        outletId: data.outletId,
        itemName: data.itemName,
        quantity: data.quantity || 1,
        priceEstimate: data.priceEstimate,
        deliverToHostel: data.deliverToHostel,
        deliverToRoom: data.deliverToRoom || null,
        note: data.note || null,
        status: 'OPEN',
      },
    });

    revalidatePath('/');
    return { success: true, request };
  } catch (error) {
    console.error('Error creating request:', error);
    return { error: 'Failed to create request' };
  }
}

export async function cancelRequest(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request || request.userId !== session.user.id) {
      return { error: 'Request not found or unauthorized' };
    }

    if (request.status !== 'OPEN') {
      return { error: 'Can only cancel OPEN requests' };
    }

    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error cancelling request:', error);
    return { error: 'Failed to cancel request' };
  }
}

export async function getOpenRequests(outletId?: string, hostel?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const whereClause: Record<string, unknown> = {
      status: 'OPEN',
    };

    if (outletId) {
      whereClause.outletId = outletId;
    }

    if (hostel) {
      whereClause.deliverToHostel = hostel;
    }

    const requests = await prisma.request.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, trustScore: true, hostel: true, redFlagged: true },
        },
        outlet: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, requests };
  } catch (error) {
    console.error('Error fetching open requests:', error);
    return { error: 'Failed to fetch open requests' };
  }
}
