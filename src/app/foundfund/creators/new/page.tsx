'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ListingForm from '@/components/ListingForm';
import SuccessModal from '@/components/SuccessModal';
import { FundItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function NewCampaignPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCampaign, setCreatedCampaign] = useState<Partial<FundItem>>({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/foundfund/login?callbackUrl=/foundfund/creators/new');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (formData: Partial<FundItem>) => {
    if (!isAuthenticated || !user?.id) {
      router.push('/foundfund/login?callbackUrl=/foundfund/creators/new');
      return;
    }

    setIsLoading(true);

    try {
      // Add the creator ID to the form data
      const campaignData = {
        ...formData,
        creatorId: user.id,
        currentAmount: 0,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      // Submit the campaign to the API
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      // Get the created campaign data
      const createdData = await response.json();

      // Set the created campaign and show success modal
      setCreatedCampaign({
        ...campaignData,
        ...createdData
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/foundfund/creators');
  };

  // Show loading state while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-xl text-muted-foreground">Loading...</p>
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
        Share your product idea with the world and get funded.
      </p>

      <div className="bg-card border rounded-xl p-8 max-w-5xl mx-auto shadow-[0_0_50px_rgba(255,255,255,0.25),_0_0_80px_rgba(255,255,255,0.15)]" style={{ borderColor: 'var(--border)' }}>
        <ListingForm onSubmit={handleSubmit} onCancel={handleCancel} isLoading={isLoading} />
      </div>

      {/* Success Modal */}
      <SuccessModal
        campaign={createdCampaign}
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push('/foundfund/creators');
        }}
      />
    </div>
  );
}
