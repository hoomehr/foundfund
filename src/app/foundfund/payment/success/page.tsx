"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createContribution, getCampaignById } from '@/lib/api';
import ContributionSuccessModal from '@/components/ContributionSuccessModal';
import { FundItem } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState(0);
  const [campaignId, setCampaignId] = useState('');
  const [campaign, setCampaign] = useState<FundItem | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        setLoading(true);

        // Get parameters from URL
        const sessionId = searchParams.get('session_id');
        const campaignId = searchParams.get('campaign_id');
        const amount = parseFloat(searchParams.get('amount') || '0');
        const userId = searchParams.get('user_id');
        const message = searchParams.get('message');
        const anonymous = searchParams.get('anonymous') === 'true';
        const campaignName = searchParams.get('campaign_name');

        // Validate parameters
        if (!sessionId || !campaignId || !amount || !userId) {
          setError('Missing required parameters');
          setLoading(false);
          return;
        }

        // If we have a campaign name from the URL but no campaign data yet,
        // create a temporary campaign object with the name
        if (campaignName && !campaign) {
          setCampaign({
            id: campaignId,
            name: decodeURIComponent(campaignName),
            description: 'Loading campaign details...',
            currentAmount: amount, // Start with just the current contribution
            fundingGoal: amount * 2, // Placeholder until we load real data
            imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop',
            creatorId: '',
            status: 'active',
            createdAt: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }

        // Fetch campaign details
        try {
          console.log(`Fetching campaign details for ID: ${campaignId}`);
          const campaignData = await getCampaignById(campaignId);
          setCampaign(campaignData);
          console.log('Campaign details fetched successfully:', campaignData.name);
        } catch (error) {
          console.error('Error fetching campaign details:', error);
          // Continue with the process even if campaign details can't be fetched
        }

        // Check if contribution already exists (to prevent duplicates on page refresh)
        const existingContributions = await fetch(`/api/contributions?stripeSessionId=${sessionId}`);
        const existingData = await existingContributions.json();

        if (existingData && existingData.length > 0) {
          console.log('Contribution already processed');
          // Set data for modal
          setAmount(amount);
          setCampaignId(campaignId);
          setShowModal(true);
          setLoading(false);
          return;
        }

        console.log('Payment success page - Processing session:', sessionId);

        // ULTRA SIMPLE APPROACH - JUST DO IT DIRECTLY
        try {
          console.log('ULTRA SIMPLE APPROACH - JUST DO IT DIRECTLY');

          // Connect to MongoDB directly
          const { connectToDatabase } = await import('@/models');
          const mongoose = await import('mongoose');
          const { v4: uuidv4 } = await import('uuid');

          await connectToDatabase();
          console.log('Connected to database');

          // 1. Check if contribution already exists
          console.log(`Checking for existing contribution with session ID: ${sessionId}`);
          const existingContribution = await mongoose.default.connection.db.collection('contributions').findOne({
            stripeSessionId: sessionId
          });

          if (existingContribution) {
            console.log(`Contribution already exists: ${existingContribution._id}`);
          } else {
            // 2. Create contribution
            console.log('Creating new contribution...');
            const contributionId = uuidv4();
            const contributionData = {
              _id: new mongoose.default.Types.ObjectId(),
              id: contributionId,
              fundItemId: campaignId,
              userId: userId,
              amount: amount,
              message: message || '',
              anonymous: anonymous === 'true',
              status: 'completed',
              stripeSessionId: sessionId,
              createdAt: new Date()
            };

            console.log('Contribution data:', contributionData);

            // Insert contribution
            const result = await mongoose.default.connection.db.collection('contributions').insertOne(contributionData);
            console.log('Contribution created with ID:', result.insertedId);

            // 3. Update campaign
            console.log(`Updating campaign ${campaignId} with amount ${amount}`);

            // Find campaign
            const campaign = await mongoose.default.connection.db.collection('funditems').findOne({
              $or: [
                { _id: mongoose.default.Types.ObjectId.isValid(campaignId) ? new mongoose.default.Types.ObjectId(campaignId) : null },
                { id: campaignId }
              ]
            });

            if (!campaign) {
              console.error(`Campaign not found: ${campaignId}`);
            } else {
              console.log(`Found campaign: ${campaign.name}`);

              // Check if this is a new contributor
              const previousContributions = await mongoose.default.connection.db.collection('contributions').find({
                $or: [
                  { fundItemId: campaignId, userId: userId },
                  { campaignId: campaignId, contributorId: userId }
                ],
                _id: { $ne: contributionData._id }
              }).toArray();

              const isNewContributor = previousContributions.length === 0;
              console.log(`Is new contributor: ${isNewContributor}`);

              // Update campaign
              const updateResult = await mongoose.default.connection.db.collection('funditems').updateOne(
                { _id: campaign._id },
                {
                  $inc: {
                    currentAmount: amount,
                    contributionsCount: 1,
                    uniqueContributorsCount: isNewContributor ? 1 : 0
                  },
                  $set: {
                    status: (campaign.currentAmount + amount >= campaign.fundingGoal) ? 'funded' : campaign.status
                  }
                }
              );

              console.log('Campaign update result:', updateResult);

              // Update the campaign state for the UI
              setCampaign({
                ...campaign,
                currentAmount: campaign.currentAmount + amount,
                contributionsCount: campaign.contributionsCount + 1,
                uniqueContributorsCount: campaign.uniqueContributorsCount + (isNewContributor ? 1 : 0)
              });
            }
          }
        } catch (error) {
          console.error('Error creating contribution:', error);
        }

        // If we have campaign data, refresh it to show updated stats
        if (campaign) {
          try {
            // Refresh campaign data to show updated stats
            const updatedCampaign = await getCampaignById(campaignId);
            setCampaign(updatedCampaign);
            console.log('Campaign data refreshed with updated stats');
          } catch (error) {
            console.error('Error refreshing campaign data:', error);
          }
        }

        // Set data for modal
        setAmount(amount);
        setCampaignId(campaignId);
        setShowModal(true);
      } catch (err) {
        console.error('Error processing payment:', err);
        setError('Failed to process payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

  // Redirect to campaign page after 8 seconds
  useEffect(() => {
    if (showModal && campaignId) {
      const timer = setTimeout(() => {
        router.push(`/foundfund/projects/${campaignId}`);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [showModal, campaignId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
        <h1 className="text-2xl font-bold mb-2">Processing your contribution...</h1>
        <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-6 py-4 rounded-lg mb-6 max-w-md">
          <h1 className="text-xl font-bold mb-2">Payment Error</h1>
          <p>{error}</p>
        </div>
        <button
          onClick={() => router.push('/foundfund/funders')}
          className="px-4 py-2 bg-white text-black rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] transition-shadow"
        >
          Return to Discover
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {showModal && campaign && (
        <ContributionSuccessModal
          isOpen={showModal}
          onClose={() => router.push(`/foundfund/projects/${campaignId}`)}
          amount={amount}
          campaign={campaign}
        />
      )}

      <div className="max-w-2xl w-full bg-card border rounded-xl p-8 shadow-[0_0_30px_rgba(255,255,255,0.2)]" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-center mb-6">
          <div className="bg-green-500/20 p-4 rounded-full border border-green-500/30 shadow-[0_0_15px_rgba(74,222,128,0.5)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 text-shadow-green">Payment Successful!</h1>
        <p className="text-center text-muted-foreground mb-8">Thank you for your contribution of <span className="font-bold text-white">${amount.toLocaleString()}</span></p>

        {campaign ? (
          <div className="mb-8">
            <div className="bg-black/30 rounded-xl overflow-hidden mb-6">
              {campaign.imageUrl && (
                <div className="relative h-48 w-full">
                  <Image
                    src={campaign.imageUrl}
                    alt={campaign.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{campaign.name}</h2>
                <p className="text-muted-foreground mb-4 line-clamp-2">{campaign.description}</p>

                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-card-foreground font-medium">${campaign.currentAmount.toLocaleString()} raised</span>
                  <span className="text-muted-foreground">${campaign.fundingGoal.toLocaleString()} goal</span>
                </div>

                <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(Math.round((campaign.currentAmount / campaign.fundingGoal) * 100), 100)}%`,
                      boxShadow: '0 0 10px rgba(74, 222, 128, 0.7), 0 0 5px rgba(74, 222, 128, 0.5)'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center mb-8">
            <p className="text-muted-foreground">Your contribution has been processed successfully.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/foundfund/projects/${campaignId}`}
            className="px-6 py-3 bg-white text-black rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] transition-shadow text-center font-medium"
          >
            View Campaign
          </Link>
          <Link
            href="/foundfund/funders"
            className="px-6 py-3 bg-black/30 text-white rounded-2xl border border-white/20 hover:bg-black/40 transition-colors text-center font-medium"
          >
            Discover More Projects
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          You will be redirected to the campaign page in a few seconds.
        </p>
      </div>
    </div>
  );
}
