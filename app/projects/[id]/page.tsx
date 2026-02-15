'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Badge from '@/components/Badge';
import { formatDistanceToNow } from 'date-fns';

interface Site {
  id: string;
  url: string;
  createdAt: string;
  scans: Array<{
    id: string;
    status: string;
    startedAt: string;
    totalIssues: number;
    criticalIssues: number;
    warningIssues: number;
  }>;
}

interface Project {
  id: string;
  name: string;
  createdAt: string;
  owner: {
    id: string;
    email: string;
    name?: string | null;
  };
  collaborators: Array<{
    id: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }>;
  invites: Array<{
    id: string;
    status: string;
    invitee: {
      id: string;
      email: string;
      name?: string | null;
    };
  }>;
  sites: Site[];
}

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSite, setShowAddSite] = useState(false);
  const [siteUrl, setSiteUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [scanning, setScanning] = useState<Set<string>>(new Set());
  const [showScanOptions, setShowScanOptions] = useState<Record<string, boolean>>({});
  const [scanOptions, setScanOptions] = useState<Record<string, { maxPages: number; maxDepth: number }>>({});

  function getSiteScanOptions(siteId: string) {
    return scanOptions[siteId] || { maxPages: 50, maxDepth: 5 };
  }

  useEffect(() => {
    fetchProject();
    const interval = setInterval(fetchProject, 3000); // Poll for scan updates
    return () => clearInterval(interval);
  }, [params.id]);

  async function fetchProject() {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else if (response.status === 401) {
        router.push('/login');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addSite(e: React.FormEvent) {
    e.preventDefault();
    if (!siteUrl.trim()) return;

    setAdding(true);
    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: siteUrl, projectId: params.id }),
      });

      if (response.ok) {
        setSiteUrl('');
        setShowAddSite(false);
        fetchProject();
      }
    } catch (error) {
      console.error('Error adding site:', error);
    } finally {
      setAdding(false);
    }
  }

  async function runScan(siteId: string) {
    setScanning(prev => new Set(prev).add(siteId));
    try {
      const options = getSiteScanOptions(siteId);
      await fetch(`/api/sites/${siteId}/scans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxPages: options.maxPages,
          maxDepth: options.maxDepth,
        }),
      });
      fetchProject();
    } catch (error) {
      console.error('Error running scan:', error);
    } finally {
      setTimeout(() => {
        setScanning(prev => {
          const next = new Set(prev);
          next.delete(siteId);
          return next;
        });
      }, 1000);
    }
  }

  async function inviteCollaborator(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim() || !project) return;

    setInviting(true);
    setInviteError(null);
    try {
      const response = await fetch(`/api/projects/${project.id}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setInviteError(data.error || 'Failed to invite collaborator');
        return;
      }

      setInviteEmail('');
      fetchProject();
    } catch (error) {
      setInviteError('Failed to invite collaborator');
    } finally {
      setInviting(false);
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

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/" className="text-sm text-primary-700 hover:text-primary-800 mb-2 inline-flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Projects
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{project.name}</h2>
            <p className="text-gray-600 mt-2">
              Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </p>
          </div>
          <Button onClick={() => setShowAddSite(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Site
          </Button>
        </div>
      </div>

      {/* Add Site Form */}
      {showAddSite && (
        <Card>
          <form onSubmit={addSite} className="space-y-4">
            <div>
              <label htmlFor="siteUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Site URL
              </label>
              <input
                id="siteUrl"
                type="url"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={adding} disabled={!siteUrl.trim()}>
                Add Site
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setShowAddSite(false);
                  setSiteUrl('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <h3 className="mb-3 text-lg font-semibold text-gray-900">Collaborators</h3>
        <form onSubmit={inviteCollaborator} className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="collaborator@email.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm sm:max-w-sm"
          />
          <Button type="submit" size="sm" loading={inviting}>
            Invite Collaborator
          </Button>
        </form>
        {inviteError && <p className="mb-3 text-sm text-red-600">{inviteError}</p>}

        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Owner: <span className="font-medium">{project.owner.name || project.owner.email}</span>
          </p>
          {project.collaborators.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {project.collaborators.map((collab) => (
                <Badge key={collab.id} variant="info" size="sm">
                  {collab.user.name || collab.user.email}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No collaborators yet.</p>
          )}
          {project.invites.length > 0 && (
            <div className="pt-2">
              <p className="mb-1 text-sm font-medium text-gray-700">Pending invites</p>
              <div className="flex flex-wrap gap-2">
                {project.invites.map((invite) => (
                  <Badge key={invite.id} variant="neutral" size="sm">
                    {invite.invitee.name || invite.invitee.email}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Sites List */}
      {project.sites.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sites Yet</h3>
            <p className="text-gray-600 mb-4">Add a website URL to start monitoring its accessibility.</p>
            <Button onClick={() => setShowAddSite(true)}>
              Add Your First Site
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {project.sites.map((site) => {
            const latestScan = site.scans[0];
            const isScanning = scanning.has(site.id) || latestScan?.status === 'running';

            return (
              <Card key={site.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{site.url}</h3>
                      {latestScan && (
                        <Badge 
                          variant={
                            latestScan.status === 'completed' 
                              ? 'success'
                              : latestScan.status === 'running' ? 'info' : 'neutral'
                          }
                          size="sm"
                        >
                          {latestScan.status}
                        </Badge>
                      )}
                    </div>

                    {latestScan && latestScan.status === 'completed' && (
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{latestScan.totalIssues}</span>
                          <span>total issues</span>
                        </div>
                        {latestScan.criticalIssues > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-red-600">{latestScan.criticalIssues}</span>
                            <span>critical</span>
                          </div>
                        )}
                        {latestScan.warningIssues > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary-700">{latestScan.warningIssues}</span>
                            <span>warnings</span>
                          </div>
                        )}
                        <div className="text-gray-500">
                          {formatDistanceToNow(new Date(latestScan.startedAt), { addSuffix: true })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      className="text-xs font-medium text-primary-700 transition-colors hover:text-primary-800"
                      onClick={() => setShowScanOptions(prev => ({
                        ...prev,
                        [site.id]: !prev[site.id],
                      }))}
                    >
                      {showScanOptions[site.id] ? 'Hide scan options' : 'Scan options'}
                    </button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-32 justify-center"
                      onClick={() => runScan(site.id)}
                      loading={isScanning}
                      disabled={isScanning}
                    >
                      {isScanning ? 'Scanning...' : 'Run Scan'}
                    </Button>
                    {latestScan && latestScan.status === 'completed' && (
                      <Link href={`/scans/${latestScan.id}`}>
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-32 justify-center"
                        >
                          View Results
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
                {showScanOptions[site.id] && (
                  <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-200 pt-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Max pages</label>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={getSiteScanOptions(site.id).maxPages}
                        onChange={(e) => {
                          const parsed = Number.parseInt(e.target.value, 10);
                          const nextValue = Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(500, parsed));
                          setScanOptions(prev => ({
                            ...prev,
                            [site.id]: {
                              ...getSiteScanOptions(site.id),
                              maxPages: nextValue,
                            },
                          }));
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                        disabled={isScanning}
                      />
                      <p className="mt-1 text-xs text-gray-500">Number of pages to scan (1-500)</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Max depth</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={getSiteScanOptions(site.id).maxDepth}
                        onChange={(e) => {
                          const parsed = Number.parseInt(e.target.value, 10);
                          const nextValue = Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(10, parsed));
                          setScanOptions(prev => ({
                            ...prev,
                            [site.id]: {
                              ...getSiteScanOptions(site.id),
                              maxDepth: nextValue,
                            },
                          }));
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                        disabled={isScanning}
                      />
                      <p className="mt-1 text-xs text-gray-500">How many link levels to follow (1-10)</p>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
