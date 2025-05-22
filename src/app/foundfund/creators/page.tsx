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
    if ((campaign as any).contributions && Array.isArray((campaign as any).contributions)) {
      (campaign as any).contributions.forEach((contribution: any) => {
        if (contribution.contributorId) {
          allContributorIds.add(contribution.contributorId);
        }
      });
    }
  });
  const totalFunders = allContributorIds.size;

  const successRate = totalCampaigns > 0 ? (successfulCampaigns / totalCampaigns) * 100 : 0;
  const avgFundingPercentage = userCampaigns.length > 0 
    ? userCampaigns.reduce((sum, campaign) => sum + ((campaign.currentAmount / campaign.fundingGoal) * 100), 0) / userCampaigns.length 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-900 relative">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-green-500/20 to-purple-500/20 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-green-500/20 rounded-full blur-3xl opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-white/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.3)]">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-white bg-clip-text text-transparent tracking-tight">
                    Creator Dashboard
                  </h1>
                  <p className="text-gray-400 text-lg mt-2">
                    Welcome back, {user?.name || 'Creator'}! Manage your campaigns and track your success.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/foundfund/creators/new"
                className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-purple-500 rounded-2xl font-semibold text-white transition-all duration-300 shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:shadow-[0_0_30px_rgba(74,222,128,0.6)] hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Campaign</span>
                </span>
              </Link>
              
              <Link
                href="/foundfund/funders"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:scale-105 text-center"
              >
                Browse Projects
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Analytics Dashboard */}
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-green-500 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Performance Analytics</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Campaigns */}
            <div className="group bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-sm border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:bg-white/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-xl"></div>
              <div className="relative">
                <h3 className="text-gray-400 text-sm font-medium mb-3">Total Campaigns</h3>
                <p className="text-4xl font-bold text-white mb-2">{totalCampaigns}</p>
                <p className="text-green-400 text-sm">Active projects</p>
              </div>
            </div>

            {/* Total Raised */}
            <div className="group bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-sm border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:bg-white/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-xl"></div>
              <div className="relative">
                <h3 className="text-gray-400 text-sm font-medium mb-3">Total Raised</h3>
                <p className="text-4xl font-bold text-white mb-2">${totalRaised.toLocaleString()}</p>
                <p className="text-purple-400 text-sm">Lifetime earnings</p>
              </div>
            </div>

            {/* Success Rate */}
            <div className="group bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-sm border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:bg-white/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-xl"></div>
              <div className="relative">
                <h3 className="text-gray-400 text-sm font-medium mb-3">Success Rate</h3>
                <p className="text-4xl font-bold text-white mb-2">{successRate.toFixed(1)}%</p>
                <p className="text-green-400 text-sm">{successfulCampaigns} funded</p>
              </div>
            </div>

            {/* Total Funders */}
            <div className="group bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-sm border border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:bg-white/15 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-xl"></div>
              <div className="relative">
                <h3 className="text-gray-400 text-sm font-medium mb-3">Total Supporters</h3>
                <p className="text-4xl font-bold text-white mb-2">{totalFunders.toLocaleString()}</p>
                <p className="text-purple-400 text-sm">Unique backers</p>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Average Funding Progress</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Campaign completion rate</span>
                  <span className="text-white font-semibold">{avgFundingPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-purple-500 h-3 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                    style={{ width: `${Math.min(avgFundingPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-gray-400 text-sm">Average progress across all campaigns</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Average Contribution</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Per campaign average</span>
                  <span className="text-white font-semibold">${avgFunding.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-purple-500 bg-clip-text text-transparent">
                    ${(totalFunders > 0 ? totalRaised / totalFunders : 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">Average per supporter</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-purple-500 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Your Campaigns</h2>
              {totalCampaigns > 0 && (
                <span className="bg-gradient-to-r from-green-400/20 to-purple-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-400/30">
                  {totalCampaigns} {totalCampaigns === 1 ? 'campaign' : 'campaigns'}
                </span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-500 rounded-full animate-spin animate-reverse"></div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-red-400 mb-2">Unable to Load Campaigns</h3>
              <p className="text-red-300 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-6 py-3 rounded-xl transition-colors border border-red-500/30"
              >
                Try Again
              </button>
            </div>
          ) : userCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userCampaigns.map(campaign => (
                <div key={campaign.id} className="group">
                  <CampaignCard campaign={campaign} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-white/5 via-white/3 to-transparent border border-white/20 rounded-3xl p-12 text-center backdrop-blur-sm">
              <div className="w-24 h-24 bg-gradient-to-r from-green-400/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Ready to Start Your Journey?</h3>
              <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                You haven't created any funding campaigns yet. Launch your first project and start building your community of supporters!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/foundfund/creators/new"
                  className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-purple-500 rounded-2xl font-semibold text-white transition-all duration-300 shadow-[0_0_20px_rgba(74,222,128,0.4)] hover:shadow-[0_0_30px_rgba(74,222,128,0.6)] hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Your First Campaign</span>
                  </span>
                </Link>
                
                <Link
                  href="/foundfund/funders"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl font-semibold text-white transition-all duration-300 hover:bg-white/20 hover:scale-105 text-center"
                >
                  Explore Other Projects
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
