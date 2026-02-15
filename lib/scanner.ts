import axios from 'axios';
import { AxePuppeteer } from '@axe-core/puppeteer';
import puppeteer from 'puppeteer';

export interface A11yIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  element: string;
  message: string;
  selector?: string;
  suggestion?: string;
  context?: string;
  wcagLevel?: string;
  helpUrl?: string;
}

export class AccessibilityScanner {
  /**
   * Main scan method using axe-core
   */
  async scan(url: string): Promise<A11yIssue[]> {
    let browser;
    try {
      // Launch headless browser using system Chrome
      browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set viewport for consistent testing
      await page.setViewport({ width: 1280, height: 720 });
      
      // Navigate to URL
      await page.goto(url, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });

      // Run axe-core accessibility checks
      const results = await new AxePuppeteer(page)
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const issues: A11yIssue[] = [];

      // Process violations (actual failures)
      results.violations.forEach(violation => {
        violation.nodes.forEach(node => {
          issues.push({
            type: violation.id,
            severity: this.mapAxeSeverity(violation.impact),
            element: node.html.substring(0, 100),
            message: violation.description,
            selector: node.target.join(', '),
            suggestion: violation.help,
            helpUrl: violation.helpUrl,
            wcagLevel: this.formatWcagTags(violation.tags),
            context: node.html.substring(0, 300)
          });
        });
      });

      // Process incomplete checks (needs manual review)
      results.incomplete.forEach(incomplete => {
        incomplete.nodes.forEach(node => {
          issues.push({
            type: incomplete.id,
            severity: 'info',
            element: node.html.substring(0, 100),
            message: `Needs manual review: ${incomplete.description}`,
            selector: node.target.join(', '),
            suggestion: `${incomplete.help} - This requires manual verification.`,
            helpUrl: incomplete.helpUrl,
            wcagLevel: this.formatWcagTags(incomplete.tags),
            context: node.html.substring(0, 300)
          });
        });
      });

      console.log(`✅ axe-core scan complete: ${issues.length} issues found`);
      return issues;

    } catch (error) {
      console.error('❌ axe-core scan error:', error);
      throw new Error(`Failed to scan with axe-core: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Map axe-core severity levels to our system
   */
  private mapAxeSeverity(impact: string | null | undefined): 'critical' | 'warning' | 'info' {
    switch (impact) {
      case 'critical':
        return 'critical';
      case 'serious':
        return 'critical';
      case 'moderate':
        return 'warning';
      case 'minor':
        return 'info';
      case null:
      case undefined:
      default:
        return 'info';
    }
  }

  /**
   * Format WCAG tags into readable string
   */
  private formatWcagTags(tags: string[]): string {
    const wcagTags = tags
      .filter(tag => tag.startsWith('wcag'))
      .map(tag => tag.toUpperCase())
      .join(', ');
    
    return wcagTags || 'Best Practice';
  }
}