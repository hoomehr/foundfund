'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.startsWith(path)
      ? 'text-white font-medium text-shadow-green'
      : 'text-muted-foreground hover:text-white';
  };

  return (
    <header className="border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/foundfund" className="text-xl font-bold">
            FoundFund
          </Link>

          <nav className="hidden md:flex space-x-6">
            <Link href="/foundfund/funders" className={`${isActive('/foundfund/funders')} transition-colors`}>
              Discover
            </Link>
            {isAuthenticated && (
              <Link href="/foundfund/investments" className={`${isActive('/foundfund/investments')} transition-colors`}>
                Investments
              </Link>
            )}
            {isAuthenticated && (
              <Link href="/foundfund/creators" className={`${isActive('/foundfund/creators')} transition-colors`}>
                My Campaigns
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="hidden md:inline text-sm text-muted-foreground">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/foundfund/login"
              className="bg-white text-black font-medium py-1.5 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
