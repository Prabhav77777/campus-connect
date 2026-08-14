'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { createNotification } from './notifications';

export async function createTrip(data: { outletId: string; leavingTime: string | Date; capacity?: number | null }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const trip = await prisma.trip.create({
      data: {
        userId: session.user.id,
        outletId: data.outletId,
        leavingTime: data.leavingTime,
        capacity: data.capacity,
        status: 'ACTIVE',
      },
    });

    revalidatePath('/trips');
    return { success: true, trip };
  } catch (error) {
    console.error('Error creating trip:', error);
    return { error: 'Failed to create trip' };
  }
}

export async function getActiveTrips() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const trips = await prisma.trip.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: { name: true, trustScore: true, hostel: true },
        },
        outlet: true,
        matches: true,
      },
      orderBy: { leavingTime: 'asc' },
    });

    return { success: true, trips };
  } catch (error) {
    console.error('Error fetching trips:', error);
    return { error: 'Failed to fetch active trips' };
  }
}

export async function getOpenRequestsForOutlet(outletId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const requests = await prisma.request.findMany({
      where: {
        outletId,
        status: 'OPEN',
      },
      include: {
        user: {
          select: { name: true, trustScore: true, hostel: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, requests };
  } catch (error) {
    console.error('Error fetching open requests for outlet:', error);
    return { error: 'Failed to fetch open requests' };
  }
}

export async function acceptRequests(tripId: string, requestIds: string[]) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { user: true },
    });

    if (!trip || trip.userId !== session.user.id) {
      return { error: 'Trip not found or unauthorized' };
    }

    if (trip.status !== 'ACTIVE') {
      return { error: 'Trip is not active' };
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const matches = [];
      for (const requestId of requestIds) {
        const req = await tx.request.findUnique({ where: { id: requestId } });
        if (!req || req.status !== 'OPEN') continue;

        await tx.request.update({
          where: { id: requestId },
          data: { status: 'MATCHED' },
        });

        const match = await tx.match.create({
          data: {
            tripId,
            requestId,
            status: 'PENDING',
          },
        });
        matches.push(match);

        await tx.notification.create({
          data: {
            userId: req.userId,
            message: `Your request has been accepted by ${trip.user.name}. Please confirm the match.`,
            link: `/errands/${match.id}`,
          },
        });
      }
      return matches;
    });

    revalidatePath('/trips');
    revalidatePath('/requests');
    revalidatePath('/matches');
    return { success: true, matches: result };
  } catch (error) {
    console.error('Error accepting requests:', error);
    return { error: 'Failed to accept requests' };
  }
}

export async function cancelTrip(tripId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'Unauthorized' };
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { matches: true },
    });

    if (!trip || trip.userId !== session.user.id) {
      return { error: 'Trip not found or unauthorized' };
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.trip.update({
        where: { id: tripId },
        data: { status: 'CANCELLED' },
      });

      for (const match of trip.matches) {
        if (match.status === 'PENDING') {
          await tx.request.update({
            where: { id: match.requestId },
            data: { status: 'OPEN' },
          });
          await tx.match.update({
            where: { id: match.id },
            data: { status: 'CANCELLED' }, // Assuming we want to cancel the match
          });
          
          const request = await tx.request.findUnique({ where: { id: match.requestId } });
          if (request) {
            await tx.notification.create({
              data: {
                userId: request.userId,
                message: 'The trip for your request was cancelled. Your request is open again.',
              },
            });
          }
        }
      }
    });

    revalidatePath('/trips');
    revalidatePath('/requests');
    return { success: true };
  } catch (error) {
    console.error('Error cancelling trip:', error);
    return { error: 'Failed to cancel trip' };
  }
}
