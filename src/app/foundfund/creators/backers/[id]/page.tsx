'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { fundItems, getContributionsByFundItem, users } from '@/data/mockData';

interface BackersPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BackersPage({ params }: BackersPageProps) {
  const router = useRouter();

  // Unwrap params using React.use()
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  // Find the campaign in our mock data
  const campaign = fundItems.find(item => item.id === id);

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">Campaign Not Found</h1>
        <p className="text-lg text-muted-foreground mb-10">
          The campaign you're looking for doesn't exist.
        </p>
        <button
          onClick={() => router.push('/foundfund/creators')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 px-6 rounded-md transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Get contributions for this campaign
  const contributions = getContributionsByFundItem(id);

  // Calculate funding progress
  const progressPercentage = Math.min(
    Math.round((campaign.currentAmount / campaign.fundingGoal) * 100),
    100
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <button
        onClick={() => router.push('/foundfund/creators')}
        className="bg-white text-black mb-6 flex items-center py-2 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-4xl font-bold mb-3 tracking-tight">{campaign.name}</h1>
      <p className="text-lg text-muted-foreground mb-8">Backers and Funding Progress</p>

      <div className="bg-card border rounded-xl p-8 mb-10 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow duration-300" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-2xl font-semibold mb-6">Funding Progress</h2>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-card-foreground">${campaign.currentAmount.toLocaleString()} raised</span>
            <span className="text-muted-foreground">${campaign.fundingGoal.toLocaleString()} goal</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="text-right text-xs text-muted-foreground mt-1">
            {progressPercentage}% funded
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border)' }}>
            <span className="text-muted-foreground block mb-1">Campaign Status</span>
            <span className="text-card-foreground font-medium text-lg">
              {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            </span>
          </div>
          <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border)' }}>
            <span className="text-muted-foreground block mb-1">End Date</span>
            <span className="text-card-foreground font-medium text-lg">
              {new Date(campaign.endDate).toLocaleDateString()}
            </span>
          </div>
          <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border)' }}>
            <span className="text-muted-foreground block mb-1">Total Backers</span>
            <span className="text-card-foreground font-medium text-lg">{contributions.length}</span>
          </div>
          <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border)' }}>
            <span className="text-muted-foreground block mb-1">Average Contribution</span>
            <span className="text-card-foreground font-medium text-lg">
              ${contributions.length > 0
                ? Math.round(campaign.currentAmount / contributions.length).toLocaleString()
                : '0'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-8 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow duration-300" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-2xl font-semibold mb-6">Backers List</h2>

        {contributions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b" style={{ borderColor: 'var(--border)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Backer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ divideColor: 'var(--border)' }}>
                {contributions.map(contribution => {
                  const backer = users.find(user => user.id === contribution.userId);

                  return (
                    <tr key={contribution.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-card-foreground">
                          {backer?.name || 'Anonymous'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-card-foreground">
                          ${contribution.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground">
                          {new Date(contribution.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-xl" style={{ borderColor: 'var(--border)' }}>
            <p className="text-lg text-muted-foreground">
              No backers yet. Share your campaign to get funded!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
