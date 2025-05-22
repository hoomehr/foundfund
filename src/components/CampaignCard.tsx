import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FundItem } from '@/types';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';

interface CampaignCardProps {
  campaign: FundItem;
}

export default function CampaignCard({ campaign }: CampaignCardProps) {
  const progressPercentage = Math.min(
    Math.round((campaign.currentAmount / campaign.fundingGoal) * 100),
    100
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_15px_rgba(74,222,128,0.4)] group-hover:shadow-[0_0_20px_rgba(74,222,128,0.6)]';
      case 'funded':
        return 'bg-green-500/30 text-green-300 border border-green-500/50 shadow-[0_0_15px_rgba(74,222,128,0.6)] group-hover:shadow-[0_0_25px_rgba(74,222,128,0.8)]';
      case 'expired':
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/40 shadow-[0_0_15px_rgba(156,163,175,0.4)] group-hover:shadow-[0_0_20px_rgba(156,163,175,0.6)]';
      default:
        return 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-[0_0_15px_rgba(74,222,128,0.4)] group-hover:shadow-[0_0_20px_rgba(74,222,128,0.6)]';
    }
  };

  const getProgressGradient = () => {
    if (progressPercentage >= 100) return 'from-green-400 to-green-500';
    if (progressPercentage >= 75) return 'from-orange-400 to-orange-500';
    if (progressPercentage >= 50) return 'from-blue-400 to-blue-500';
    if (progressPercentage >= 25) return 'from-purple-400 to-purple-500';
    return 'from-gray-400 to-gray-500';
  };

  return (
    <CardContainer>
      <CardBody className="bg-gradient-to-br from-card via-card/95 to-card/90 relative border w-full h-auto rounded-2xl px-6 pt-6 pb-6 shadow-[0_0_40px_rgba(255,255,255,0.15),_0_0_80px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25),_0_0_120px_rgba(255,255,255,0.15)] transition-all duration-500 group card-hover-lift overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {/* Animated background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent group-hover:via-green-500 transition-all duration-500"></div>
        
        {campaign.imageUrl && (
          <CardItem translateZ="100" className="w-full mb-4">
            <div className="relative w-full rounded-xl overflow-hidden group-hover:scale-105 transition-transform duration-500" style={{ paddingBottom: '66.67%' }}>
              <Image
                src={campaign.imageUrl || "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                alt={campaign.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent group-hover:from-black/20 transition-all duration-500"></div>
              
              {/* Status badge overlay */}
              <div className="absolute top-4 right-4">
                <CardItem translateZ="30" className={`${getStatusBadgeClass(campaign.status)} text-xs px-3 py-1.5 rounded-full backdrop-blur-sm transition-all duration-300 group-hover:scale-110`}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </CardItem>
              </div>
            </div>
          </CardItem>
        )}

        <div className="flex justify-between items-start mb-3">
          <CardItem translateZ="50" className="text-2xl font-bold text-card-foreground group-hover:text-shadow-green transition-all duration-300">
            {campaign.name}
          </CardItem>
        </div>

        <CardItem translateZ="30" className="flex flex-wrap gap-2 mb-3">
          <span className="bg-gradient-to-r from-white/10 to-white/5 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-300 backdrop-blur-sm">
            {campaign.category}
          </span>
          <span className="bg-gradient-to-r from-orange-500/20 to-orange-500/10 text-orange-400 text-xs px-3 py-1.5 rounded-full border border-orange-500/40 shadow-[0_0_15px_rgba(251,146,60,0.4)] hover:shadow-[0_0_20px_rgba(251,146,60,0.6)] transition-all duration-300 backdrop-blur-sm">
            trending
          </span>
          {campaign.currentAmount > 1000 && (
            <span className="bg-gradient-to-r from-green-500/20 to-green-500/10 text-green-400 text-xs px-3 py-1.5 rounded-full border border-green-500/40 shadow-[0_0_15px_rgba(74,222,128,0.4)] hover:shadow-[0_0_20px_rgba(74,222,128,0.6)] transition-all duration-300 backdrop-blur-sm">
              popular
            </span>
          )}
        </CardItem>

        <CardItem as="p" translateZ="60" className="text-muted-foreground mt-1 mb-3 line-clamp-2 leading-relaxed">
          {campaign.description}
        </CardItem>

        <CardItem translateZ="40" className="mb-4 w-full">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-card-foreground font-medium">${campaign.currentAmount.toLocaleString()} raised</span>
            <span className="text-muted-foreground">${campaign.fundingGoal.toLocaleString()} goal</span>
          </div>
          <div className="w-full bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-full h-2.5 shadow-inner overflow-hidden">
            <div
              className={`bg-gradient-to-r ${getProgressGradient()} h-2.5 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(74,222,128,0.7),_0_0_25px_rgba(74,222,128,0.5)] group-hover:shadow-[0_0_20px_rgba(74,222,128,0.8),_0_0_35px_rgba(74,222,128,0.6)]`}
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
              Ends: {new Date(campaign.endDate).toLocaleDateString()}
            </span>
          </div>
        </CardItem>

        <CardItem translateZ="50" className="flex space-x-3">
          <Link
            href={`/foundfund/creators/edit/${campaign.id}`}
            className="flex-1 bg-gradient-to-r from-white via-white to-gray-100 text-black text-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.5),_0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7),_0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 hover:-translate-y-1 whitespace-nowrap btn-glow"
          >
            Edit
          </Link>
          <Link
            href={`/foundfund/creators/campaigns/${campaign.id}`}
            className="flex-1 bg-gradient-to-r from-white via-white to-gray-100 text-black text-center py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.5),_0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7),_0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 hover:-translate-y-1 whitespace-nowrap btn-glow"
          >
            Details
          </Link>
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}
