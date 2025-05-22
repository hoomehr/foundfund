import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Contribution, FundItem, User } from '@/types';

interface BackersModalProps {
  campaign: Partial<FundItem>;
  contributions: Contribution[];
  isOpen: boolean;
  onClose: () => void;
}

export default function BackersModal({
  campaign,
  contributions,
  isOpen,
  onClose
}: BackersModalProps) {
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(false);

  // Fetch user data for contributors
  useEffect(() => {
    if (isOpen && contributions.length > 0) {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          // Get unique contributor IDs
          const contributorIds = [...new Set(contributions.map(c => c.contributorId))];

          // Fetch user data for each contributor
          const userMap: Record<string, User> = {};

          // In a real app, you would fetch all users in one request
          // For this demo, we'll use mock data
          contributorIds.forEach(id => {
            userMap[id] = {
              id,
              username: `user_${id.slice(-4)}`,
              name: `User ${id.slice(-4)}`,
              email: `user${id.slice(-4)}@example.com`,
              avatarUrl: '/placeholder-avatar.jpg',
              bio: 'Supporter of innovative projects',
              stats: {
                campaignsCreated: 0,
                campaignsFunded: contributions.filter(c => c.contributorId === id).length
              }
            };
          });

          setUsers(userMap);
        } catch (error) {
          // Silently handle error
        } finally {
          setLoading(false);
        }
      };

      fetchUsers();
    }
  }, [isOpen, contributions]);

  if (!isOpen) return null;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-black/70 border border-white/20 rounded-xl w-full max-w-2xl mx-auto overflow-hidden animate-fadeIn"
        style={{ boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)' }}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Campaign Backers</h2>
              <p className="text-white/70 text-sm">
                {contributions.length} {contributions.length === 1 ? 'contribution' : 'contributions'} for {campaign.name}
              </p>
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

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {contributions.length === 0 ? (
                <p className="text-white/70 text-center py-8">No contributions yet.</p>
              ) : (
                contributions.map((contribution) => (
                  <div
                    key={contribution.id}
                    className="bg-black/30 rounded-xl p-4 border border-white/10 hover:border-white/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0 border border-white/20">
                        <Image
                          src={users[contribution.contributorId]?.avatarUrl || '/placeholder-avatar.jpg'}
                          alt={users[contribution.contributorId]?.name || 'Contributor'}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-white truncate">
                              {contribution.anonymous
                                ? 'Anonymous Backer'
                                : users[contribution.contributorId]?.name || 'Contributor'}
                            </h3>
                            <p className="text-white/70 text-sm">
                              {formatDate(contribution.createdAt)}
                            </p>
                          </div>
                          <span className="text-white font-bold">
                            ${contribution.amount.toLocaleString()}
                          </span>
                        </div>

                        {contribution.message && (
                          <p className="mt-2 text-white/90 bg-black/30 p-2 rounded-lg text-sm">
                            "{contribution.message}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex justify-end mt-5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-black bg-white rounded-xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5),_0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7),_0_0_40px_rgba(255,255,255,0.4)] hover:bg-white/90"
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
