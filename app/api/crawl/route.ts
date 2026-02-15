import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WebCrawler } from '@/lib/crawler';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { userCanAccessProject } from '@/lib/access';

const crawlSiteSchema = z.object({
  projectId: z.string(),
  startUrl: z.string().url('Must be a valid URL'),
  maxPages: z.number().min(1).max(500).optional().default(100),
  maxDepth: z.number().min(1).max(10).optional().default(5),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireUser(request);
    if (!user) return error!;

    const body = await request.json();
    const { projectId, startUrl, maxPages, maxDepth } = crawlSiteSchema.parse(body);

    // Verify project access
    const project = await userCanAccessProject(user.id, projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Start crawling in background
    crawlAndAddSites(projectId, startUrl, maxPages, maxDepth).catch(console.error);

    return NextResponse.json({
      message: 'Crawl started',
      estimatedPages: maxPages,
      status: 'crawling'
    }, { status: 202 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error starting crawl:', error);
    return NextResponse.json(
      { error: 'Failed to start crawl' },
      { status: 500 }
    );
  }
}

/**
 * Crawl site and add all discovered pages as sites
 */
async function crawlAndAddSites(
  projectId: string,
  startUrl: string,
  maxPages: number,
  maxDepth: number
) {
  try {
    console.log(`🕷️ Starting crawl for project ${projectId}`);
    
    const crawler = new WebCrawler(maxPages, maxDepth);
    const pages = await crawler.crawl(startUrl);

    console.log(`✅ Found ${pages.length} pages, adding to project...`);

    // Add all discovered pages as sites
    for (const page of pages) {
      try {
        // Check if site already exists
        const existing = await prisma.site.findFirst({
          where: {
            projectId: projectId,
            url: page.url,
          },
        });

        if (!existing) {
          await prisma.site.create({
            data: {
              url: page.url,
              projectId: projectId,
            },
          });
          console.log(`➕ Added: ${page.url}`);
        } else {
          console.log(`⏭️ Skipped (exists): ${page.url}`);
        }
      } catch (error) {
        console.error(`❌ Failed to add ${page.url}:`, error);
      }
    }

    console.log(`🎉 Crawl complete: ${pages.length} pages added to project`);
  } catch (error) {
    console.error('❌ Crawl failed:', error);
  }
}
