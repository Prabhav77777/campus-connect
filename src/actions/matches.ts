'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { generateOTP } from '@/lib/utils';
import { createNotification } from './notifications';
import { revalidatePath } from 'next/cache';

export async function confirmMatch(matchId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { request: true, trip: { include: { user: true } } },
    });

    if (!match || match.request.userId !== session.user.id) {
      return { error: 'Match not found or unauthorized' };
    }

    if (match.status !== 'PENDING') return { error: 'Match is not pending' };

    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'CONFIRMED' },
    });

    await createNotification(
      match.trip.userId,
      `${session.user.name || 'Requester'} has confirmed the match!`,
      `/errands/${matchId}`
    );

    revalidatePath('/errands');
    revalidatePath(`/errands/${matchId}`);
    return { success: true };
  } catch (error) {
    console.error('Error confirming match:', error);
    return { error: 'Failed to confirm match' };
  }
}

export async function rejectMatch(matchId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { request: true, trip: { include: { user: true } } },
    });

    if (!match || match.request.userId !== session.user.id) {
      return { error: 'Match not found or unauthorized' };
    }

    if (match.status !== 'PENDING') return { error: 'Match is not pending' };

    await prisma.$transaction(async (tx: any) => {
      await tx.match.update({
        where: { id: matchId },
        data: { status: 'CANCELLED' },
      });

      await tx.request.update({
        where: { id: match.requestId },
        data: { status: 'OPEN' },
      });
    });

    await createNotification(
      match.trip.userId,
      `${session.user.name || 'Requester'} declined the match request.`,
      `/errands`
    );

    revalidatePath('/errands');
    revalidatePath(`/errands/${matchId}`);
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting match:', error);
    return { error: 'Failed to reject match' };
  }
}

export async function markPurchased(matchId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { trip: true, request: true },
    });

    if (!match || match.trip.userId !== session.user.id) {
      return { error: 'Match not found or unauthorized' };
    }

    if (match.status !== 'CONFIRMED') return { error: 'Match is not confirmed' };

    const otp = generateOTP(4);

    await prisma.match.update({
      where: { id: matchId },
      data: { status: 'PURCHASED', otp },
    });

    await createNotification(
      match.request.userId,
      `Your item has been bought! Pay cash upon handoff and enter the OTP provided by the runner.`,
      `/errands/${matchId}`
    );

    revalidatePath('/errands');
    revalidatePath(`/errands/${matchId}`);
    return { success: true, otp };
  } catch (error) {
    console.error('Error marking purchased:', error);
    return { error: 'Failed to mark as purchased' };
  }
}

export async function verifyOtp(matchId: string, otp: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { trip: { include: { user: true } }, request: true },
    });

    if (!match || match.request.userId !== session.user.id) {
      return { error: 'Match not found or unauthorized' };
    }

    if (match.status !== 'PURCHASED') return { error: 'Match is not purchased' };

    if (match.otp !== otp.trim()) {
      return { error: 'Invalid OTP. Please check with the runner.' };
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.match.update({
        where: { id: matchId },
        data: { status: 'DELIVERED_SETTLED' },
      });

      await tx.user.update({
        where: { id: match.trip.userId },
        data: { trustScore: { increment: 1 } },
      });
    });

    await createNotification(
      match.trip.userId,
      `Handoff complete! OTP verified. Your trust score increased by +1.`,
      `/errands/${matchId}`
    );

    revalidatePath('/errands');
    revalidatePath(`/errands/${matchId}`);
    return { success: true };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { error: 'Failed to verify OTP' };
  }
}

export async function flagMatch(matchId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { trip: true, request: true },
    });

    if (!match || match.request.userId !== session.user.id) {
      return { error: 'Match not found or unauthorized' };
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.user.update({
        where: { id: match.request.userId },
        data: { redFlagged: true },
      });

      await tx.user.update({
        where: { id: match.trip.userId },
        data: { trustScore: { decrement: 2 } },
      });
    });

    await createNotification(
      match.trip.userId,
      `A match was flagged as unresolved by the requester. Your trust score decreased by -2.`,
      `/errands/${matchId}`
    );

    revalidatePath('/errands');
    revalidatePath(`/errands/${matchId}`);
    return { success: true };
  } catch (error) {
    console.error('Error flagging match:', error);
    return { error: 'Failed to flag match' };
  }
}

export async function getMatchDetail(matchId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Unauthorized' };

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        trip: { include: { user: true, outlet: true } },
        request: { include: { user: true, outlet: true } },
      },
    });

    if (!match) return { error: 'Match not found' };

    if (match.trip.userId !== session.user.id && match.request.userId !== session.user.id) {
      return { error: 'Unauthorized' };
    }

    return { success: true, match };
  } catch (error) {
    console.error('Error fetching match detail:', error);
    return { error: 'Failed to fetch match detail' };
  }
}

export async function getMyMatches(userId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.id !== userId) return { error: 'Unauthorized' };

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { request: { userId: session.user.id } },
          { trip: { userId: session.user.id } },
        ],
      },
      include: {
        trip: { include: { user: true, outlet: true } },
        request: { include: { user: true, outlet: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const asRequester = matches.filter(m => m.request.userId === session.user.id);
    const asTripGoer = matches.filter(m => m.trip.userId === session.user.id);

    return { success: true, asRequester, asTripGoer };
  } catch (error) {
    console.error('Error fetching matches:', error);
    return { error: 'Failed to fetch matches' };
  }
}
