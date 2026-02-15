import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { userCanAccessProject, userCanManageProject } from '@/lib/access';

const inviteSchema = z.object({
  email: z.string().email(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await requireUser(request);
    if (!user) return error!;

    const canAccess = await userCanAccessProject(user.id, params.id);
    if (!canAccess) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: {
        owner: {
          select: { id: true, email: true, name: true },
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
        invites: {
          where: { status: 'pending' },
          include: {
            invitee: {
              select: { id: true, email: true, name: true },
            },
            inviter: {
              select: { id: true, email: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching collaborators:', error);
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await requireUser(request);
    if (!user) return error!;

    const canManage = await userCanManageProject(user.id, params.id);
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email } = inviteSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const invitee = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true },
    });

    if (!invitee) {
      return NextResponse.json({ error: 'User with that email was not found' }, { status: 404 });
    }

    if (invitee.id === user.id) {
      return NextResponse.json({ error: 'You already own this project' }, { status: 400 });
    }

    const existingCollaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId: params.id,
        userId: invitee.id,
      },
      select: { id: true },
    });

    if (existingCollaborator) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 409 });
    }

    const invite = await prisma.collaborationInvite.upsert({
      where: {
        projectId_inviteeId: {
          projectId: params.id,
          inviteeId: invitee.id,
        },
      },
      update: {
        inviterId: user.id,
        status: 'pending',
        respondedAt: null,
      },
      create: {
        projectId: params.id,
        inviterId: user.id,
        inviteeId: invitee.id,
        status: 'pending',
      },
      include: {
        invitee: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }

    console.error('Error inviting collaborator:', error);
    return NextResponse.json({ error: 'Failed to invite collaborator' }, { status: 500 });
  }
}
