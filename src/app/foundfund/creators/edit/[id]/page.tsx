'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { fundItems } from '@/data/mockData';
import ListingForm from '@/components/ListingForm';
import { FundItem } from '@/types';

interface EditCampaignPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCampaignPage({ params }: EditCampaignPageProps) {
  const router = useRouter();

  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  // Find the campaign in our mock data
  const campaign = fundItems.find(item => item.id === id);

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Campaign Not Found</h1>
        <p className="text-lg text-muted-foreground mb-10">
          The campaign you're looking for doesn't exist.
        </p>
        <button
          onClick={() => router.push('/foundfund/creators')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-6 rounded-md transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleSubmit = (formData: Partial<FundItem>) => {
    // In a real app, this would be an API call to update the campaign

    // For demo purposes, we'll update our mock data
    const campaignIndex = fundItems.findIndex(item => item.id === id);
    if (campaignIndex !== -1) {
      fundItems[campaignIndex] = {
        ...fundItems[campaignIndex],
        ...formData,
      };
    }

    // Navigate back to the campaign details page
    router.push(`/foundfund/creators/campaigns/${id}`);
  };

  const handleCancel = () => {
    router.push(`/foundfund/creators/campaigns/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <button
        onClick={() => router.push(`/foundfund/creators/campaigns/${id}`)}
        className="bg-white text-black mb-6 flex items-center py-2 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
      >
        ← Back to Campaign
      </button>

      <h1 className="text-4xl font-bold mb-4 tracking-tight">Edit Campaign</h1>
      <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
        Update your campaign details.
      </p>

      <div className="bg-card border rounded-xl p-8 max-w-2xl mx-auto shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
        <ListingForm
          initialData={campaign}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
