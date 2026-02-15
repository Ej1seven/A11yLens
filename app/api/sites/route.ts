import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { userCanAccessProject } from '@/lib/access';

const createSiteSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  projectId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireUser(request);
    if (!user) return error!;

    const body = await request.json();
    const validatedData = createSiteSchema.parse(body);

    const canAccess = await userCanAccessProject(user.id, validatedData.projectId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const site = await prisma.site.create({
      data: {
        url: validatedData.url,
        projectId: validatedData.projectId,
      },
      include: {
        scans: true,
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Failed to create site' },
      { status: 500 }
    );
  }
}
