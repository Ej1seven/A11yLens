'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ProjectCard from '@/components/ProjectCard';

interface Project {
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
}

interface Invite {
  id: string;
  project: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    email: string;
    name?: string | null;
  };
  createdAt: string;
}

export default function Home() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [respondingInviteId, setRespondingInviteId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    await Promise.all([fetchProjects(), fetchInvites()]);
  }

  async function fetchProjects() {
    try {
      const response = await fetch('/api/projects');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInvites() {
    try {
      const response = await fetch('/api/invites');
      if (response.status === 401) {
        router.push('/login');
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      setInvites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching invites:', error);
    }
  }

  async function respondToInvite(inviteId: string, action: 'accept' | 'reject') {
    setRespondingInviteId(inviteId);
    try {
      const response = await fetch(`/api/invites/${inviteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error responding to invite:', error);
    } finally {
      setRespondingInviteId(null);
    }
  }

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName }),
      });

      if (response.ok) {
        setProjectName('');
        setShowNewProject(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600 mt-2">
            Manage your accessibility monitoring projects
          </p>
        </div>
        <Button onClick={() => setShowNewProject(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Button>
      </div>

      {/* New Project Form */}
      {showNewProject && (
        <Card>
          <form onSubmit={createProject} className="space-y-4">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Website Accessibility Project"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={creating} disabled={!projectName.trim()}>
                Create Project
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => {
                  setShowNewProject(false);
                  setProjectName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {invites.length > 0 && (
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Collaboration Requests</h3>
          <div className="space-y-3">
            {invites.map((invite) => (
              <div key={invite.id} className="rounded-lg border border-[#E2E8F0] bg-white px-4 py-3">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{invite.inviter.name || invite.inviter.email}</span>{' '}
                  invited you to collaborate on{' '}
                  <span className="font-semibold">{invite.project.name}</span>.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => respondToInvite(invite.id, 'accept')}
                    loading={respondingInviteId === invite.id}
                    disabled={respondingInviteId === invite.id}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => respondToInvite(invite.id, 'reject')}
                    loading={respondingInviteId === invite.id}
                    disabled={respondingInviteId === invite.id}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first accessibility monitoring project.</p>
            <Button onClick={() => setShowNewProject(true)}>
              Create Your First Project
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="bg-[#F5F7FA] border-[#E2E8F0]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#CCFBF1] rounded-lg">
              <svg className="w-6 h-6 text-[#0F766E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Automated Scans</h3>
              <p className="text-sm text-gray-600">Run comprehensive accessibility checks on any URL</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#F5F7FA] border-[#E2E8F0]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-sky-100 rounded-lg">
              <svg className="w-6 h-6 text-sky-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Visual Reports</h3>
              <p className="text-sm text-gray-600">Interactive charts and detailed issue breakdowns</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[#F5F7FA] border-[#E2E8F0]">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-violet-100 rounded-lg">
              <svg className="w-6 h-6 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Fix Suggestions</h3>
              <p className="text-sm text-gray-600">Get actionable recommendations for every issue</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
