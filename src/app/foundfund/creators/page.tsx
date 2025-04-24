'use client';

import React from 'react';
import Link from 'next/link';
import { getCurrentUser, getFundItemsByCreator } from '@/data/mockData';
import CampaignCard from '@/components/CampaignCard';

export default function CreatorsPage() {
  // In a real app, we would get the current user from authentication
  const currentUser = getCurrentUser();

  // Get campaigns for the current user
  const userCampaigns = getFundItemsByCreator(currentUser.id);

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

      {userCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {userCampaigns.map(campaign => (
            <div key={campaign.id} className="flex justify-center">
              <div className="w-full max-w-md">
                <CampaignCard campaign={campaign} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-xl" style={{ borderColor: 'var(--border)' }}>
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
