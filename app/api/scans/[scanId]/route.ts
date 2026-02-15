import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { userCanAccessProject } from '@/lib/access';

export async function GET(
  request: NextRequest,
  { params }: { params: { scanId: string } }
) {
  try {
    const { user, error } = await requireUser(request);
    if (!user) return error!;

    const scan = await prisma.scan.findUnique({
      where: { id: params.scanId },
      include: {
        issues: {
          orderBy: [
            { severity: 'asc' },
            { type: 'asc' },
          ],
        },
        site: true,
      },
    });

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    const site = await prisma.site.findUnique({
      where: { id: scan.siteId },
      select: { projectId: true },
    });

    if (!site) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    const canAccess = await userCanAccessProject(user.id, site.projectId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    }

    return NextResponse.json(scan);
  } catch (error) {
    console.error('Error fetching scan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan' },
      { status: 500 }
    );
  }
}
