"use client"

import React, { useState, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fundItems } from '@/data/mockData'
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

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [contributionAmount, setContributionAmount] = useState<number>(10);
  const [isContributing, setIsContributing] = useState<boolean>(false);

  // Unwrap params using React.use()
  const resolvedParams = use(params);

  // Find the fund item with the matching ID
  const fundItem = fundItems.find(item => item.id === resolvedParams.id);

  // If the fund item doesn't exist, show a message
  if (!fundItem) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or has been removed.</p>
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

  const handleContribute = () => {
    // In a real app, this would make an API call to process the contribution
    alert(`Contributing $${contributionAmount} to project ${fundItem.id}`);

    // For demo purposes, we could update the mock data here
    const itemIndex = fundItems.findIndex(item => item.id === fundItem.id);
    if (itemIndex !== -1) {
      fundItems[itemIndex].currentAmount += contributionAmount;
    }

    setIsContributing(false);
    setContributionAmount(10);

    // Refresh the page to show the updated data
    router.refresh();
  };

  return (
    <div className="container mx-auto px-4 py-12">
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
                src={fundItem.imageUrl}
                alt={fundItem.name}
                fill
                className="object-cover"
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
            <h2 className="text-2xl font-bold mb-4">Funding Progress</h2>
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
                onClick={() => setIsContributing(true)}
                className="w-full bg-white text-black py-3 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] font-medium"
              >
                Contribute to this Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
