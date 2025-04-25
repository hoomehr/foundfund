import React, { useEffect } from 'react';
import Image from 'next/image';
import { FundItem } from '@/types';
import Link from 'next/link';

interface SuccessModalProps {
  campaign: Partial<FundItem>;
  isOpen: boolean;
  onClose: () => void;
}

export default function SuccessModal({ campaign, isOpen, onClose }: SuccessModalProps) {
  // Auto-close the modal after 8 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-black/70 border border-white/20 rounded-xl w-full max-w-md mx-auto my-8 overflow-hidden animate-fadeIn"
        style={{
          boxShadow: '0 0 30px rgba(255, 255, 255, 0.4), 0 0 60px rgba(255, 255, 255, 0.2)',
          animation: 'pulse 2s infinite'
        }}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className="bg-green-500 rounded-full p-2 mr-3 shadow-[0_0_15px_rgba(255,255,255,0.7),_0_0_30px_rgba(255,255,255,0.4)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white shadow-[0_0_10px_rgba(255,255,255,0.5)]">Success!</h2>
            </div>
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

          <p className="text-white font-medium mb-4 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Your campaign has been successfully created and is now live!
          </p>

          {/* Campaign Preview */}
          <div className="bg-black/30 rounded-xl overflow-hidden mb-4 border border-white/10">
            {campaign.imageUrl && (
              <div className="relative h-36 w-full">
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.name || 'Campaign preview'}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-3">
              <h3 className="text-lg font-bold mb-1 truncate">{campaign.name}</h3>
              <p className="text-xs text-white/70 mb-3 line-clamp-2">
                {campaign.description}
              </p>

              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-white/70">$0 raised</span>
                <span className="text-white/70">${campaign.fundingGoal?.toLocaleString()} goal</span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-1.5 mb-3">
                <div className="bg-green-500 h-1.5 rounded-full w-0 shadow-[0_0_10px_rgba(34,197,94,0.7),_0_0_20px_rgba(255,255,255,0.4)]"></div>
              </div>

              <div className="flex flex-wrap gap-1 mb-1">
                {campaign.category && (
                  <span className="bg-black/30 text-white text-xs px-2 py-0.5 rounded-md border border-white/20">
                    {campaign.category}
                  </span>
                )}
                {campaign.tags?.slice(0, 2).map(tag => (
                  <span key={tag} className="bg-black/30 text-white text-xs px-2 py-0.5 rounded-md border border-white/20">
                    {tag}
                  </span>
                ))}
                {(campaign.tags?.length || 0) > 2 && (
                  <span className="bg-black/30 text-white text-xs px-2 py-0.5 rounded-md border border-white/20">
                    +{(campaign.tags?.length || 0) - 2} more
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/foundfund/projects/${campaign.id}`}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-xl transition-colors shadow-[0_0_15px_rgba(34,197,94,0.5),_0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.7),_0_0_40px_rgba(255,255,255,0.4)] text-center"
            >
              View Campaign
            </Link>
            <Link
              href="/foundfund/creators"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-transparent border border-white/20 rounded-xl hover:bg-white/10 transition-colors text-center"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.4), 0 0 60px rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 255, 255, 0.6), 0 0 80px rgba(255, 255, 255, 0.3);
          }
          100% {
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.4), 0 0 60px rgba(255, 255, 255, 0.2);
          }
        }

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
