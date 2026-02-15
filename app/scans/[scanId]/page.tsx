'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import ScanResults from '@/components/ScanResults';
import { formatDistanceToNow, format } from 'date-fns';

interface Issue {
  id: string;
  type: string;
  severity: string;
  element: string;
  message: string;
  selector?: string | null;
  suggestion?: string | null;
  context?: string | null;
  pageUrl?: string | null;
}

interface Scan {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  totalIssues: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  issues: Issue[];
  site: {
    id: string;
    url: string;
    projectId: string;
  };
}

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchScan();
  }, [params.scanId]);

  async function fetchScan() {
    try {
      const response = await fetch(`/api/scans/${params.scanId}`);
      if (response.ok) {
        const data = await response.json();
        setScan(data);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching scan:', error);
    } finally {
      setLoading(false);
    }
  }

  async function exportToCSV() {
    setExporting(true);
    try {
      const response = await fetch(`/api/scans/${params.scanId}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-${params.scanId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting scan:', error);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!scan) {
    return null;
  }

  const filteredIssues = scan.issues.filter(issue => {
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    if (filterType !== 'all' && issue.type !== filterType) return false;
    return true;
  });
  const issuesWithPageUrl = filteredIssues.map(issue => ({
    ...issue,
    pageUrl: issue.pageUrl || scan.site.url,
  }));

  const uniqueTypes = Array.from(new Set(scan.issues.map(i => i.type)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link 
          href={`/projects/${scan.site.projectId}`} 
          className="text-sm text-primary-700 hover:text-primary-800 mb-2 inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Project
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Scan Results</h2>
            <p className="text-gray-600 mt-2">{scan.site.url}</p>
            <p className="text-sm text-gray-500 mt-1">
              Completed {formatDistanceToNow(new Date(scan.startedAt), { addSuffix: true })} 
              {scan.completedAt && ` on ${format(new Date(scan.completedAt), 'PPpp')}`}
            </p>
          </div>
          <Button onClick={exportToCSV} variant="secondary" loading={exporting}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#F5F7FA] border-[#E2E8F0]">
          <div>
            <div>
              <p className="text-sm font-medium text-primary-900">Total Issues</p>
              <p className="text-3xl font-bold text-primary-900 mt-1">{scan.totalIssues}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900">Critical</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{scan.criticalIssues}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-900">Warnings</p>
              <p className="text-3xl font-bold text-yellow-900 mt-1">{scan.warningIssues}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Info</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{scan.infoIssues}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Severity:</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredIssues.length} of {scan.totalIssues} issues
          </div>
        </div>
      </Card>

      {/* Results */}
      <ScanResults issues={issuesWithPageUrl} />
    </div>
  );
}
