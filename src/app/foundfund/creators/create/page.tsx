'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import ListingForm from '@/components/ListingForm';
import { FundItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateCampaignPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    console.log('Authentication status:', { isAuthenticated, user });
    if (!isAuthenticated) {
      router.push('/foundfund/login?callbackUrl=/foundfund/creators/create');
    }
  }, [isAuthenticated, router, user]);

  const handleSubmit = async (formData: Partial<FundItem>) => {
    try {
      // Create a new campaign object
      const newCampaign: Partial<FundItem> = {
        ...formData,
        id: `campaign-${uuidv4().slice(0, 8)}`,
        creatorId: user?.id || 'user1',
        currentAmount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        publishedAt: new Date().toISOString(),
      };

      console.log('Creating new campaign:', newCampaign);

      // Make API call to create campaign
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCampaign),
      });

      // Get the response data
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        console.error('Error response from server:', responseData);
        throw new Error(responseData.error || 'Failed to create campaign');
      }

      console.log('Campaign created successfully:', responseData);

      // Show success message
      alert(`Campaign "${formData.name}" created successfully!`);

      // Navigate to the creator dashboard
      router.push('/foundfund/creators');
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      alert(`There was an error creating your campaign: ${error.message || 'Please try again.'}`);
    }
  };

  const handleCancel = () => {
    router.push('/foundfund/creators');
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <button
        onClick={() => router.push('/foundfund/creators')}
        className="bg-white text-black mb-6 flex items-center py-2 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-4xl font-bold mb-4 tracking-tight">Create New Campaign</h1>
      <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
        Fill out the form below to create your new funding campaign.
      </p>

      <div className="bg-card border rounded-xl p-8 max-w-5xl mx-auto shadow-[0_0_50px_rgba(255,255,255,0.25),_0_0_80px_rgba(255,255,255,0.15)]" style={{ borderColor: 'var(--border)' }}>
        <ListingForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
