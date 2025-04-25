import React from 'react';
import Image from 'next/image';
import { FundItem } from '@/types';
import Link from 'next/link';

interface SuccessModalProps {
  campaign: Partial<FundItem>;
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ campaign, isOpen, onClose }: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-50 p-4 md:items-center">
      <div className="bg-card border border-white/10 rounded-t-xl md:rounded-xl w-full max-w-2xl shadow-[0_0_50px_rgba(255,255,255,0.3),_0_0_80px_rgba(255,255,255,0.2)] overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Campaign Created!</h2>
              <p className="text-muted-foreground">Your campaign has been successfully created and is now live.</p>
            </div>
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="bg-black/30 rounded-xl overflow-hidden mb-6">
            <div className="relative h-48 w-full">
              {campaign.imageUrl && (
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.name || 'Campaign preview'}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div className="p-4">
              <h3 className="text-xl font-bold mb-2">{campaign.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {campaign.description}
              </p>
              
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">$0 raised</span>
                <span className="text-muted-foreground">${campaign.fundingGoal?.toLocaleString()} goal</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-1.5 mb-4">
                <div className="bg-green-500 h-1.5 rounded-full w-0 funding-phase-indicator"></div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {campaign.category && (
                  <span className="bg-black/30 text-white text-xs px-2 py-1 rounded-md border border-white/20">
                    {campaign.category}
                  </span>
                )}
                {campaign.tags?.map(tag => (
                  <span key={tag} className="bg-black/30 text-white text-xs px-2 py-1 rounded-md border border-white/20">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href={`/foundfund/projects/${campaign.id}`}
              className="flex-1 px-5 py-3 text-sm font-medium text-black bg-white rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] text-center"
            >
              View Campaign
            </Link>
            <Link 
              href="/foundfund/creators"
              className="flex-1 px-5 py-3 text-sm font-medium text-white bg-transparent border border-white/20 rounded-2xl hover:bg-white/10 transition-colors text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
