"use client"

import React, { useState, use, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getCampaignById } from '@/lib/api'
import { FundItem } from '@/types'

// Helper function to determine funding phase based on percentage
const getFundingPhase = (fundItem: FundItem): string => {
  const percentage = Math.round((fundItem.currentAmount / fundItem.fundingGoal) * 100);

  if (percentage >= 100) return "Funded";
  if (percentage >= 75) return "Final Phase";
  if (percentage >= 50) return "Mid Phase";
  if (percentage >= 25) return "Early Phase";
  return "Starting";
};

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<FundItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params using React.use()
  const resolvedParams = use(params);

  // Fetch campaign data
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setLoading(true);
        console.log(`Creator campaign page: Fetching campaign with id ${resolvedParams.id}`);

        const item = await getCampaignById(resolvedParams.id);
        console.log(`Creator campaign page: Successfully fetched campaign:`, item?.name);

        if (!item) {
          console.error(`Creator campaign page: Campaign not found for id ${resolvedParams.id}`);
          setError('Campaign not found. It may have been removed or is no longer available.');
          setCampaign(null);
        } else {
          setCampaign(item);
          setError(null);
        }
      } catch (err: any) {
        console.error('Creator campaign page: Error fetching campaign:', err);
        setError(err?.message || 'Failed to load campaign details. Please try again later.');
        setCampaign(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [resolvedParams.id]);

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading Campaign...</h1>
          <p className="text-muted-foreground mb-6">Please wait while we fetch the campaign details.</p>
        </div>
      </div>
    );
  }

  // If the campaign doesn't exist, show a message
  if (error || !campaign) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Campaign Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "The campaign you're looking for doesn't exist or has been removed."}</p>
          <Link
            href="/foundfund/creators"
            className="bg-white text-black py-2.5 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.min(
    Math.round((campaign.currentAmount / campaign.fundingGoal) * 100),
    100
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <button
        onClick={() => router.push('/foundfund/creators')}
        className="bg-white text-black mb-6 flex items-center py-2 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
      >
        ← Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Campaign Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold">{campaign.name}</h1>
            <div className="flex space-x-3">
              <Link
                href={`/foundfund/creators/edit/${campaign.id}`}
                className="bg-white text-black py-2 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
              >
                Edit Campaign
              </Link>
              <Link
                href={`/foundfund/creators/backers/${campaign.id}`}
                className="bg-white text-black py-2 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
              >
                View Backers
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {campaign.category}
            </span>
            <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              trending
            </span>
            {campaign.currentAmount > 1000 && (
              <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                popular
              </span>
            )}
          </div>

          {campaign.imageUrl && (
            <div className="relative h-80 w-full rounded-xl overflow-hidden mb-8">
              <Image
                src={campaign.imageUrl.startsWith('/uploads') ? campaign.imageUrl : campaign.imageUrl}
                alt={campaign.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>

        {/* Campaign Content */}
        <div className="bg-card border rounded-xl p-8 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          {/* Campaign Details */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Campaign Details</h2>
            <p className="text-muted-foreground leading-relaxed">{campaign.description}</p>
          </div>

          {/* Funding Progress */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Funding Progress</h2>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-card-foreground font-medium">${campaign.currentAmount.toLocaleString()} raised</span>
                <span className="text-muted-foreground">${campaign.fundingGoal.toLocaleString()} goal</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3 shadow-inner">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{
                    width: `${progressPercentage}%`,
                    boxShadow: '0 0 10px rgba(74, 222, 128, 0.7), 0 0 5px rgba(74, 222, 128, 0.5)'
                  }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="bg-black/30 text-green-400 text-xs px-2 py-1 rounded-md border border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                  {getFundingPhase(campaign)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {progressPercentage}% funded
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Timeline */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Campaign Timeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">Created</div>
                <div className="text-white font-medium">{new Date(campaign.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">End Date</div>
                <div className="text-white font-medium">{new Date(campaign.endDate).toLocaleDateString()}</div>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">Status</div>
                <div className="text-white font-medium capitalize">{campaign.status}</div>
              </div>
            </div>
          </div>

          {/* Campaign Stats */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Campaign Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">Total Backers</div>
                <div className="text-white font-medium">{Math.floor(campaign.currentAmount / 50)}</div>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">Avg. Contribution</div>
                <div className="text-white font-medium">
                  ${Math.floor(campaign.currentAmount / Math.max(1, Math.floor(campaign.currentAmount / 50)))}
                </div>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">Days Left</div>
                <div className="text-white font-medium">
                  {Math.max(0, Math.floor((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                </div>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">Daily Average</div>
                <div className="text-white font-medium">
                  ${Math.floor(campaign.currentAmount / Math.max(1, Math.floor((new Date().getTime() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24))))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-white/10 pt-8 mt-8 flex space-x-3">
            <Link
              href={`/foundfund/creators/edit/${campaign.id}`}
              className="flex-1 bg-white text-black py-3 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] text-center font-medium"
            >
              Edit Campaign
            </Link>
            <Link
              href={`/foundfund/creators/backers/${campaign.id}`}
              className="flex-1 bg-white text-black py-3 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] text-center font-medium"
            >
              View Backers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
