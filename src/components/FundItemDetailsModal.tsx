"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { FundItem } from '@/types'
import Modal from '@/components/ui/modal'
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'

// Helper function to determine funding phase based on percentage
const getFundingPhase = (fundItem: FundItem): string => {
  const percentage = Math.round((fundItem.currentAmount / fundItem.fundingGoal) * 100);

  if (percentage >= 100) return "Funded";
  if (percentage >= 75) return "Final Phase";
  if (percentage >= 50) return "Mid Phase";
  if (percentage >= 25) return "Early Phase";
  return "Starting";
};

interface FundItemDetailsModalProps {
  fundItem: FundItem
  isOpen: boolean
  onClose: () => void
}

export default function FundItemDetailsModal({ fundItem, isOpen, onClose }: FundItemDetailsModalProps) {
  const [contributionAmount, setContributionAmount] = useState<number>(10);
  const [isContributing, setIsContributing] = useState<boolean>(false);
  const progressPercentage = Math.min(
    Math.round((fundItem.currentAmount / fundItem.fundingGoal) * 100),
    100
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={fundItem.name}>
      <div className="space-y-8">
        {fundItem.imageUrl && (
          <div className="relative h-64 w-full rounded-lg overflow-hidden">
            <Image
              src={fundItem.imageUrl || "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop"}
              fill
              className="object-cover"
              alt={fundItem.name}
            />
          </div>
        )}

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

        <div className="bg-card border rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          {/* Project Details */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-3">Project Details</h3>
            <p className="text-muted-foreground leading-relaxed">{fundItem.description}</p>
          </div>

          {/* Funding Progress */}
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Funding Progress</h3>
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
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Project Timeline</h3>
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
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Creator Info</h3>
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
            <div className="border-t border-white/10 pt-6 mt-6">
              <h3 className="text-xl font-bold mb-4">Contribute to this Project</h3>
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
                    onClick={() => setIsContributing(false)}
                    className="flex-1 bg-white text-black py-2.5 px-4 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
                  >
                    Confirm Contribution
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border-t border-white/10 pt-6 mt-6 flex space-x-3">
              <button
                onClick={() => setIsContributing(true)}
                className="flex-1 bg-white text-black py-2.5 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
              >
                Contribute to this Project
              </button>
              <button
                onClick={onClose}
                className="bg-white/10 text-white py-2.5 px-6 rounded-2xl transition-colors border border-white/20"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
