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
        const amountStr = searchParams.get('amount');
        const amount = parseFloat(amountStr || '0');
        const userId = searchParams.get('user_id');
        const message = searchParams.get('message');
        const anonymous = searchParams.get('anonymous') === 'true';
        const campaignName = searchParams.get('campaign_name');

        // Validate parameters
        const missingParams = [];
        if (!sessionId) missingParams.push('session_id');
        if (!campaignId) missingParams.push('campaign_id');
        if (!amountStr) missingParams.push('amount');
        if (isNaN(amount)) missingParams.push('valid amount');
        if (!userId) missingParams.push('user_id');

        if (missingParams.length > 0) {
          const errorMsg = `Missing required parameters: ${missingParams.join(', ')}`;
          console.error(`❌ ${errorMsg}`);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        if (amount <= 0) {
          const errorMsg = `Invalid amount: ${amount}`;
          console.error(`❌ ${errorMsg}`);
          setError(errorMsg);
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
          const campaignData = await getCampaignById(campaignId);
          setCampaign(campaignData);
        } catch (error) {
          // Continue with the process even if campaign details can't be fetched
        }

        // Check if contribution already exists (to prevent duplicates on page refresh)
        try {
          const existingContributionsResponse = await fetch(`/api/contributions?stripeSessionId=${sessionId}`);

          if (!existingContributionsResponse.ok) {
            throw new Error(`Failed to check existing contributions`);
          }

          const existingData = await existingContributionsResponse.json();

          if (existingData && Array.isArray(existingData) && existingData.length > 0) {
            // Set data for modal
            setAmount(amount);
            setCampaignId(campaignId);
            setShowModal(true);
            setLoading(false);
            return;
          }
        } catch (error) {
          // Continue with the process even if checking existing contributions fails
        }

        // Create contribution using direct-create API
        try {
          const requestBody = {
            sessionId,
            campaignId,
            userId,
            amount: amount,
            message: message || '',
            anonymous: anonymous,
          };

          const response = await fetch('/api/contributions/direct-create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });

          if (response.ok) {
            const data = await response.json();

            // Update the campaign state for the UI if available
            if (data.campaign) {
              setCampaign(data.campaign);
            }
          } else {
            throw new Error(`Failed to create contribution`);
          }
        } catch (error) {
          // Try fallback approach - call the process-payment endpoint
          try {
            const requestBody = {
              sessionId,
              campaignId,
              userId,
              amount: amount,
              message: message || '',
              anonymous: anonymous,
            };

            const response = await fetch('/api/contributions/process-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            if (response.ok) {
              const data = await response.json();

              // Update the campaign state for the UI if available
              if (data.campaign) {
                setCampaign(data.campaign);
              }
            } else {
              // Final fallback - try the direct API
              const directResponse = await fetch('/api/contributions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  campaignId: campaignId,
                  userId: userId,
                  amount: amount,
                  message: message || '',
                  anonymous: anonymous,
                  stripeSessionId: sessionId,
                  status: 'completed',
                }),
              });

              if (directResponse.ok) {
                const directData = await directResponse.json();
                // No need to update UI here as we'll show the success modal anyway
              }
            }
          } catch (fallbackError) {
            // We've tried our best, continue to show success modal anyway
          }
        }

        // If we have campaign data, refresh it to show updated stats
        if (campaign) {
          try {
            // Refresh campaign data to show updated stats
            const updatedCampaign = await getCampaignById(campaignId);
            setCampaign(updatedCampaign);
          } catch (error) {
            // Continue with existing campaign data
          }
        }

        // Set data for modal
        setAmount(amount);
        setCampaignId(campaignId);
        setShowModal(true);
      } catch (err) {
        setError('Failed to process payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams]);

  // Redirect to investments page after 8 seconds
  useEffect(() => {
    if (showModal && campaignId) {
      const timer = setTimeout(() => {
        router.push('/foundfund/investments');
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
          onClose={() => router.push('/foundfund/investments')}
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
            href="/foundfund/investments"
            className="px-6 py-3 bg-white text-black rounded-2xl shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] transition-shadow text-center font-medium"
          >
            View My Investments
          </Link>
          {campaignId ? (
            <Link
              href={`/foundfund/projects/${campaignId}`}
              className="px-6 py-3 bg-black/30 text-white rounded-2xl border border-white/20 hover:bg-black/40 transition-colors text-center font-medium"
            >
              View Campaign
            </Link>
          ) : (
            <Link
              href="/foundfund/funders"
              className="px-6 py-3 bg-black/30 text-white rounded-2xl border border-white/20 hover:bg-black/40 transition-colors text-center font-medium"
            >
              Discover Projects
            </Link>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          You will be redirected to your investments page in a few seconds.
        </p>
      </div>
    </div>
  );
}
