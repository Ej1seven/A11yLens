'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

type User = {
  id: string;
  email: string;
  name?: string | null;
};

export default function AuthMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          headers: { 'cache-control': 'no-cache' },
        });
        if (!response.ok) {
          setUser(null);
          return;
        }
        const data = await response.json();
        setUser(data.user || null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [pathname]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setOpen(false);
    router.push('/login');
    router.refresh();
  }

  if (loading) {
    return <span className="text-sm text-gray-500">Loading...</span>;
  }

  if (!user) return null;

  return (
    <div className="relative flex items-center gap-3">
      <span className="hidden text-sm text-gray-600 md:block">
        {user.name || user.email}
      </span>
      <button
        type="button"
        aria-label="Open account menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-40 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
          <Link
            href="/account"
            className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Account
          </Link>
          <button
            type="button"
            className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
