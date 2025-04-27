"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createContribution } from '@/lib/api';
import { ContributionSuccessModal } from '@/components/ContributionSuccessModal';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState(0);
  const [campaignId, setCampaignId] = useState('');

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
        
        // Validate parameters
        if (!sessionId || !campaignId || !amount || !userId) {
          setError('Missing required parameters');
          setLoading(false);
          return;
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
        
        // Create the contribution
        const contribution = {
          campaignId,
          contributorId: userId,
          amount,
          message: message || '',
          anonymous,
          status: 'completed',
          stripeSessionId: sessionId,
          createdAt: new Date().toISOString(),
        };
        
        // Save the contribution
        await createContribution(contribution);
        
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
      {showModal && (
        <ContributionSuccessModal
          isOpen={showModal}
          onClose={() => router.push(`/foundfund/projects/${campaignId}`)}
          amount={amount}
        />
      )}
      
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Thank you for your contribution!</h1>
        <p className="text-muted-foreground mb-6">You will be redirected to the campaign page shortly.</p>
        <button
          onClick={() => router.push(`/foundfund/projects/${campaignId}`)}
          className="px-4 py-2 bg-white text-black rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] transition-shadow"
        >
          Return to Campaign
        </button>
      </div>
    </div>
  );
}
