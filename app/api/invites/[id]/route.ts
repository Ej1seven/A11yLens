import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';

const responseSchema = z.object({
  action: z.enum(['accept', 'reject']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await requireUser(request);
    if (!user) return error!;

    const body = await request.json();
    const { action } = responseSchema.parse(body);

    const invite = await prisma.collaborationInvite.findFirst({
      where: {
        id: params.id,
        inviteeId: user.id,
      },
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json({ error: 'Invite already processed' }, { status: 409 });
    }

    const nextStatus = action === 'accept' ? 'accepted' : 'rejected';

    await prisma.$transaction(async (tx) => {
      await tx.collaborationInvite.update({
        where: { id: invite.id },
        data: {
          status: nextStatus,
          respondedAt: new Date(),
        },
      });

      if (action === 'accept') {
        await tx.projectCollaborator.upsert({
          where: {
            projectId_userId: {
              projectId: invite.projectId,
              userId: user.id,
            },
          },
          update: {},
          create: {
            projectId: invite.projectId,
            userId: user.id,
          },
        });
      }
    });

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    console.error('Error responding to invite:', error);
    return NextResponse.json({ error: 'Failed to respond to invite' }, { status: 500 });
  }
}
