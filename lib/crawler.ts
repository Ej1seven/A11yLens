import axios from 'axios';
import { parse } from 'node-html-parser';
import puppeteer from 'puppeteer';

export interface CrawlResult {
  url: string;
  title?: string;
  depth: number;
  source: 'sitemap' | 'crawl';
}

export class WebCrawler {
  private visitedUrls: Set<string> = new Set();
  private baseUrl: string;
  private baseDomain: string;
  private maxPages: number;
  private maxDepth: number;
  private usePuppeteer: boolean;

  constructor(maxPages: number = 100, maxDepth: number = 5, usePuppeteer: boolean = true) {
    this.maxPages = maxPages;
    this.maxDepth = maxDepth;
    this.usePuppeteer = usePuppeteer;
    this.baseUrl = '';
    this.baseDomain = '';
  }

  /**
   * Crawl a website and return all discovered pages.
   * First tries sitemap.xml, then falls back to link-following crawl.
   */
  async crawl(startUrl: string): Promise<CrawlResult[]> {
    this.baseUrl = this.normalizeUrl(startUrl);
    this.baseDomain = new URL(this.baseUrl).hostname;

    console.log(`Starting crawl of ${this.baseUrl}`);
    console.log(`Limits: ${this.maxPages} pages, depth ${this.maxDepth}`);

    const results: CrawlResult[] = [];

    // Phase 1: Try to discover pages from sitemap.xml
    const sitemapUrls = await this.fetchSitemapUrls();
    if (sitemapUrls.length > 0) {
      console.log(`Sitemap: found ${sitemapUrls.length} URLs`);
      for (const url of sitemapUrls) {
        if (results.length >= this.maxPages) break;
        if (!this.visitedUrls.has(url) && this.shouldIncludeUrl(url)) {
          this.visitedUrls.add(url);
          results.push({ url, depth: 0, source: 'sitemap' });
        }
      }
      console.log(`Sitemap: added ${results.length} pages`);
    } else {
      console.log('No sitemap found, relying on link crawling');
    }

    // Phase 2: BFS crawl to discover pages not in the sitemap
    if (results.length < this.maxPages) {
      const crawledPages = await this.bfsCrawl(results.length);
      for (const page of crawledPages) {
        if (results.length >= this.maxPages) break;
        if (!this.visitedUrls.has(page.url)) {
          this.visitedUrls.add(page.url);
          results.push(page);
        }
      }
    }

    console.log(`Crawl complete: Found ${results.length} pages`);
    return results;
  }

