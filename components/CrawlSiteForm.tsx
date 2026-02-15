'use client';

import { useState } from 'react';
import Button from './Button';
import Card from './Card';

interface CrawlSiteFormProps {
  projectId: string;
  onCrawlComplete: () => void;
}

export default function CrawlSiteForm({ projectId, onCrawlComplete }: CrawlSiteFormProps) {
  const [startUrl, setStartUrl] = useState('');
  const [maxPages, setMaxPages] = useState(100);
  const [crawling, setCrawling] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function handleCrawl(e: React.FormEvent) {
    e.preventDefault();
    if (!startUrl.trim()) return;

    setCrawling(true);
    try {
      const response = await fetch('/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId, 
          startUrl,
          maxPages 
        }),
      });

      if (response.ok) {
        setStartUrl('');
        // Poll for updates since crawl runs in background
        const pollInterval = setInterval(() => {
          onCrawlComplete();
        }, 5000);
        // Stop polling after a reasonable time
        setTimeout(() => {
          clearInterval(pollInterval);
          onCrawlComplete();
          setCrawling(false);
        }, 120000);
      } else {
        setCrawling(false);
      }
    } catch (error) {
      console.error('Error starting crawl:', error);
      setCrawling(false);
    }
  }

  return (
    <Card>
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-primary-100 rounded-lg">
          <svg className="w-6 h-6 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Crawl Entire Website</h3>
          <p className="text-sm text-gray-600 mt-1">
            Automatically discover and add all pages from a website
          </p>
        </div>
      </div>

      <form onSubmit={handleCrawl} className="space-y-4">
        <div>
          <label htmlFor="startUrl" className="block text-sm font-medium text-gray-700 mb-2">
            Starting URL
          </label>
          <input
            id="startUrl"
            type="url"
            value={startUrl}
            onChange={(e) => setStartUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the homepage or any page to start from
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#0F766E] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#0D5E56]"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Advanced Options
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
              <div>
                <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Pages
                </label>
                <input
                  id="maxPages"
                  type="number"
                  min="1"
                  max="500"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Limit crawl to this many pages (1-500)
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-accent-50 border border-accent-200 rounded-lg p-3">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-primary-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm text-primary-800 font-medium">Note</p>
              <p className="text-xs text-primary-700 mt-1">
                Crawling may take 1-3 minutes depending on site size. The crawler checks sitemaps and follows links using a real browser to find all pages, including JavaScript-rendered content.
              </p>
            </div>
          </div>
        </div>

        <Button type="submit" loading={crawling} disabled={!startUrl.trim() || crawling}>
          {crawling ? 'Crawling Website...' : 'Start Crawl'}
        </Button>
      </form>
    </Card>
  );
}
