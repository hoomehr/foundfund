"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import { FundItem } from '@/types';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';
import FundItemDetailsModal from '@/components/FundItemDetailsModal';

interface FundItemCardProps {
  fundItem: FundItem;
  onContribute: (fundItemId: string, amount: number) => void;
}

export default function FundItemCard({ fundItem, onContribute }: FundItemCardProps) {
  const [contributionAmount, setContributionAmount] = useState<number>(10);
  const [isContributing, setIsContributing] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        <CardBody className="bg-card border rounded-xl overflow-hidden w-full shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow duration-300" style={{ borderColor: 'var(--border)' }}>
          {fundItem.imageUrl && (
            <CardItem translateZ="60" className="w-full">
              <div className="relative h-48 w-full">
                <Image
                  src={fundItem.imageUrl}
                  alt={fundItem.name}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </CardItem>
          )}

          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <CardItem translateZ="40" className="text-xl font-semibold text-card-foreground">
                {fundItem.name}
              </CardItem>
              <CardItem translateZ="30" className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md">
                {fundItem.category}
              </CardItem>
            </div>

            <CardItem translateZ="30" className="flex flex-wrap gap-2 mb-3">
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

            <CardItem translateZ="30" as="p" className="text-muted-foreground mb-4 line-clamp-3">
              {fundItem.description}
            </CardItem>

            <CardItem translateZ="40" className="mb-5 w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-card-foreground">${fundItem.currentAmount.toLocaleString()} raised</span>
                <span className="text-muted-foreground">${fundItem.fundingGoal.toLocaleString()} goal</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{
                    width: `${progressPercentage}%`,
                    boxShadow: '0 0 10px rgba(74, 222, 128, 0.7), 0 0 5px rgba(74, 222, 128, 0.5)'
                  }}
                ></div>
              </div>
              <div className="text-right text-xs text-muted-foreground mt-1">
                {progressPercentage}% funded
              </div>
            </CardItem>

            <CardItem translateZ="50" className="w-full">
              {isContributing ? (
                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="mr-2 text-card-foreground">$</span>
                    <input
                      type="number"
                      min="1"
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(Number(e.target.value))}
                      className="border border-input bg-background rounded-md px-3 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleContribute}
                      className="bg-white text-black px-4 py-2 rounded-2xl text-sm flex-1 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setIsContributing(false)}
                      className="bg-white text-black px-4 py-2 rounded-2xl text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsContributing(true)}
                    className="flex-1 bg-white text-black font-medium py-2.5 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
                  >
                    Contribute
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 bg-white text-black font-medium py-2.5 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
                  >
                    Details
                  </button>
                </div>
              )}
            </CardItem>
          </div>
        </CardBody>
      </CardContainer>

      {isModalOpen && (
        <FundItemDetailsModal
          fundItem={fundItem}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
