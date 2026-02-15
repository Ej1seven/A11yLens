import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireUser(request);
    if (!user) return error!;

    const invites = await prisma.collaborationInvite.findMany({
      where: {
        inviteeId: user.id,
        status: 'pending',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            owner: {
              select: { id: true, email: true, name: true },
            },
          },
        },
        inviter: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}
