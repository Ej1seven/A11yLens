'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add('login-page');

    return () => {
      document.body.classList.remove('login-page');
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login' ? { email, password } : { email, password, name };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError('Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  const loginBackground =
    `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:svgjs='http://svgjs.dev/svgjs' width='1440' height='560' preserveAspectRatio='none' viewBox='0 0 1440 560'%3e%3cg mask='url(%26quot%3b%23SvgjsMask1014%26quot%3b)' fill='none'%3e%3crect width='1440' height='560' x='0' y='0' fill='rgba(15%2c 118%2c 110%2c 1)'%3e%3c/rect%3e%3cpath d='M1440 0L1041.96 0L1440 80.62z' fill='rgba(255%2c 255%2c 255%2c .1)'%3e%3c/path%3e%3cpath d='M1041.96 0L1440 80.62L1440 329.72L581.6500000000001 0z' fill='rgba(255%2c 255%2c 255%2c .075)'%3e%3c/path%3e%3cpath d='M581.65 0L1440 329.72L1440 454.44000000000005L271.33 0z' fill='rgba(255%2c 255%2c 255%2c .05)'%3e%3c/path%3e%3cpath d='M271.3299999999999 0L1440 454.44000000000005L1440 471.57000000000005L128.90999999999994 0z' fill='rgba(255%2c 255%2c 255%2c .025)'%3e%3c/path%3e%3cpath d='M0 560L318.05 560L0 516.03z' fill='rgba(0%2c 0%2c 0%2c .1)'%3e%3c/path%3e%3cpath d='M0 516.03L318.05 560L440.95000000000005 560L0 400.9z' fill='rgba(0%2c 0%2c 0%2c .075)'%3e%3c/path%3e%3cpath d='M0 400.9L440.95000000000005 560L449.82000000000005 560L0 360.07z' fill='rgba(0%2c 0%2c 0%2c .05)'%3e%3c/path%3e%3cpath d='M0 360.07L449.82000000000005 560L1003.9300000000001 560L0 166.47z' fill='rgba(0%2c 0%2c 0%2c .025)'%3e%3c/path%3e%3c/g%3e%3cdefs%3e%3cmask id='SvgjsMask1014'%3e%3crect width='1440' height='560' fill='white'%3e%3c/rect%3e%3c/mask%3e%3c/defs%3e%3c/svg%3e")`;

  return (
    <>
      <style jsx global>{`
        body.login-page {
          overflow: hidden;
        }

        body.login-page main {
          min-height: calc(100vh - 7rem - 73px);
          padding-top: 0;
          padding-bottom: 0;
        }

        @media (max-width: 767px) {
          body.login-page footer {
            display: none;
          }

          body.login-page main {
            min-height: calc(100vh - 7rem);
          }
        }
      `}</style>
      <div
        className="fixed inset-x-0 top-28 bottom-0 z-0"
        style={{
          backgroundImage: loginBackground,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="relative z-10 flex min-h-[calc(100vh-7rem)] items-center justify-center px-4 py-4 md:min-h-[calc(100vh-7rem-73px)]">
        <div className="w-full max-w-md">
          <Card className="bg-white/95 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h1>
            <button
              type="button"
              className="text-sm text-primary-700 hover:text-primary-800 hover:underline"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Need an account?' : 'Have an account?'}
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'}
                minLength={mode === 'register' ? 8 : 1}
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" loading={loading} className="w-full justify-center">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          </Card>
        </div>
      </div>
    </>
  );
}
