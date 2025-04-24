'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ListingForm from '@/components/ListingForm';
import { FundItem } from '@/types';
import { useSession } from 'next-auth/react';

export default function NewCampaignPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/foundfund/login?callbackUrl=/foundfund/creators/new');
    }
  }, [status, router]);

  const handleSubmit = async (formData: Partial<FundItem>) => {
    if (!session?.user?.id) {
      router.push('/foundfund/login?callbackUrl=/foundfund/creators/new');
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, this would be an API call to create a new campaign
      // For now, we'll just simulate success and redirect

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Navigate back to the creator dashboard
      router.push('/foundfund/creators');
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/foundfund/creators');
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Create New Campaign</h1>
      <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
        Share your product idea with the world and get funded.
      </p>

      <div className="bg-card border rounded-xl p-8 max-w-2xl mx-auto" style={{ borderColor: 'var(--border)' }}>
        <ListingForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
      </div>
    </div>
  );
}
