'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname.startsWith(path)
      ? 'text-white font-semibold text-shadow-green drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]'
      : 'text-muted-foreground hover:text-white hover:text-shadow-white transition-all duration-300';
  };

  return (
    <header className="border-b bg-gradient-to-r from-card/95 via-card to-card/95 backdrop-blur-sm" style={{ borderColor: 'var(--border)' }}>
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
      
      <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
        <div className="flex items-center space-x-8">
          <Link 
            href="/foundfund" 
            className="text-xl font-bold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent hover:from-green-400 hover:via-white hover:to-green-400 transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]"
          >
            FoundFund
          </Link>

          <nav className="hidden md:flex space-x-6">
            <Link 
              href="/foundfund/funders" 
              className={`${isActive('/foundfund/funders')} relative group`}
            >
              <span className="relative z-10">Discover</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2"></div>
            </Link>
            {isAuthenticated && (
              <Link 
                href="/foundfund/investments" 
                className={`${isActive('/foundfund/investments')} relative group`}
              >
                <span className="relative z-10">Investments</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2"></div>
              </Link>
            )}
            {isAuthenticated && (
              <Link 
                href="/foundfund/creators" 
                className={`${isActive('/foundfund/creators')} relative group`}
              >
                <span className="relative z-10">My Campaigns</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2"></div>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="hidden md:inline text-sm text-muted-foreground bg-gradient-to-r from-gray-400 to-gray-300 bg-clip-text text-transparent">
                Welcome, {user?.name}
              </span>
              <button
                onClick={logout}
                className="text-sm text-muted-foreground hover:text-white transition-all duration-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] relative group"
              >
                <span className="relative z-10">Sign Out</span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </>
          ) : (
            <Link
              href="/foundfund/login"
              className="bg-gradient-to-r from-white via-white to-gray-100 text-black font-semibold py-2.5 px-6 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.6),_0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.8),_0_0_60px_rgba(255,255,255,0.4)] hover:scale-105 hover:-translate-y-0.5 btn-glow relative overflow-hidden group"
            >
              <span className="relative z-10">Sign In</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white to-green-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
