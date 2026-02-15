'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import Card from './Card';
import Badge from './Badge';

interface Issue {
  id: string;
  type: string;
  severity: string;
  element: string;
  message: string;
  selector?: string | null;
  suggestion?: string | null;
  context?: string | null;
  wcagLevel?: string | null;
  helpUrl?: string | null;
  pageUrl?: string | null;
}

interface ScanResultsProps {
  issues: Issue[];
}

const SEVERITY_COLORS = {
  critical: '#dc2626',
  warning: '#ca8a04',
  info: '#2563eb',
};

const TYPE_LABELS: Record<string, string> = {
  'color-contrast': 'Color Contrast',
  'html-has-lang': 'HTML Language',
  'image-alt': 'Image Alt Text',
  'label': 'Form Labels',
  'link-name': 'Link Names',
  'button-name': 'Button Names',
  'document-title': 'Page Title',
  'heading-order': 'Heading Order',
  'landmark-one-main': 'Main Landmark',
  'list': 'List Structure',
  'missing-alt': 'Missing Alt Text',
  'empty-alt': 'Empty Alt Text',
  'heading-skip': 'Heading Skip',
  'multiple-h1': 'Multiple H1',
  'missing-h1': 'Missing H1',
  'missing-label': 'Missing Form Label',
  'button-no-text': 'Button No Text',
  'link-no-text': 'Link No Text',
  'missing-lang': 'Missing Language',
  'missing-title': 'Missing Title',
  'missing-skip-link': 'Missing Skip Link',
  'missing-landmarks': 'Missing Landmarks',
};

