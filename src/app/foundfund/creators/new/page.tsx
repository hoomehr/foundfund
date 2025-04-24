'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, fundItems } from '@/data/mockData';
import ListingForm from '@/components/ListingForm';
import { FundItem } from '@/types';

export default function NewCampaignPage() {
  const router = useRouter();
  const currentUser = getCurrentUser();

  const handleSubmit = (formData: Partial<FundItem>) => {
    // In a real app, this would be an API call to create a new campaign

    // For demo purposes, we'll add it to our mock data
    const newCampaign: FundItem = {
      id: `fund${fundItems.length + 1}`,
      creatorId: currentUser.id,
      status: 'active',
      currentAmount: 0,
      createdAt: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      ...formData,
    } as FundItem;

    fundItems.push(newCampaign);

    // Navigate back to the creator dashboard
    router.push('/foundfund/creators');
  };

  const handleCancel = () => {
    router.push('/foundfund/creators');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Create New Campaign</h1>
      <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
        Share your product idea with the world and get funded.
      </p>

      <div className="bg-card border rounded-xl p-8 max-w-2xl mx-auto" style={{ borderColor: 'var(--border)' }}>
        <ListingForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
