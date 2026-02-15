'use client';

import Link from 'next/link';
import Card from './Card';
import Badge from './Badge';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    createdAt: string;
    sites: Array<{
      id: string;
      url: string;
      scans: Array<{
        totalIssues: number;
        criticalIssues: number;
        status: string;
      }>;
    }>;
  };
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const totalSites = project.sites.length;
  const recentScan = project.sites
    .flatMap(site => site.scans)
    .filter(scan => scan.status === 'completed')[0];

  return (
    <Link href={`/projects/${project.id}`} className="no-underline hover:no-underline">
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-700 group-hover:underline transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </p>
          </div>
          <svg 
            className="w-5 h-5 text-gray-400 group-hover:text-primary-700 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-gray-600">{totalSites} {totalSites === 1 ? 'site' : 'sites'}</span>
          </div>

          {recentScan && (
            <>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-gray-600">{recentScan.totalIssues} issues</span>
              </div>

              {recentScan.criticalIssues > 0 && (
                <Badge variant="critical" size="sm">
                  {recentScan.criticalIssues} critical
                </Badge>
              )}
            </>
          )}
        </div>
      </Card>
    </Link>
  );
}
