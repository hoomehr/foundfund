'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCampaignById } from '@/lib/api';
import ListingForm from '@/components/ListingForm';
import EditSuccessModal from '@/components/EditSuccessModal';
import { FundItem } from '@/types';

interface EditCampaignPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditCampaignPage({ params }: EditCampaignPageProps) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<FundItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [updatedCampaign, setUpdatedCampaign] = useState<Partial<FundItem>>({});

  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  // Fetch campaign data
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        console.log(`Edit campaign page: Fetching campaign with id ${id}`);

        const item = await getCampaignById(id);
        console.log(`Edit campaign page: Successfully fetched campaign:`, item?.name);

        if (!item) {
          console.error(`Edit campaign page: Campaign not found for id ${id}`);
          setError('Campaign not found. It may have been removed or is no longer available.');
          setCampaign(null);
        } else {
          setCampaign(item);
          setError(null);
        }
      } catch (err: any) {
        console.error('Edit campaign page: Error fetching campaign:', err);
        setError(err?.message || 'Failed to load campaign details. Please try again later.');
        setCampaign(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [id]);

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Loading Campaign...</h1>
        <p className="text-lg text-muted-foreground mb-10">
          Please wait while we fetch the campaign details.
        </p>
      </div>
    );
  }

  // If the campaign doesn't exist, show a message
  if (error || !campaign) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Campaign Not Found</h1>
        <p className="text-lg text-muted-foreground mb-10">
          {error || "The campaign you're looking for doesn't exist."}
        </p>
        <button
          onClick={() => router.push('/foundfund/creators')}
          className="bg-white text-black py-2.5 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handleSubmit = async (formData: Partial<FundItem>) => {
    try {
      console.log('Updating campaign:', formData);

      // Make API call to update the campaign
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Error response from server:', responseData);
        throw new Error(responseData.error || 'Failed to update campaign');
      }

      console.log('Campaign updated successfully:', responseData);

      // Set the updated campaign data and show success modal
      setUpdatedCampaign({
        ...formData,
        id,
        ...responseData
      });
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      alert(`There was an error updating your campaign: ${error.message || 'Please try again.'}`);
    }
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

      <div className="bg-card border rounded-xl p-8 max-w-5xl mx-auto shadow-[0_0_50px_rgba(255,255,255,0.25),_0_0_80px_rgba(255,255,255,0.15)]" style={{ borderColor: 'var(--border)' }}>
        <ListingForm
          initialData={campaign}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>

      {/* Success Modal */}
      <EditSuccessModal
        campaign={updatedCampaign}
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push(`/foundfund/creators/campaigns/${id}`);
        }}
      />
    </div>
  );
}
