'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FundItem, Contribution } from '@/types';
import { getContributionsByContributor, getCampaignById } from '@/lib/api';
import ContributionDetailsModal from '@/components/ContributionDetailsModal';
import BackersModal from '@/components/BackersModal';
import Link from 'next/link';
import Image from 'next/image';

// Mock data for contributions - in a real app, this would come from an API
const mockContributions = [
  {
    id: 'contrib1',
    fundItemId: 'fund1',
    campaignId: 'fund1',
    contributorId: 'user1',
    amount: 100,
    status: 'completed',
    message: "Love this eco-friendly initiative!",
    anonymous: false,
    createdAt: '2023-04-10T00:00:00Z',
    campaign: {
      id: 'fund1',
      name: 'Eco-Friendly Water Bottle',
      description: 'A reusable water bottle made from recycled materials that keeps your drinks cold for 24 hours.',
      category: 'technology',
      fundingGoal: 5000,
      currentAmount: 3200,
      status: 'active',
      createdAt: '2023-04-01T00:00:00Z',
      endDate: '2023-06-01T00:00:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
      creatorId: 'user2',
      creator: {
        name: 'Jane Smith',
        username: 'janesmith',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop'
      }
    }
  },
  {
    id: 'contrib2',
    fundItemId: 'fund3',
    campaignId: 'fund3',
    contributorId: 'user1',
    amount: 150,
    status: 'completed',
    message: "This is exactly what I need for my apartment!",
    anonymous: false,
    createdAt: '2023-04-15T00:00:00Z',
    campaign: {
      id: 'fund3',
      name: 'Smart Home Garden Kit',
      description: 'An automated indoor garden system that lets you grow herbs and vegetables year-round.',
      category: 'technology',
      fundingGoal: 10000,
      currentAmount: 4500,
      status: 'active',
      createdAt: '2023-04-10T00:00:00Z',
      endDate: '2023-07-10T00:00:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae',
      creatorId: 'user3',
      creator: {
        name: 'Bob Johnson',
        username: 'bobjohnson',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2070&auto=format&fit=crop'
      }
    }
  },
  {
    id: 'contrib3',
    fundItemId: 'fund2',
    campaignId: 'fund2',
    contributorId: 'user1',
    amount: 200,
    status: 'completed',
    message: "These mugs look beautiful! Can't wait to receive mine.",
    anonymous: false,
    createdAt: '2023-03-20T00:00:00Z',
    campaign: {
      id: 'fund2',
      name: 'Handcrafted Ceramic Mugs',
      description: 'Unique, handmade ceramic mugs with custom designs. Each piece is one of a kind.',
      category: 'art',
      fundingGoal: 2000,
      currentAmount: 2000,
      status: 'funded',
      createdAt: '2023-03-15T00:00:00Z',
      endDate: '2023-05-15T00:00:00Z',
      imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d',
      creatorId: 'user3',
      creator: {
        name: 'Bob Johnson',
        username: 'bobjohnson',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2070&auto=format&fit=crop'
      }
    }
  },
];

