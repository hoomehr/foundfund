import React, { useState } from 'react';
import { Category, FundItem } from '@/types';
import { getCategories } from '@/lib/api';

interface ListingFormProps {
  initialData?: Partial<FundItem>;
  onSubmit: (formData: Partial<FundItem>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ListingForm({ initialData, onSubmit, onCancel, isLoading = false }: ListingFormProps) {
  const [formData, setFormData] = useState<Partial<FundItem>>({
    name: '',
    description: '',
    category: 'technology',
    fundingGoal: 1000,
    imageUrl: '',
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = getCategories();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'fundingGoal') {
      setFormData({
        ...formData,
        [name]: Number(value),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.fundingGoal || formData.fundingGoal <= 0) {
      newErrors.fundingGoal = 'Funding goal must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-card-foreground mb-2">
          Project Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full rounded-md bg-background border ${errors.name ? 'border-red-500' : 'border-input'} px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-card-foreground mb-2">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className={`w-full rounded-md bg-background border ${errors.description ? 'border-red-500' : 'border-input'} px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring`}
        />
        {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-card-foreground mb-2">
          Category *
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full rounded-md bg-background border border-input px-3 py-2 text-card-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="fundingGoal" className="block text-sm font-medium text-card-foreground mb-2">
          Funding Goal (USD) *
        </label>
        <input
          type="number"
          id="fundingGoal"
          name="fundingGoal"
          min="1"
          value={formData.fundingGoal}
          onChange={handleChange}
          className={`w-full rounded-md bg-background border ${errors.fundingGoal ? 'border-red-500' : 'border-input'} px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring`}
        />
        {errors.fundingGoal && <p className="mt-1 text-sm text-red-500">{errors.fundingGoal}</p>}
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-card-foreground mb-2">
          Image URL (optional)
        </label>
        <input
          type="text"
          id="imageUrl"
          name="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          className="w-full rounded-md bg-background border border-input px-3 py-2 text-card-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="https://example.com/image.jpg"
        />
      </div>

      <div className="flex justify-end space-x-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-5 py-2.5 text-sm font-medium text-black bg-white rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] disabled:opacity-70"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 text-sm font-medium text-black bg-white rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)] disabled:opacity-70"
        >
          {isLoading
            ? 'Processing...'
            : initialData?.id
              ? 'Update Campaign'
              : 'Create Campaign'
          }
        </button>
      </div>
    </form>
  );
}