  /**
   * Fetch and parse sitemap.xml (supports sitemap index files)
   */
  private async fetchSitemapUrls(): Promise<string[]> {
    const urls: string[] = [];
    const origin = new URL(this.baseUrl).origin;

    // Common sitemap locations to try
    const sitemapLocations = [
      `${origin}/sitemap.xml`,
      `${origin}/sitemap_index.xml`,
      `${origin}/sitemap/sitemap.xml`,
    ];

    // Also check robots.txt for sitemap declarations
    try {
      const robotsUrl = `${origin}/robots.txt`;
      console.log(`Checking robots.txt: ${robotsUrl}`);
      const robotsResponse = await axios.get(robotsUrl, {
        timeout: 10000,
        headers: { 'User-Agent': 'A11y-Dashboard-Crawler/1.0' },
        validateStatus: (status) => status === 200,
      });
      const robotsText: string = robotsResponse.data;
      const sitemapMatches = robotsText.match(/^Sitemap:\s*(.+)$/gim);
      if (sitemapMatches) {
        for (const match of sitemapMatches) {
          const sitemapUrl = match.replace(/^Sitemap:\s*/i, '').trim();
          if (sitemapUrl && !sitemapLocations.includes(sitemapUrl)) {
            sitemapLocations.unshift(sitemapUrl); // prioritize robots.txt sitemaps
          }
        }
      }
    } catch {
      // robots.txt not available, continue
    }

    for (const sitemapUrl of sitemapLocations) {
      try {
        console.log(`Trying sitemap: ${sitemapUrl}`);
        const response = await axios.get(sitemapUrl, {
          timeout: 10000,
          headers: { 'User-Agent': 'A11y-Dashboard-Crawler/1.0' },
          validateStatus: (status) => status === 200,
        });

        const xml: string = response.data;
        const parsed = parse(xml);

        // Check if this is a sitemap index (contains other sitemaps)
        const sitemapTags = parsed.querySelectorAll('sitemap loc');
        if (sitemapTags.length > 0) {
          console.log(`Sitemap index found with ${sitemapTags.length} sub-sitemaps`);
          for (const tag of sitemapTags) {
            const subSitemapUrl = tag.text.trim();
            try {
              const subUrls = await this.parseSingleSitemap(subSitemapUrl);
              urls.push(...subUrls);
            } catch {
              // skip failed sub-sitemaps
            }
          }
          if (urls.length > 0) break; // found valid sitemap index
        }

        // Regular sitemap with <url><loc> entries
        const locTags = parsed.querySelectorAll('url loc');
        if (locTags.length > 0) {
          for (const tag of locTags) {
            const pageUrl = tag.text.trim();
            if (this.isSameDomain(pageUrl)) {
              urls.push(this.normalizeUrl(pageUrl));
            }
          }
          if (urls.length > 0) break; // found valid sitemap
        }
      } catch {
        // This sitemap location doesn't exist, try next
      }
    }

    return Array.from(new Set(urls)); // deduplicate
  }

