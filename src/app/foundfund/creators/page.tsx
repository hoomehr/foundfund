'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCampaignsByCreator } from '@/lib/api';
import { FundItem, User } from '@/types';
import CampaignCard from '@/components/CampaignCard';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function CreatorsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [userCampaigns, setUserCampaigns] = useState<FundItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/foundfund/login?callbackUrl=/foundfund/creators');
    }
  }, [isAuthenticated, router]);

  // Fetch user campaigns and their contributions
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        setLoading(true);
        // Use 'user1' for demo purposes to match mock data
        const userId = user.id === '68007dd6b8d75134f41c88a8' ? 'user1' : user.id;

        const campaigns = await getCampaignsByCreator(userId);

        // Fetch contributions for each campaign
        const campaignsWithContributions = await Promise.all(
          (campaigns || []).map(async (campaign) => {
            try {
              const response = await fetch(`/api/contributions?campaignId=${campaign.id}`);
              if (response.ok) {
                const contributions = await response.json();
                return { ...campaign, contributions };
              }
              return campaign;
            } catch (error) {
              return campaign;
            }
          })
        );

        setUserCampaigns(campaignsWithContributions || []);
        setError(null);
      } catch (err) {
        setError('Failed to load your campaigns. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticated]);

  // Analytics data
  const totalCampaigns = userCampaigns.length;
  const totalRaised = userCampaigns.reduce((sum, campaign) => sum + campaign.currentAmount, 0);
  const avgFunding = totalCampaigns > 0 ? totalRaised / totalCampaigns : 0;
  const successfulCampaigns = userCampaigns.filter(campaign => campaign.status === 'funded').length;

  // Calculate total funders (count unique users who backed campaigns)
  const allContributorIds = new Set();
  userCampaigns.forEach(campaign => {
    // If the campaign has contributions data, add unique contributor IDs to the set
    if (campaign.contributions && Array.isArray(campaign.contributions)) {
      campaign.contributions.forEach(contribution => {
        if (contribution.contributorId) {
          allContributorIds.add(contribution.contributorId);
        }
      });
    }
  });
  const totalFunders = allContributorIds.size;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold tracking-tight">My Fund Raisings</h1>
        <Link
          href="/foundfund/creators/new"
          className="bg-white text-black font-medium py-2.5 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
        >
          Create New Campaign
        </Link>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
        <div className="bg-card border rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg text-muted-foreground mb-2">Total Campaigns</h3>
          <p className="text-2xl font-bold text-shadow-green">{totalCampaigns}</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg text-muted-foreground mb-2">Total Raised</h3>
          <p className="text-2xl font-bold text-shadow-green">${totalRaised.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg text-muted-foreground mb-2">Total Funders</h3>
          <p className="text-2xl font-bold text-shadow-green">{totalFunders.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg text-muted-foreground mb-2">Avg. Funding</h3>
          <p className="text-2xl font-bold text-shadow-green">${avgFunding.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg text-muted-foreground mb-2">Successful Campaigns</h3>
          <p className="text-2xl font-bold text-shadow-green">{successfulCampaigns}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Your Campaigns</h2>

      {loading ? (
        <div className="text-center py-16 border rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xl text-muted-foreground">Loading your campaigns...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 border rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xl text-muted-foreground">{error}</p>
        </div>
      ) : userCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0.5 max-w-7xl mx-auto">
          {userCampaigns.map(campaign => (
            <div key={campaign.id} className="flex justify-center">
              <div className="w-full max-w-md">
                <CampaignCard campaign={campaign} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-xl font-medium text-card-foreground mb-3">No Campaigns Yet</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            You haven't created any funding campaigns yet. Get started by creating your first campaign!
          </p>
          <Link
            href="/foundfund/creators/new"
            className="bg-white text-black font-medium py-2.5 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
          >
            Create Your First Campaign
          </Link>
        </div>
      )}
    </div>
  );
}
