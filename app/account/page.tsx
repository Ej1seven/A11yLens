'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';

interface User {
  id: string;
  email: string;
  name?: string | null;
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me');
        if (response.status === 401) {
          router.push('/login');
          return;
        }

        const data = await response.json();
        setUser(data.user || null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-1/4 rounded bg-gray-200" />
        <div className="h-24 w-full rounded bg-gray-200" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Account</h2>
        <p className="mt-2 text-gray-600">Manage your profile details.</p>
      </div>

      <Card>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-600">Name</dt>
            <dd className="text-base text-gray-900">{user.name || 'Not set'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">Email</dt>
            <dd className="text-base text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-600">User ID</dt>
            <dd className="font-mono text-sm text-gray-700">{user.id}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
