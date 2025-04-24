import React from 'react';
import Header from '@/components/Header';

export default function FoundFundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

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
