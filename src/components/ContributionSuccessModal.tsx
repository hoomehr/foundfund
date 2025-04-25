import React, { useEffect } from 'react';
import { FundItem } from '@/types';
import Link from 'next/link';

interface ContributionSuccessModalProps {
  campaign: Partial<FundItem>;
  amount: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContributionSuccessModal({ campaign, amount, isOpen, onClose }: ContributionSuccessModalProps) {
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
              <h2 className="text-xl font-bold text-white shadow-[0_0_10px_rgba(255,255,255,0.5)]">Thank You!</h2>
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
            Your contribution of <span className="text-green-400 font-bold shadow-[0_0_10px_rgba(74,222,128,0.5)]">${amount.toLocaleString()}</span> to <span className="font-bold">{campaign.name}</span> has been successfully processed!
          </p>

          <div className="bg-black/30 rounded-xl p-4 border border-white/10 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/70 text-sm">Campaign</span>
              <span className="text-white font-medium">{campaign.name}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/70 text-sm">Amount</span>
              <span className="text-white font-medium">${amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/70 text-sm">Status</span>
              <span className="text-green-400 font-medium">Completed</span>
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
              href="/foundfund/funders"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-transparent border border-white/20 rounded-xl hover:bg-white/10 transition-colors text-center"
            >
              Discover More
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
