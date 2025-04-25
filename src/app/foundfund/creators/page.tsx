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

  // Fetch user campaigns
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        setLoading(true);
        console.log('Fetching campaigns for user:', user.id);
        const campaigns = await getCampaignsByCreator(user.id);
        setUserCampaigns(campaigns || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load your campaigns. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticated]);

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Creator Dashboard</h1>
      <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
        Manage your campaigns and track your funding progress.
      </p>

      <div className="mb-10">
        <Link
          href="/foundfund/creators/new"
          className="bg-white text-black font-medium py-2.5 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
        >
          Create New Campaign
        </Link>
      </div>

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