  /**
   * Parse a single sitemap XML file
   */
  private async parseSingleSitemap(sitemapUrl: string): Promise<string[]> {
    const urls: string[] = [];
    const response = await axios.get(sitemapUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'A11y-Dashboard-Crawler/1.0' },
      validateStatus: (status) => status === 200,
    });

    const xml: string = response.data;
    const parsed = parse(xml);
    const locTags = parsed.querySelectorAll('url loc');

    for (const tag of locTags) {
      const pageUrl = tag.text.trim();
      if (this.isSameDomain(pageUrl)) {
        urls.push(this.normalizeUrl(pageUrl));
      }
    }

    return urls;
  }

  /**
   * BFS crawl using Puppeteer (or axios fallback) to discover pages by following links
   */
  private async bfsCrawl(alreadyFound: number): Promise<CrawlResult[]> {
    const results: CrawlResult[] = [];
    const queue: { url: string; depth: number }[] = [{ url: this.baseUrl, depth: 0 }];
    const remaining = this.maxPages - alreadyFound;

    let browser;
    try {
      if (this.usePuppeteer) {
        browser = await puppeteer.launch({
          headless: true,
          executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
        });
      }

      while (queue.length > 0 && results.length < remaining) {
        const { url, depth } = queue.shift()!;

        if (this.visitedUrls.has(url) || depth > this.maxDepth) {
          continue;
        }

        try {
          console.log(`Crawling: ${url} (depth: ${depth})`);
          this.visitedUrls.add(url);

          let html: string;
          let title: string | undefined;

          if (browser) {
            // Use Puppeteer to render JS-heavy pages
            const page = await browser.newPage();
            try {
              await page.setViewport({ width: 1280, height: 720 });
              await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

              title = await page.title();

              // Extract all links from the rendered DOM
              const links: string[] = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a[href]'))
                  .map(a => (a as HTMLAnchorElement).href)
                  .filter(href => href.startsWith('http'));
              });

              // Queue discovered links
              if (depth < this.maxDepth) {
                for (const link of links) {
                  const normalized = this.normalizeFoundUrl(link);
                  if (normalized && !this.visitedUrls.has(normalized) && this.shouldIncludeUrl(normalized)) {
                    queue.push({ url: normalized, depth: depth + 1 });
                  }
                }
              }
            } finally {
              await page.close();
            }
          } else {
            // Fallback to axios
            html = await this.fetchPage(url);
            const root = parse(html);
            title = root.querySelector('title')?.text.trim();

            if (depth < this.maxDepth) {
              const links = this.extractLinks(root, url);
              links.forEach(link => {
                if (!this.visitedUrls.has(link)) {
                  queue.push({ url: link, depth: depth + 1 });
                }
              });
            }
          }

          results.push({ url, title, depth, source: 'crawl' });

          // Polite delay between requests
          await this.delay(500);
        } catch (error) {
          console.log(`Failed to crawl ${url}:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    return results;
  }

  /**
   * Fetch HTML content of a page (axios fallback)
   */
  private async fetchPage(url: string): Promise<string> {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'A11y-Dashboard-Crawler/1.0',
      },
      maxRedirects: 5,
    });
    return response.data;
  }

  /**
   * Extract all internal links from parsed HTML (axios fallback)
   */
  private extractLinks(root: any, currentUrl: string): string[] {
    const links: string[] = [];
    const anchors = root.querySelectorAll('a[href]');

    anchors.forEach((anchor: any) => {
      const href = anchor.getAttribute('href');
      if (!href) return;

      const normalized = this.normalizeFoundUrl(href, currentUrl);
      if (normalized && this.shouldIncludeUrl(normalized)) {
        links.push(normalized);
      }
    });

    return Array.from(new Set(links));
  }

  /**
   * Normalize a discovered URL, resolving relative paths and filtering to same domain
   */
  private normalizeFoundUrl(href: string, baseUrl?: string): string | null {
    try {
      const absoluteUrl = new URL(href, baseUrl || this.baseUrl).href;
      const parsedUrl = new URL(absoluteUrl);

      if (parsedUrl.hostname !== this.baseDomain) return null;

      // Remove fragment
      parsedUrl.hash = '';
      return parsedUrl.href.replace(/\/$/, ''); // strip trailing slash
    } catch {
      return null;
    }
  }

  /**
   * Check if a URL belongs to the same domain
   */
  private isSameDomain(url: string): boolean {
    try {
      return new URL(url).hostname === this.baseDomain;
    } catch {
      return false;
    }
  }

  /**
   * Determine if a URL should be included in crawl results.
   * Less aggressive than before — allows pagination, search pages, etc.
   */
  private shouldIncludeUrl(url: string): boolean {
    // Exclude binary/media file extensions
    const excludeExtensions = /\.(pdf|jpg|jpeg|png|gif|svg|webp|ico|zip|tar|gz|mp4|mp3|avi|mov|wmv|doc|docx|xls|xlsx|ppt|pptx|css|js|json|xml|woff|woff2|ttf|eot)$/i;
    if (excludeExtensions.test(url)) return false;

    // Exclude common non-content paths
    const excludePaths = [
      /\/api\//i,          // API endpoints
      /\/download\//i,     // Downloads
      /\/logout/i,         // Logout
      /\/cart/i,           // Shopping cart
      /\/checkout/i,       // Checkout
      /\/wp-admin/i,       // WordPress admin
      /\/wp-json/i,        // WordPress REST API
      /\/feed\/?$/i,       // RSS feeds
      /mailto:/i,          // Email links
      /tel:/i,             // Phone links
      /javascript:/i,      // JS links
    ];

    return !excludePaths.some(pattern => pattern.test(url));
  }

  /**
   * Normalize URL (remove trailing slash, etc.)
   */
  private normalizeUrl(url: string): string {
    let normalized = url.trim();

    if (!normalized.startsWith('http')) {
      normalized = 'https://' + normalized;
    }

    // Remove trailing slash
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Quick crawl function for simple use cases
 */
export async function quickCrawl(url: string, maxPages: number = 50): Promise<string[]> {
  const crawler = new WebCrawler(maxPages, 3, false); // Use axios for quick crawl
  const results = await crawler.crawl(url);
  return results.map(r => r.url);
}