export default function InvestmentsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isBackersModalOpen, setIsBackersModalOpen] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sort contributions from newest to oldest (descending order)
  const sortedContributions = [...contributions].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Analytics data
  const totalInvested = contributions.reduce((sum, contrib) => sum + contrib.amount, 0);
  const totalProjects = new Set(contributions.map(contrib => contrib.campaignId)).size;
  const avgContribution = totalInvested / (contributions.length || 1);
  const successfulProjects = contributions.filter(contrib =>
    contrib.campaign?.status === 'funded'
  ).length;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/foundfund/login?callbackUrl=/foundfund/investments');
    }
  }, [isAuthenticated, router]);

  // Fetch user contributions
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || !user?.id) return;

      try {
        setLoading(true);
        console.log('Fetching contributions for user:', user.id);

        // Try to fetch from API first
        try {
          console.log('Calling getContributionsByContributor with userId:', user.id);
          const userContributions = await getContributionsByContributor(user.id);
          console.log('Received contributions:', userContributions?.length || 0);

          // If we have contributions, fetch the campaign details for each
          if (userContributions && userContributions.length > 0) {
            console.log('Processing contributions and fetching campaign details');

            const contributionsWithCampaigns = await Promise.all(
              userContributions.map(async (contribution) => {
                try {
                  const campaignId = contribution.campaignId || contribution.fundItemId;
                  console.log(`Fetching campaign details for contribution ${contribution.id}, campaign ID: ${campaignId}`);

                  const campaign = await getCampaignById(campaignId);
                  console.log(`Successfully fetched campaign: ${campaign?.name || 'Unknown'}`);

                  return {
                    ...contribution,
                    campaign
                  };
                } catch (error) {
                  console.error(`Error fetching campaign for contribution ${contribution.id}:`, error);

                  // Create a placeholder campaign object if we couldn't fetch the real one
                  const placeholderCampaign = {
                    id: contribution.campaignId || contribution.fundItemId,
                    name: 'Campaign Details Unavailable',
                    description: 'The details for this campaign could not be loaded.',
                    fundingGoal: contribution.amount * 2, // Placeholder
                    currentAmount: contribution.amount,
                    status: 'active',
                    createdAt: contribution.createdAt,
                    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop',
                    creatorId: '',
                  };

                  return {
                    ...contribution,
                    campaign: placeholderCampaign
                  };
                }
              })
            );

            console.log('Setting contributions with campaigns:', contributionsWithCampaigns.length);
            setContributions(contributionsWithCampaigns);
          } else {
            // Fallback to mock data for demo purposes
            console.log('No contributions found in API, using mock data');
            setContributions(mockContributions);
          }
        } catch (apiError) {
          console.error('Error fetching from API:', apiError);

          // Try direct API call as fallback
          try {
            console.log('Trying direct API call to /api/contributions');
            const response = await fetch(`/api/contributions?userId=${user.id}`);

            if (response.ok) {
              const directContributions = await response.json();
              console.log('Direct API call successful, received contributions:', directContributions?.length || 0);

              if (directContributions && directContributions.length > 0) {
                const contributionsWithCampaigns = await Promise.all(
                  directContributions.map(async (contribution) => {
                    try {
                      const campaignId = contribution.campaignId || contribution.fundItemId;
                      const campaign = await getCampaignById(campaignId);
                      return {
                        ...contribution,
                        campaign
                      };
                    } catch (error) {
                      console.error(`Error fetching campaign for contribution ${contribution.id}:`, error);

                      // Create a placeholder campaign object
                      const placeholderCampaign = {
                        id: contribution.campaignId || contribution.fundItemId,
                        name: 'Campaign Details Unavailable',
                        description: 'The details for this campaign could not be loaded.',
                        fundingGoal: contribution.amount * 2, // Placeholder
                        currentAmount: contribution.amount,
                        status: 'active',
                        createdAt: contribution.createdAt,
                        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop',
                        creatorId: '',
                      };

                      return {
                        ...contribution,
                        campaign: placeholderCampaign
                      };
                    }
                  })
                );

                setContributions(contributionsWithCampaigns);
              } else {
                // Fallback to mock data
                console.log('No contributions found in direct API call, using mock data');
                setContributions(mockContributions);
              }
            } else {
              // Fallback to mock data
              console.log('Direct API call failed, using mock data');
              setContributions(mockContributions);
            }
          } catch (directApiError) {
            console.error('Error with direct API call, using mock data:', directApiError);
            // Fallback to mock data
            setContributions(mockContributions);
          }
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load your investments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, isAuthenticated]);

  const openDetailsModal = (contribution: any) => {
    setSelectedContribution(contribution);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedContribution(null);
  };

  const openBackersModal = (campaign: any, campaignContributions: any[]) => {
    setSelectedCampaign(campaign);
    // In a real app, you would fetch the contributions for this campaign
    // For now, we'll just use the current user's contribution
    setIsBackersModalOpen(true);
  };

  const closeBackersModal = () => {
    setIsBackersModalOpen(false);
    setSelectedCampaign(null);
  };

  // Format date to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate days remaining or days since completion
  const getDaysInfo = (contribution: any) => {
    const endDate = new Date(contribution.campaign.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (contribution.campaign.status === 'funded') {
      return 'Funded successfully';
    } else if (diffDays > 0) {
      return `${diffDays} days remaining`;
    } else {
      return 'Campaign ended';
    }
  };

  // Calculate funding progress percentage
  const getProgressPercentage = (campaign: any) => {
    return Math.min(
      Math.round((campaign.currentAmount / campaign.fundingGoal) * 100),
      100
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Loading Investments...</h1>
          <p className="text-muted-foreground mb-6">Please wait while we fetch your investment data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-6 tracking-tight">My Investments</h1>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-card border rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg text-muted-foreground mb-2">Total Invested</h3>
          <p className="text-2xl font-bold text-shadow-green">${totalInvested.toLocaleString()}</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg text-muted-foreground mb-2">Projects Backed</h3>
          <p className="text-2xl font-bold text-shadow-green">{totalProjects}</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg text-muted-foreground mb-2">Avg. Contribution</h3>
          <p className="text-2xl font-bold text-shadow-green">${avgContribution.toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
        </div>
        <div className="bg-card border rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <h3 className="text-lg text-muted-foreground mb-2">Successful Projects</h3>
          <p className="text-2xl font-bold text-shadow-green">{successfulProjects}</p>
        </div>
      </div>

      {/* Contributions List */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Your Contributions</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-md ${viewMode === 'grid'
              ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]'
              : 'bg-black/30 text-white border border-white/20'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-md ${viewMode === 'list'
              ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]'
              : 'bg-black/30 text-white border border-white/20'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {sortedContributions.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xl text-muted-foreground mb-4">You haven't made any contributions yet.</p>
          <Link
            href="/foundfund/funders"
            className="bg-white text-black font-medium py-2.5 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
          >
            Discover Projects
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedContributions.map((contribution) => (
            <div
              key={contribution.id}
              className="bg-card border rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow cursor-pointer"
              onClick={() => openDetailsModal(contribution)}
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex flex-col gap-4">
                {/* Campaign Image */}
                <div className="w-full">
                  <div className="relative h-40 w-full rounded-lg overflow-hidden">
                    <Image
                      src={contribution.campaign.imageUrl}
                      alt={contribution.campaign.name}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>

                {/* Campaign Details */}
                <div className="w-full">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{contribution.campaign.name}</h3>
                    <span className="bg-black/30 text-green-400 text-xs px-2 py-1 rounded-md border border-green-500/30 funding-phase-indicator">
                      {contribution.campaign.status === 'funded' ? 'Funded' : 'Active'}
                    </span>
                  </div>

                  <p className="text-muted-foreground mb-4 line-clamp-2">{contribution.campaign.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Your Contribution</p>
                      <p className="text-lg font-semibold text-shadow-green">${contribution.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm">{formatDate(contribution.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm capitalize">{contribution.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Timeline</p>
                      <p className="text-sm">{getDaysInfo(contribution)}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-900 rounded-full h-2 shadow-inner mb-2">
                    <div
                      className="bg-green-500 h-2 rounded-full funding-phase-indicator"
                      style={{
                        width: `${getProgressPercentage(contribution.campaign)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">${contribution.campaign.currentAmount.toLocaleString()} raised</span>
                    <span className="text-muted-foreground">${contribution.campaign.fundingGoal.toLocaleString()} goal</span>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening the details modal
                        openBackersModal(contribution.campaign, [contribution]);
                      }}
                      className="text-xs text-black bg-white px-2 py-1 rounded-md border border-white/30 hover:bg-white/90 transition-colors shadow-[0_0_10px_rgba(255,255,255,0.5),_0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_15px_rgba(255,255,255,0.7),_0_0_30px_rgba(255,255,255,0.4)]"
                    >
                      View All Backers
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b" style={{ borderColor: 'var(--border)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedContributions.map((contribution, index) => (
                  <tr
                    key={contribution.id}
                    className={`hover:bg-black/20 cursor-pointer ${index !== sortedContributions.length - 1 ? 'border-b' : ''}`}
                    style={{ borderColor: 'var(--border)' }}
                    onClick={() => openDetailsModal(contribution)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 mr-3">
                          <div className="relative h-10 w-10 rounded overflow-hidden">
                            <Image
                              src={contribution.campaign?.imageUrl || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop'}
                              alt={contribution.campaign?.name || 'Campaign'}
                              fill
                              style={{ objectFit: 'cover' }}
                            />
                          </div>
                        </div>
                        <div className="ml-2">
                          <div className="text-sm font-medium">{contribution.campaign?.name || 'Unknown Campaign'}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{contribution.campaign?.description?.substring(0, 50) || 'No description'}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(contribution.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-shadow-green">${contribution.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        contribution.campaign?.status === 'funded'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-black/30 text-white border border-white/20'
                      }`}>
                        {contribution.campaign?.status === 'funded' ? 'Funded' : getDaysInfo(contribution)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening the details modal
                          openBackersModal(contribution.campaign, [contribution]);
                        }}
                        className="text-xs text-black bg-white px-2 py-1 rounded-md border border-white/30 hover:bg-white/90 transition-colors shadow-[0_0_10px_rgba(255,255,255,0.5),_0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_15px_rgba(255,255,255,0.7),_0_0_30px_rgba(255,255,255,0.4)]"
                      >
                        View Backers
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contribution Details Modal */}
      {selectedContribution && (
        <ContributionDetailsModal
          contribution={selectedContribution}
          campaign={selectedContribution?.campaign}
          isOpen={isDetailsModalOpen}
          onClose={closeDetailsModal}
        />
      )}

      {/* Backers Modal */}
      {selectedCampaign && (
        <BackersModal
          campaign={selectedCampaign}
          contributions={sortedContributions.filter(c => c.campaignId === selectedCampaign.id || c.fundItemId === selectedCampaign.id)}
          isOpen={isBackersModalOpen}
          onClose={closeBackersModal}
        />
      )}
    </div>
  );
}
