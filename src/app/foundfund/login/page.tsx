'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/foundfund/funders';
  const error = searchParams.get('error');
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(callbackUrl);
    }
  }, [isAuthenticated, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    console.log('Login attempt with email:', email);

    try {
      const success = await login(email, password);

      if (success) {
        console.log('Login successful, redirecting to:', callbackUrl);
        router.push(callbackUrl);
      } else {
        console.error('Login failed');
        setLoginError('Invalid email or password');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Exception during login:', error);
      setLoginError('An error occurred during login');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 mt-16">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-card border rounded-xl overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          {/* Left side - Image */}
          <div className="relative h-full min-h-[300px] md:min-h-[500px] bg-gradient-to-br from-gray-900 to-black">
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-8 text-center">
              <h1 className="text-4xl font-bold mb-4 text-white">FoundFund</h1>
              <p className="text-lg text-white/80 mb-6">Connect with creators and bring innovative ideas to life</p>
              <div className="w-16 h-1 bg-white/50 rounded-full mb-6"></div>
              <p className="text-white/70">
                Discover exciting projects and support creators in bringing their visions to reality.
              </p>
            </div>
            <div
              className="absolute inset-0 z-[-1]"
              style={{
                backgroundImage: 'url(https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.2
              }}
            ></div>
          </div>

          {/* Right side - Login form */}
          <div className="p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Sign In</h2>
              <p className="text-muted-foreground">Access your account to manage campaigns</p>
            </div>

            {(error || loginError) && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg mb-6">
                {error === 'CredentialsSignin' ? 'Invalid email or password' : loginError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-card-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-card-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-white text-black font-medium py-2.5 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] disabled:opacity-70"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-sm">
                <p className="text-muted-foreground mb-2">
                  <strong>Demo Account:</strong>
                </p>
                <p className="text-muted-foreground">
                  Email: john@example.com <br />
                  Password: password123
                </p>
              </div>

              <div className="mt-6">
                <p className="text-muted-foreground text-sm">
                  Don't have an account?{' '}
                  <Link href="/foundfund/funders" className="text-primary hover:underline">
                    Browse as guest
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
