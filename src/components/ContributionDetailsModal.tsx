import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Contribution, FundItem } from '@/types';

interface ContributionDetailsModalProps {
  contribution: Contribution;
  campaign?: Partial<FundItem>;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContributionDetailsModal({ 
  contribution, 
  campaign, 
  isOpen, 
  onClose 
}: ContributionDetailsModalProps) {
  if (!isOpen) return null;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-black/70 border border-white/20 rounded-xl w-full max-w-md mx-auto overflow-hidden animate-fadeIn"
        style={{ boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)' }}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <h2 className="text-xl font-bold text-white">Contribution Details</h2>
            <button 
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {campaign && (
            <div className="bg-black/30 rounded-xl overflow-hidden mb-5 border border-white/10">
              <div className="relative h-32 w-full">
                {campaign.imageUrl && (
                  <Image
                    src={campaign.imageUrl}
                    alt={campaign.name || 'Campaign'}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-3">
                <h3 className="text-lg font-bold mb-1 truncate">{campaign.name}</h3>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/70">
                    ${campaign.currentAmount?.toLocaleString() || '0'} raised
                  </span>
                  <span className="text-white/70">
                    ${campaign.fundingGoal?.toLocaleString()} goal
                  </span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-1.5 mb-2">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.7),_0_0_20px_rgba(255,255,255,0.4)]"
                    style={{ 
                      width: `${Math.min(
                        ((campaign.currentAmount || 0) / (campaign.fundingGoal || 1)) * 100, 
                        100
                      )}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 mb-5">
            <div className="flex justify-between">
              <span className="text-white/70">Amount</span>
              <span className="text-white font-medium">${contribution.amount.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">Date</span>
              <span className="text-white">{formatDate(contribution.createdAt)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-white/70">Status</span>
              <span className={`${
                contribution.status === 'completed' 
                  ? 'text-green-500' 
                  : contribution.status === 'pending' 
                    ? 'text-yellow-500' 
                    : 'text-red-500'
              } font-medium`}>
                {contribution.status.charAt(0).toUpperCase() + contribution.status.slice(1)}
              </span>
            </div>

            {contribution.message && (
              <div className="pt-2">
                <span className="text-white/70 block mb-1">Message</span>
                <p className="text-white bg-black/30 p-3 rounded-lg border border-white/10">
                  {contribution.message}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {campaign && (
              <Link 
                href={`/foundfund/projects/${campaign.id}`}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-xl transition-colors shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:shadow-[0_0_20px_rgba(34,197,94,0.7)] text-center"
              >
                View Campaign
              </Link>
            )}
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-transparent border border-white/20 rounded-xl hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
