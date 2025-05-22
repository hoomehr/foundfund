import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FundItem } from '@/types';
// Removed 3D card imports for better performance

interface FundItemCardProps {
  fundItem: FundItem;
  onContribute: (fundItemId: string, amount: number) => void;
  isDiscoverPage?: boolean;
}

// Helper function to determine funding phase based on percentage
const getFundingPhase = (fundItem: FundItem): string => {
  const percentage = Math.round((fundItem.currentAmount / fundItem.fundingGoal) * 100);

  if (percentage >= 100) return "Funded";
  if (percentage >= 75) return "Final Phase";
  if (percentage >= 50) return "Mid Phase";
  if (percentage >= 25) return "Early Phase";
  return "Starting";
};

// Helper function to get phase color
const getPhaseColor = (fundItem: FundItem): string => {
  const percentage = Math.round((fundItem.currentAmount / fundItem.fundingGoal) * 100);

  if (percentage >= 100) return "green";
  if (percentage >= 75) return "orange";
  if (percentage >= 50) return "blue";
  if (percentage >= 25) return "purple";
  return "gray";
};

export default function FundItemCard({ fundItem, onContribute, isDiscoverPage = false }: FundItemCardProps) {
  const [contributionAmount, setContributionAmount] = useState<number>(10);
  const [isContributing, setIsContributing] = useState<boolean>(false);

  const progressPercentage = Math.min(
    Math.round((fundItem.currentAmount / fundItem.fundingGoal) * 100),
    100
  );

  const handleContribute = () => {
    onContribute(fundItem.id, contributionAmount);
    setIsContributing(false);
    setContributionAmount(10);
  };

  const phaseColor = getPhaseColor(fundItem);

  return (
    <div className="bg-gradient-to-br from-card via-card/95 to-card/90 border rounded-2xl overflow-hidden w-full h-full shadow-lg hover:shadow-xl transition-all duration-300 group hover:-translate-y-2" style={{ borderColor: 'var(--border)', minHeight: '500px' }}>
      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent group-hover:via-green-500 transition-all duration-300"></div>
      
      {fundItem.imageUrl && (
        <div className="w-full">
          <div className="relative w-full rounded-t-2xl overflow-hidden" style={{ paddingBottom: '66.67%' }}>
            <Image
              src={fundItem.imageUrl.startsWith('/uploads') ? fundItem.imageUrl : fundItem.imageUrl}
              alt={fundItem.name}
              fill
              style={{ objectFit: 'cover' }}
              priority
              className="transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
            
            {/* Floating badge with phase indicator */}
            <div className="absolute top-4 right-4">
              <div className={`${
                phaseColor === 'green' ? 'bg-green-500/20 text-green-400 border-green-500/40' :
                phaseColor === 'orange' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
                phaseColor === 'blue' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                phaseColor === 'purple' ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' :
                'bg-gray-500/20 text-gray-400 border-gray-500/40'
              } text-xs px-3 py-1.5 rounded-full border backdrop-blur-sm transition-all duration-300`}>
                {getFundingPhase(fundItem)}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pt-6 pb-4 relative">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-card-foreground transition-all duration-300">
            {fundItem.name}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="bg-gradient-to-r from-white/10 to-white/5 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 transition-all duration-300 backdrop-blur-sm">
            {fundItem.category}
          </span>
          {fundItem.currentAmount > (fundItem.fundingGoal * 0.5) && (
            <span className="bg-gradient-to-r from-orange-500/20 to-orange-500/10 text-orange-400 text-xs px-3 py-1.5 rounded-full border border-orange-500/40 transition-all duration-300 backdrop-blur-sm">
              trending
            </span>
          )}
          {fundItem.currentAmount > 2000 && (
            <span className="bg-gradient-to-r from-green-500/20 to-green-500/10 text-green-400 text-xs px-3 py-1.5 rounded-full border border-green-500/40 transition-all duration-300 backdrop-blur-sm">
              popular
            </span>
          )}
        </div>

        <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
          {fundItem.description}
        </p>

        <div className="mb-4 w-full">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-card-foreground font-medium">${fundItem.currentAmount.toLocaleString()} raised</span>
            <span className="text-muted-foreground">${fundItem.fundingGoal.toLocaleString()} goal</span>
          </div>
          <div className="w-full bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-full h-2.5 shadow-inner overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-500 h-2.5 rounded-full transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
              }}
            ></div>
          </div>
          <div className="flex justify-between text-xs mt-2">
            <span className="text-muted-foreground font-medium">
              {progressPercentage}% funded
            </span>
            <span className="text-white font-medium">
              Ends: {new Date(fundItem.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="relative mt-6 mb-2">
          <Link
            href={`/foundfund/projects/${fundItem.id}`}
            className={`block w-full text-center text-sm text-black bg-gradient-to-r from-white via-white to-gray-100 px-4 py-3 rounded-2xl border border-white/30 font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
              isDiscoverPage ? 'opacity-0 group-hover:opacity-100' : ''
            }`}
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
