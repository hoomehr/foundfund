"use client"

import React, { useState, use, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCampaignById, createStripeCheckoutSession } from '@/lib/api'
import { FundItem, Contribution } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import BackersModal from '@/components/BackersModal'
import ContributionSuccessModal from '@/components/ContributionSuccessModal'
import { getStripe } from '@/lib/stripe'

// Helper function to determine funding phase based on percentage
const getFundingPhase = (fundItem: FundItem): string => {
  const percentage = Math.round((fundItem.currentAmount / fundItem.fundingGoal) * 100);

  if (percentage >= 100) return "Funded";
  if (percentage >= 75) return "Final Phase";
  if (percentage >= 50) return "Mid Phase";
  if (percentage >= 25) return "Early Phase";
  return "Starting";
};

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [contributionAmount, setContributionAmount] = useState<number>(10);
  const [isContributing, setIsContributing] = useState<boolean>(false);
  const [fundItem, setFundItem] = useState<FundItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackersModalOpen, setIsBackersModalOpen] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [lastContributionAmount, setLastContributionAmount] = useState<number>(0);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [paymentCanceled, setPaymentCanceled] = useState<boolean>(false);

  // Unwrap params using React.use()
  const resolvedParams = use(params);

  // Check for payment canceled parameter
  useEffect(() => {
    const paymentCanceledParam = searchParams.get('payment_canceled');
    if (paymentCanceledParam === 'true') {
      setPaymentCanceled(true);
      // Clear the parameter after 5 seconds
      setTimeout(() => {
        setPaymentCanceled(false);
        // Remove the parameter from the URL without refreshing the page
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }, 5000);
    }
  }, [searchParams]);

  // Fetch fund item data
  useEffect(() => {
    const fetchFundItem = async () => {
      try {
        setLoading(true);
        console.log(`Project page: Fetching campaign with id ${resolvedParams.id}`);

        const item = await getCampaignById(resolvedParams.id);
        console.log(`Project page: Successfully fetched campaign:`, item?.name);

        if (!item) {
          console.error(`Project page: Campaign not found for id ${resolvedParams.id}`);
          setError('Project not found. It may have been removed or is no longer available.');
          setFundItem(null);
        } else {
          setFundItem(item);
          setError(null);

          // Fetch contributions for this campaign
          fetchContributions(item.id);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to load project details. Please try again later.');
        setFundItem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchFundItem();
  }, [resolvedParams.id]);

  // Fetch contributions for the campaign
  const fetchContributions = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/contributions?campaignId=${campaignId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }

      const data = await response.json();
      setContributions(data);
    } catch (error) {
      // Silently fail - contributions will be empty
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading Project...</h1>
          <p className="text-muted-foreground mb-6">Please wait while we fetch the project details.</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !fundItem) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || "The project you're looking for doesn't exist or has been removed."}</p>
          <Link
            href="/foundfund/funders"
            className="bg-white text-black py-2.5 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
          >
            Browse Projects
          </Link>
        </div>
      </div>
    );
  }

  const progressPercentage = Math.min(
    Math.round((fundItem.currentAmount / fundItem.fundingGoal) * 100),
    100
  );

  const handleContribute = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push(`/foundfund/login?callbackUrl=/foundfund/projects/${resolvedParams.id}`);
      return;
    }

    try {
      setIsContributing(true);

      // Create the checkout data
      const checkoutData = {
        campaignId: fundItem.id,
        amount: contributionAmount,
        userId: user?.id,
        message: '',
        anonymous: false
      };

      // Make API call to create a Stripe checkout session
      let responseData;
      try {
        responseData = await createStripeCheckoutSession(checkoutData);
      } catch (error) {
        // If we're in development mode, use a mock response for testing
        if (process.env.NODE_ENV === 'development') {
          responseData = {
            sessionId: 'mock_session_id',
            url: `http://localhost:3000/foundfund/payment/success?session_id=mock_session_id&campaign_id=${fundItem.id}&amount=${contributionAmount}&user_id=${user?.id}&message=&anonymous=false`
          };
        } else {
          throw error;
        }
      }

      // Store the contribution amount for the success modal
      setLastContributionAmount(contributionAmount);

      // Redirect to Stripe Checkout
      const stripe = await getStripe();
      if (!stripe) {
        alert('Payment system is not available at the moment. Please try again later or contact support.');
        setIsContributing(false);
        return;
      }

      // If we have a URL, redirect directly
      if (responseData.url) {
        window.location.href = responseData.url;
        return;
      }

      // Otherwise use the session ID
      const { error } = await stripe.redirectToCheckout({
        sessionId: responseData.sessionId,
      });

      if (error) {
        throw new Error(error.message || 'Failed to redirect to payment page');
      }

      // Reset the form (this code will only run if the redirect fails)
      setIsContributing(false);
      setContributionAmount(10);
    } catch (error: any) {
      // Provide a more specific error message if available
      let errorMessage = 'There was an error processing your contribution. Please try again.';

      if (error?.message) {
        if (error.message.includes('Campaign not found')) {
          errorMessage = 'The campaign could not be found. It may have been removed or is no longer available.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      alert(errorMessage);
      setIsContributing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      {paymentCanceled && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-3 rounded-lg mb-6">
          <h3 className="font-bold mb-1">Payment Canceled</h3>
          <p>Your payment was canceled. No contribution has been made.</p>
        </div>
      )}

      <button
        onClick={() => router.push('/foundfund/funders')}
        className="bg-white text-black mb-6 flex items-center py-2 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
      >
        ← Back to Projects
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{fundItem.name}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              {fundItem.category}
            </span>
            <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              trending
            </span>
            {fundItem.currentAmount > 1000 && (
              <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                popular
              </span>
            )}
          </div>

          {fundItem.imageUrl && (
            <div className="relative h-80 w-full rounded-xl overflow-hidden mb-8">
              <Image
                src={fundItem.imageUrl.startsWith('/uploads') ? fundItem.imageUrl : fundItem.imageUrl}
                alt={fundItem.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>

        {/* Project Content */}
        <div className="bg-card border rounded-xl p-8 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          {/* Project Details */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Project Details</h2>
            <p className="text-muted-foreground leading-relaxed">{fundItem.description}</p>
          </div>

          {/* Funding Progress */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Funding Progress</h2>
              <button
                onClick={() => setIsBackersModalOpen(true)}
                className="bg-white text-black text-sm px-3 py-1.5 rounded-md border border-white/30 hover:bg-white/90 transition-colors flex items-center gap-1 shadow-[0_0_15px_rgba(255,255,255,0.5),_0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7),_0_0_40px_rgba(255,255,255,0.4)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                View All Backers ({contributions.length})
              </button>
            </div>
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-card-foreground font-medium">${fundItem.currentAmount.toLocaleString()} raised</span>
                <span className="text-muted-foreground">${fundItem.fundingGoal.toLocaleString()} goal</span>
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
                  {getFundingPhase(fundItem)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {progressPercentage}% funded
                </div>
              </div>
            </div>
          </div>

          {/* Project Timeline */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Project Timeline</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">Created</div>
                <div className="text-white font-medium">{new Date(fundItem.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">End Date</div>
                <div className="text-white font-medium">{new Date(fundItem.endDate).toLocaleDateString()}</div>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">Status</div>
                <div className="text-white font-medium capitalize">{fundItem.status}</div>
              </div>
            </div>
          </div>

          {/* Creator Info */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Creator Info</h2>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xl mr-4">
                {fundItem.creatorId.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-white font-medium">Creator #{fundItem.creatorId}</div>
                <div className="text-muted-foreground text-sm">Member since {new Date(fundItem.createdAt).getFullYear()}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">Total Projects</div>
                <div className="text-white font-medium">3</div>
              </div>
              <div className="bg-black/20 rounded-xl p-4 border border-white/10">
                <div className="text-muted-foreground text-sm mb-1">Success Rate</div>
                <div className="text-white font-medium">85%</div>
              </div>
            </div>
          </div>

          {/* Contribute Section */}
          {isContributing ? (
            <div className="border-t border-white/10 pt-8 mt-8">
              <h2 className="text-2xl font-bold mb-4">Contribute to this Project</h2>
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="mr-2 text-card-foreground font-medium">$</span>
                  <input
                    type="number"
                    min="1"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(Number(e.target.value))}
                    className="border border-input bg-background rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsContributing(false)}
                    className="flex-1 bg-white/10 text-white py-2.5 px-4 rounded-2xl transition-colors border border-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleContribute}
                    className="flex-1 bg-white text-black py-2.5 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
                  >
                    Confirm Contribution
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/10 pt-8 mt-8">
              <button
                onClick={() => isAuthenticated ? setIsContributing(true) : router.push(`/foundfund/login?callbackUrl=/foundfund/projects/${resolvedParams.id}`)}
                className="w-full bg-white text-black py-3 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] font-medium"
              >
                {isAuthenticated ? 'Contribute to this Project' : 'Sign In to Contribute'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Backers Modal */}
      {fundItem && (
        <BackersModal
          campaign={fundItem}
          contributions={contributions}
          isOpen={isBackersModalOpen}
          onClose={() => setIsBackersModalOpen(false)}
        />
      )}

      {/* Contribution Success Modal */}
      {fundItem && (
        <ContributionSuccessModal
          campaign={fundItem}
          amount={lastContributionAmount}
          isOpen={isSuccessModalOpen}
          onClose={() => setIsSuccessModalOpen(false)}
        />
      )}
    </div>
  );
}
