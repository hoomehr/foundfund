import React, { useState } from 'react';
import { Category, FundingStatus } from '@/types';
import { getCategories, getFundingStatuses } from '@/data/mockData';

interface FilterBarProps {
  selectedCategory: Category | 'all';
  selectedStatus: FundingStatus | 'all';
  sortBy: 'newest' | 'mostFunded' | 'endingSoon';
  selectedTags: string[];
  onCategoryChange: (category: Category | 'all') => void;
  onStatusChange: (status: FundingStatus | 'all') => void;
  onSortChange: (sort: 'newest' | 'mostFunded' | 'endingSoon') => void;
  onTagsChange: (tags: string[]) => void;
}

export default function FilterBar({
  selectedCategory,
  selectedStatus,
  sortBy,
  selectedTags,
  onCategoryChange,
  onStatusChange,
  onSortChange,
  onTagsChange,
}: FilterBarProps) {
  const categories = getCategories();
  const statuses = getFundingStatuses();
  const availableTags = ['trending', 'popular', 'new', 'ending-soon'];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="border bg-card/50 p-6 rounded-xl mb-8 shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-card-foreground mb-2">
            Category
          </label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value as Category | 'all')}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-card-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-card-foreground mb-2">
            Status
          </label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as FundingStatus | 'all')}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-card-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-card-foreground mb-2">
            Sort By
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'newest' | 'mostFunded' | 'endingSoon')}
            className="w-full bg-background border border-input rounded-md px-3 py-2 text-card-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="newest">Newest First</option>
            <option value="mostFunded">Most Funded</option>
            <option value="endingSoon">Ending Soon</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-card-foreground mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {availableTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-xs px-3 py-1.5 rounded-md border transition-all ${
                selectedTags.includes(tag)
                  ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.5)]'
                  : 'bg-white/10 text-white border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
