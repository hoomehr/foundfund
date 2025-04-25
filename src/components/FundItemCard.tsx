import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FundItem } from '@/types';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';

interface FundItemCardProps {
  fundItem: FundItem;
  onContribute: (fundItemId: string, amount: number) => void;
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

export default function FundItemCard({ fundItem, onContribute }: FundItemCardProps) {
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

  return (
    <>
      <CardContainer>
        <CardBody className="bg-card border rounded-xl overflow-hidden w-full h-full shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow duration-300" style={{ borderColor: 'var(--border)', minHeight: '500px' }}>
          {fundItem.imageUrl && (
            <CardItem translateZ="60" className="w-full">
              <div className="relative h-48 w-full">
                <Image
                  src={fundItem.imageUrl.startsWith('/uploads') ? fundItem.imageUrl : fundItem.imageUrl}
                  alt={fundItem.name}
                  fill
                  style={{ objectFit: 'cover' }}
                  priority
                />
              </div>
            </CardItem>
          )}

          <div className="p-5">
            <div className="flex justify-between items-start mb-2">
              <CardItem translateZ="40" className="text-xl font-semibold text-card-foreground">
                {fundItem.name}
              </CardItem>
              <CardItem translateZ="30" className="bg-black/30 text-green-400 text-xs px-2 py-1 rounded-md border border-green-500/30 funding-phase-indicator">
                {getFundingPhase(fundItem)}
              </CardItem>
            </div>

            <CardItem translateZ="30" className="flex flex-wrap gap-2 mb-2">
              <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {fundItem.category}
              </span>
              {fundItem.currentAmount > (fundItem.fundingGoal * 0.5) && (
                <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  trending
                </span>
              )}
              {fundItem.currentAmount > 2000 && (
                <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                  popular
                </span>
              )}
            </CardItem>

            <CardItem translateZ="30" as="p" className="text-muted-foreground mb-2 line-clamp-3">
              {fundItem.description}
            </CardItem>

            <CardItem translateZ="40" className="mb-3 w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-card-foreground">${fundItem.currentAmount.toLocaleString()} raised</span>
                <span className="text-muted-foreground">${fundItem.fundingGoal.toLocaleString()} goal</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2 shadow-inner">
                <div
                  className="bg-green-500 h-2 rounded-full funding-phase-indicator"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                ></div>
              </div>
              <div className="text-right text-xs text-muted-foreground mt-1">
                {progressPercentage}% funded
              </div>

              <div className="flex justify-start text-xs text-muted-foreground mt-3">
                <div className="text-left">
                  <span className="font-medium text-white">
                    Ends: {new Date(fundItem.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardItem>

            <CardItem translateZ="50" className="w-full">
              <div className="flex justify-center">
                <Link
                  href={`/foundfund/projects/${fundItem.id}`}
                  className="w-full bg-white text-black font-medium py-2.5 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] text-center"
                >
                  View Details
                </Link>
              </div>
            </CardItem>
          </div>
        </CardBody>
      </CardContainer>
    </>
  );
}
