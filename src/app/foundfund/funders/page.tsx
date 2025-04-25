'use client';

import React, { useState, useEffect } from 'react';
import { Category, FundingStatus, FundItem } from '@/types';
import { getCampaigns, getCategories, getFundingStatuses } from '@/lib/api';
import FundItemCard from '@/components/FundItemCard';
import FilterBar from '@/components/FilterBar';

export default function FundersPage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<FundingStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'mostFunded' | 'endingSoon'>('newest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [fundItems, setFundItems] = useState<FundItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch fund items from the API
  useEffect(() => {
    const fetchFundItems = async () => {
      try {
        setLoading(true);
        const items = await getCampaigns();
        setFundItems(items || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching fund items:', err);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFundItems();
  }, []);

  // Filter and sort the fund items
  const filteredItems = fundItems.filter(item => {
    // Category and status filtering
    const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || item.status === selectedStatus;

    // Tag filtering
    let tagMatch = true;
    if (selectedTags.length > 0) {
      // Check if the item matches all selected tags
      tagMatch = selectedTags.every(tag => {
        switch (tag) {
          case 'trending':
            return item.currentAmount > (item.fundingGoal * 0.5);
          case 'popular':
            return item.currentAmount > 2000;
          case 'new':
            // Consider items created in the last 7 days as new
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return new Date(item.createdAt) > sevenDaysAgo;
          case 'ending-soon':
            // Consider items ending in the next 7 days as ending soon
            const now = new Date();
            const endDate = new Date(item.endDate);
            const daysLeft = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return daysLeft <= 7 && daysLeft >= 0;
          default:
            return true;
        }
      });
    }

    return categoryMatch && statusMatch && tagMatch;
  });

  // Sort the filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'mostFunded') {
      return b.currentAmount - a.currentAmount;
    } else {
      // endingSoon
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    }
  });

  const handleContribute = (fundItemId: string, amount: number) => {
    // In a real app, this would make an API call to process the contribution
    alert(`Contributing $${amount} to project ${fundItemId}`);

    // For demo purposes, update the local state
    setFundItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === fundItemId) {
          return {
            ...item,
            currentAmount: item.currentAmount + amount
          };
        }
        return item;
      });
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4 tracking-tight">Discover Projects</h1>
      <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
        Browse through innovative projects and support creators with any budget.
      </p>

      <FilterBar
        selectedCategory={selectedCategory}
        selectedStatus={selectedStatus}
        sortBy={sortBy}
        selectedTags={selectedTags}
        onCategoryChange={setSelectedCategory}
        onStatusChange={setSelectedStatus}
        onSortChange={setSortBy}
        onTagsChange={setSelectedTags}
      />

      {loading ? (
        <div className="text-center py-16 border rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xl text-muted-foreground">Loading projects...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 border rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xl text-muted-foreground">{error}</p>
        </div>
      ) : sortedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0.5">
          {sortedItems.map(item => (
            <FundItemCard
              key={item.id}
              fundItem={item}
              onContribute={handleContribute}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xl text-muted-foreground">No projects found matching your filters.</p>
        </div>
      )}
    </div>
  );
}
