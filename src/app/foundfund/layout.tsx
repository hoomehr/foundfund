import React from 'react';
import Link from 'next/link';

export default function FoundFundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-background border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            FoundFund
          </Link>
          <nav className="space-x-8">
            <Link
              href="/foundfund/funders"
              className="text-foreground hover:text-foreground/80 transition-colors"
            >
              Discover
            </Link>
            <Link
              href="/foundfund/creators"
              className="text-foreground hover:text-foreground/80 transition-colors"
            >
              Create
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} FoundFund - Connecting creators with funders
          </p>
        </div>
      </footer>
    </div>
  );
}
