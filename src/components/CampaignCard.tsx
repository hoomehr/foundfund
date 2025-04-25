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
        return 'bg-black/30 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.3)]';
      case 'funded':
        return 'bg-black/30 text-green-500 border border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.5)]';
      case 'expired':
        return 'bg-black/30 text-gray-400 border border-gray-500/30 shadow-[0_0_10px_rgba(255,255,255,0.2)]';
      default:
        return 'bg-black/30 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.3)]';
    }
  };

  return (
    <CardContainer>
      <CardBody className="bg-card relative border w-full h-auto rounded-xl px-4 pt-4 pb-4 shadow-[0_0_30px_rgba(255,255,255,0.2),_0_0_50px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3),_0_0_70px_rgba(255,255,255,0.2)] transition-shadow duration-300" style={{ borderColor: 'var(--border)' }}>
        {campaign.imageUrl && (
          <CardItem translateZ="100" className="w-full mb-3">
            <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '66.67%' }}>
              <Image
                src={campaign.imageUrl || "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop"}
                fill
                className="object-cover"
                alt={campaign.name}
              />
            </div>
          </CardItem>
        )}

        <div className="flex justify-between items-start mb-2">
          <CardItem translateZ="50" className="text-2xl font-bold text-card-foreground">
            {campaign.name}
          </CardItem>
          <CardItem translateZ="30" className={`${getStatusBadgeClass(campaign.status)} text-xs px-2 py-1 rounded-md`}>
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </CardItem>
        </div>

        <CardItem translateZ="30" className="flex flex-wrap gap-2 mb-2">
          <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            {campaign.category}
          </span>
          <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            trending
          </span>
          {campaign.currentAmount > 1000 && (
            <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
              popular
            </span>
          )}
        </CardItem>

        <CardItem as="p" translateZ="60" className="text-muted-foreground mt-1 mb-2 line-clamp-2">
          {campaign.description}
        </CardItem>

        <CardItem translateZ="40" className="mb-3 w-full">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-card-foreground">${campaign.currentAmount.toLocaleString()} raised</span>
            <span className="text-muted-foreground">${campaign.fundingGoal.toLocaleString()} goal</span>
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
          <div className="flex justify-between text-xs mt-1">
            <span className="text-muted-foreground">
              {progressPercentage}% funded
            </span>
            <span className="text-white">
              Ends: {new Date(campaign.endDate).toLocaleDateString()}
            </span>
          </div>
        </CardItem>



        <CardItem translateZ="50" className="flex space-x-3">
          <Link
            href={`/foundfund/creators/edit/${campaign.id}`}
            className="flex-1 bg-white text-black text-center py-1.5 px-4 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] whitespace-nowrap"
          >
            Edit
          </Link>
          <Link
            href={`/foundfund/creators/campaigns/${campaign.id}`}
            className="flex-1 bg-white text-black text-center py-1.5 px-4 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] whitespace-nowrap"
          >
            Details
          </Link>
        </CardItem>
      </CardBody>
    </CardContainer>
  );
}