export default function ScanResults({ issues }: ScanResultsProps) {
  const severityData = useMemo(() => {
    const critical = issues.filter(i => i.severity === 'critical').length;
    const warning = issues.filter(i => i.severity === 'warning').length;
    const info = issues.filter(i => i.severity === 'info').length;

    return [
      { name: 'Critical', value: critical, color: SEVERITY_COLORS.critical },
      { name: 'Warning', value: warning, color: SEVERITY_COLORS.warning },
      { name: 'Info', value: info, color: SEVERITY_COLORS.info },
    ].filter(item => item.value > 0);
  }, [issues]);

  const typeData = useMemo(() => {
    const typeCounts = issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        type: TYPE_LABELS[type] || type,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [issues]);

  const groupedIssues = useMemo(() => {
    const groups = issues.reduce((acc, issue) => {
      const key = issue.pageUrl?.trim() || 'Unknown page';
      if (!acc[key]) {
        acc[key] = {
          pageUrl: issue.pageUrl?.trim() || null,
          issueGroups: {},
          critical: 0,
          warning: 0,
          info: 0,
        };
      }

      const issueKey = `${issue.type}::${issue.message}`;
      if (!acc[key].issueGroups[issueKey]) {
        acc[key].issueGroups[issueKey] = {
          key: issueKey,
          type: issue.type,
          message: issue.message,
          issues: [],
          critical: 0,
          warning: 0,
          info: 0,
        };
      }

      acc[key].issueGroups[issueKey].issues.push(issue);
      if (issue.severity === 'critical') acc[key].critical += 1;
      if (issue.severity === 'warning') acc[key].warning += 1;
      if (issue.severity === 'info') acc[key].info += 1;
      if (issue.severity === 'critical') acc[key].issueGroups[issueKey].critical += 1;
      if (issue.severity === 'warning') acc[key].issueGroups[issueKey].warning += 1;
      if (issue.severity === 'info') acc[key].issueGroups[issueKey].info += 1;

      return acc;
    }, {} as Record<string, {
      pageUrl: string | null;
      issueGroups: Record<string, {
        key: string;
        type: string;
        message: string;
        issues: Issue[];
        critical: number;
        warning: number;
        info: number;
      }>;
      critical: number;
      warning: number;
      info: number;
    }>);

    return Object.values(groups).sort((a, b) => {
      if (b.critical !== a.critical) return b.critical - a.critical;
      const aTotal = Object.values(a.issueGroups).reduce((sum, item) => sum + item.issues.length, 0);
      const bTotal = Object.values(b.issueGroups).reduce((sum, item) => sum + item.issues.length, 0);
      if (bTotal !== aTotal) return bTotal - aTotal;
      return (a.pageUrl || '').localeCompare(b.pageUrl || '');
    }).map((group) => ({
      ...group,
      issueGroups: Object.values(group.issueGroups).sort((a, b) => {
        if (b.critical !== a.critical) return b.critical - a.critical;
        if (b.issues.length !== a.issues.length) return b.issues.length - a.issues.length;
        return (TYPE_LABELS[a.type] || a.type).localeCompare(TYPE_LABELS[b.type] || b.type);
      }),
    }));
  }, [issues]);

  function renderIssueCard(issue: Issue) {
    return (
      <div
        key={issue.id}
        className="rounded-lg border border-[#E2E8F0] bg-[#F5F7FA] p-4 transition-colors hover:border-gray-400"
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant={issue.severity as any} size="sm">
              {issue.severity}
            </Badge>
            <span className="text-sm font-medium text-gray-900">
              {TYPE_LABELS[issue.type] || issue.type}
            </span>
            {issue.wcagLevel && (
              <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded font-medium">
                {issue.wcagLevel}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-2">{issue.message}</p>

        {issue.selector && (
          <div className="text-xs text-gray-500 font-mono bg-[#F5F7FA] px-2 py-1 rounded border border-[#E2E8F0] inline-block mb-2">
            {issue.selector}
          </div>
        )}

        {issue.suggestion && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-900">{issue.suggestion}</span>
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center gap-4">
          {issue.helpUrl && (
            <a
              href={issue.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-700 hover:text-primary-800 inline-flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Learn how to fix
            </a>
          )}
        </div>

        {issue.context && (
          <details className="group mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 inline-flex items-center gap-1">
              <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Show code context
            </summary>
            <pre className="mt-2 w-full max-w-full whitespace-pre-wrap break-words p-2 bg-gray-900 text-gray-100 rounded text-xs overflow-x-hidden">
              <code>{issue.context}</code>
            </pre>
          </details>
        )}
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Issues Found!</h3>
          <p className="text-gray-600">This page passed all automated accessibility checks.</p>
          <p className="text-sm text-gray-500 mt-2">
            Powered by axe-core - 90+ WCAG checks
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-1">
              Scanned with axe-core
            </h4>
            <p className="text-sm text-blue-800">
              Industry-standard automated testing with 90+ WCAG 2.1 checks. 
              Issues marked as Info may need manual review.
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Severity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={severityData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {severityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Issue Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={typeData}>
              <XAxis
                dataKey="type"
                interval={0}
                angle={-25}
                textAnchor="end"
                height={80}
                fontSize={11}
              />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#0F766E"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Issue List */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Page</h3>
        <div className="space-y-4">
          {groupedIssues.map((group) => (
            <details key={group.pageUrl || 'unknown-page'} className="group rounded-lg border border-[#E2E8F0] bg-[#F5F7FA]">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 bg-gray-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <svg className="h-4 w-4 flex-shrink-0 text-gray-500 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="truncate font-mono text-sm text-gray-900">
                    {group.pageUrl || 'Unknown page'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">
                    {group.issueGroups.reduce((sum, issueGroup) => sum + issueGroup.issues.length, 0)} total
                  </Badge>
                  {group.critical > 0 && <Badge variant="critical" size="sm">{group.critical} critical</Badge>}
                  {group.warning > 0 && <Badge variant="warning" size="sm">{group.warning} warning</Badge>}
                  {group.info > 0 && <Badge variant="info" size="sm">{group.info} info</Badge>}
                </div>
              </summary>

              <div className="space-y-3 border-t border-gray-200 p-4">
                {group.pageUrl && (
                  <a
                    href={group.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-full items-center gap-1 font-mono text-xs text-primary-700 hover:text-primary-900"
                    title={group.pageUrl}
                  >
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 3h7m0 0v7m0-7L10 14" />
                    </svg>
                    <span className="truncate">{group.pageUrl}</span>
                  </a>
                )}

                {group.issueGroups.map((issueGroup) => (
                  issueGroup.issues.length > 1 ? (
                    <details key={issueGroup.key} className="group/nested rounded-lg border border-[#E2E8F0] bg-[#F5F7FA]">
                      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <svg className="h-4 w-4 flex-shrink-0 text-gray-500 transition-transform group-open/nested:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">
                            {TYPE_LABELS[issueGroup.type] || issueGroup.type}
                          </span>
                          <Badge variant="neutral" size="sm">{issueGroup.issues.length} occurrences</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {issueGroup.critical > 0 && <Badge variant="critical" size="sm">{issueGroup.critical} critical</Badge>}
                          {issueGroup.warning > 0 && <Badge variant="warning" size="sm">{issueGroup.warning} warning</Badge>}
                          {issueGroup.info > 0 && <Badge variant="info" size="sm">{issueGroup.info} info</Badge>}
                        </div>
                      </summary>
                      <div className="space-y-3 border-t border-gray-200 p-3">
                        {issueGroup.issues.map((issue) => renderIssueCard(issue))}
                      </div>
                    </details>
                  ) : (
                    renderIssueCard(issueGroup.issues[0])
                  )
                ))}
              </div>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}
