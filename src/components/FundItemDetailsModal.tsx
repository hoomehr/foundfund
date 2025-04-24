"use client"

import React from 'react'
import Image from 'next/image'
import { FundItem } from '@/types'
import Modal from '@/components/ui/modal'
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card'

interface FundItemDetailsModalProps {
  fundItem: FundItem
  isOpen: boolean
  onClose: () => void
}

export default function FundItemDetailsModal({ fundItem, isOpen, onClose }: FundItemDetailsModalProps) {
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

        <div className="flex flex-wrap gap-2">
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

        <div>
          <h3 className="text-xl font-bold mb-2">Project Details</h3>
          <p className="text-muted-foreground">{fundItem.description}</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Funding Progress</h3>
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-card-foreground">${fundItem.currentAmount.toLocaleString()} raised</span>
              <span className="text-muted-foreground">${fundItem.fundingGoal.toLocaleString()} goal</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{
                  width: `${progressPercentage}%`,
                  boxShadow: '0 0 10px rgba(74, 222, 128, 0.7), 0 0 5px rgba(74, 222, 128, 0.5)'
                }}
              ></div>
            </div>
            <div className="text-right text-xs text-muted-foreground mt-1">
              {progressPercentage}% funded
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardContainer className="h-full">
            <CardBody className="bg-card relative border w-full h-full rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
              <CardItem translateZ="20" className="text-lg font-bold mb-2">Project Timeline</CardItem>
              <CardItem translateZ="30" className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(fundItem.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date:</span>
                  <span>{new Date(fundItem.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="capitalize">{fundItem.status}</span>
                </div>
              </CardItem>
            </CardBody>
          </CardContainer>

          <CardContainer className="h-full">
            <CardBody className="bg-card relative border w-full h-full rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
              <CardItem translateZ="20" className="text-lg font-bold mb-2">Creator Info</CardItem>
              <CardItem translateZ="30" className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Creator ID:</span>
                  <span>{fundItem.creatorId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Projects:</span>
                  <span>3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span>85%</span>
                </div>
              </CardItem>
            </CardBody>
          </CardContainer>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="bg-white text-black py-2.5 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}
