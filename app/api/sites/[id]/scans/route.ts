import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AccessibilityScanner } from '@/lib/scanner';
import { WebCrawler } from '@/lib/crawler';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { userCanAccessProject } from '@/lib/access';

const startScanSchema = z.object({
  maxPages: z.number().int().min(1).max(500).optional(),
  maxDepth: z.number().int().min(1).max(10).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await requireUser(request);
    if (!user) return error!;

    let requestBody: unknown = {};
    try {
      requestBody = await request.json();
    } catch {
      requestBody = {};
    }

    const { maxPages, maxDepth } = startScanSchema.parse(requestBody);

    const site = await prisma.site.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        url: true,
        projectId: true,
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    const canAccess = await userCanAccessProject(user.id, site.projectId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    // Create a new scan record
    const scan = await prisma.scan.create({
      data: {
        siteId: site.id,
        status: 'running',
      },
    });

    // Run the scan asynchronously
    runScan(scan.id, site.url, {
      maxPages,
      maxDepth,
    }).catch(console.error);

    return NextResponse.json(scan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error starting scan:', error);
    return NextResponse.json(
      { error: 'Failed to start scan' },
      { status: 500 }
    );
  }
}

function getScanLimitFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

async function runScan(
  scanId: string,
  url: string,
  options?: {
    maxPages?: number;
    maxDepth?: number;
  }
) {
  try {
    const maxPages = options?.maxPages ?? getScanLimitFromEnv('SCAN_CRAWL_MAX_PAGES', 50);
    const maxDepth = options?.maxDepth ?? getScanLimitFromEnv('SCAN_CRAWL_MAX_DEPTH', 5);
    const scanner = new AccessibilityScanner();
    const crawler = new WebCrawler(maxPages, maxDepth);
    let discoveredPages: Array<{ url: string }> = [];

    try {
      discoveredPages = await crawler.crawl(url);
    } catch (crawlError) {
      console.error(`Error crawling ${url}, falling back to root URL only:`, crawlError);
    }

    const pagesToScan = Array.from(new Set([url, ...discoveredPages.map(page => page.url)])).slice(0, maxPages);

    const issues: Array<{
      pageUrl: string;
      type: string;
      severity: 'critical' | 'warning' | 'info';
      element: string;
      message: string;
      selector?: string;
      suggestion?: string;
      context?: string;
    }> = [];

    let successfulPages = 0;
    for (const pageUrl of pagesToScan) {
      try {
        const pageIssues = await scanner.scan(pageUrl);
        successfulPages += 1;
        issues.push(...pageIssues.map(issue => ({
          ...issue,
          pageUrl,
        })));
      } catch (pageError) {
        console.error(`Error scanning page ${pageUrl}:`, pageError);
      }
    }

    if (successfulPages === 0) {
      throw new Error('No pages could be scanned successfully');
    }

    // Count issues by severity
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    // Update scan with results
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        totalIssues: issues.length,
        criticalIssues: criticalCount,
        warningIssues: warningCount,
        infoIssues: infoCount,
        issues: {
          create: issues.map(issue => ({
            pageUrl: issue.pageUrl,
            type: issue.type,
            severity: issue.severity,
            element: issue.element,
            message: issue.message,
            selector: issue.selector,
            suggestion: issue.suggestion,
            context: issue.context,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Error running scan:', error);
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: 'failed',
        completedAt: new Date(),
      },
    });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, error } = await requireUser(request);
    if (!user) return error!;

    const site = await prisma.site.findUnique({
      where: { id: params.id },
      select: { projectId: true },
    });

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const canAccess = await userCanAccessProject(user.id, site.projectId);
    if (!canAccess) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const scans = await prisma.scan.findMany({
      where: { siteId: params.id },
      orderBy: { startedAt: 'desc' },
      include: {
        issues: true,
      },
    });

    return NextResponse.json(scans);
  } catch (error) {
    console.error('Error fetching scans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scans' },
      { status: 500 }
    );
  }
}
