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
        issues: true,
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

    // Generate CSV
    const headers = ['Page URL', 'Type', 'Severity', 'Element', 'Message', 'Selector', 'Suggestion'];
    const rows = scan.issues.map(issue => [
      issue.pageUrl || scan.site.url,
      issue.type,
      issue.severity,
      issue.element,
      `"${issue.message.replace(/"/g, '""')}"`,
      issue.selector || '',
      `"${(issue.suggestion || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="scan-${scan.id}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting scan:', error);
    return NextResponse.json(
      { error: 'Failed to export scan' },
      { status: 500 }
    );
  }
}
