import React, { useState, useRef, useEffect } from 'react';
import { Category, FundItem } from '@/types';
import { getCategories } from '@/lib/api';
import Image from 'next/image';

interface ListingFormProps {
  initialData?: Partial<FundItem>;
  onSubmit: (formData: Partial<FundItem>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ListingForm({ initialData, onSubmit, onCancel, isLoading = false }: ListingFormProps) {
  // Use useEffect to set the default date to avoid hydration mismatch
  const [formData, setFormData] = useState<Partial<FundItem>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    fundingGoal: initialData?.fundingGoal || undefined,
    imageUrl: initialData?.imageUrl || '',
    tags: initialData?.tags || [],
    // We'll set the endDate in useEffect
    endDate: initialData?.endDate || '',
  });

  // Set the default end date after component mounts to avoid hydration mismatch
  useEffect(() => {
    if (!formData.endDate) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      setFormData(prev => ({
        ...prev,
        endDate: thirtyDaysFromNow.toISOString().split('T')[0]
      }));
    }
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [tagInput, setTagInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available tags for selection
  const availableTags = [
    'eco-friendly', 'sustainable', 'innovative', 'tech', 'art', 'design',
    'education', 'health', 'social', 'community', 'music', 'film', 'food',
    'fashion', 'games', 'sports', 'travel', 'photography', 'publishing'
  ];

  const categories = getCategories();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Update form data based on field type
    if (name === 'fundingGoal') {
      setFormData(prevData => ({
        ...prevData,
        [name]: value === '' ? undefined : Number(value),
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value,
      }));
    }

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: '',
      }));
    }

    // Run validation for this field immediately for better feedback
    validateField(name, name === 'fundingGoal' ? (value === '' ? undefined : Number(value)) : value);
  };

  // Validate a single field
  const validateField = (name: string, value: any): boolean => {
    let isValid = true;
    let errorMessage = '';

    switch (name) {
      case 'name':
        if (!value || (typeof value === 'string' && !value.trim())) {
          isValid = false;
          errorMessage = 'Name is required';
        }
        break;
      case 'description':
        if (!value || (typeof value === 'string' && !value.trim())) {
          isValid = false;
          errorMessage = 'Description is required';
        }
        break;
      case 'category':
        if (!value) {
          isValid = false;
          errorMessage = 'Category is required';
        }
        break;
      case 'fundingGoal':
        if (!value || value <= 0) {
          isValid = false;
          errorMessage = 'Funding goal must be greater than 0';
        }
        break;
      case 'endDate':
        if (!value) {
          isValid = false;
          errorMessage = 'End date is required';
        } else {
          try {
            const endDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (endDate <= today) {
              isValid = false;
              errorMessage = 'End date must be in the future';
            }
          } catch (error) {
            isValid = false;
            errorMessage = 'Invalid date format';
          }
        }
        break;
      default:
        break;
    }

    // Update the error state for this field
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: errorMessage
    }));

    return isValid;
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setErrors({
        ...errors,
        imageUrl: 'Please upload an image file (JPEG, PNG, etc.)'
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({
        ...errors,
        imageUrl: 'Image size should be less than 5MB'
      });
      return;
    }

    setIsUploading(true);

    // Create a preview for immediate feedback
    const reader = new FileReader();
    reader.onloadend = () => {
      // Set the preview
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);

      // Upload the file to our API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();

      // Update the form data with the image URL
      setFormData(prevFormData => ({
        ...prevFormData,
        imageUrl: data.url // Use the URL returned from the server
      }));

      // Clear any image errors
      if (errors.imageUrl) {
        setErrors(prevErrors => ({
          ...prevErrors,
          imageUrl: ''
        }));
      }
    } catch (error) {
      setErrors({
        ...errors,
        imageUrl: error instanceof Error ? error.message : 'Failed to upload image. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleTagAdd = (tag: string) => {
    if (!tag.trim()) return;

    // Check if we already have 3 tags
    if (formData.tags && formData.tags.length >= 3) {
      setErrors({
        ...errors,
        tags: 'Maximum 3 tags allowed'
      });
      return;
    }

    // Check if tag already exists
    if (formData.tags && formData.tags.includes(tag)) {
      return;
    }

    // Add the tag
    setFormData({
      ...formData,
      tags: [...(formData.tags || []), tag]
    });

    // Clear the input and any errors
    setTagInput('');
    if (errors.tags) {
      setErrors({
        ...errors,
        tags: ''
      });
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter(tag => tag !== tagToRemove)
    });

    // Clear any errors
    if (errors.tags) {
      setErrors({
        ...errors,
        tags: ''
      });
    }
  };

  const validateForm = (): boolean => {
    // Validate all required fields
    const nameValid = validateField('name', formData.name);
    const descriptionValid = validateField('description', formData.description);
    const categoryValid = validateField('category', formData.category);
    const fundingGoalValid = validateField('fundingGoal', formData.fundingGoal);
    const endDateValid = validateField('endDate', formData.endDate);

    // Validate image separately since it's not a direct form field
    let imageValid = true;
    if (!imagePreview && !formData.imageUrl) {
      setErrors(prevErrors => ({
        ...prevErrors,
        imageUrl: 'Project image is required'
      }));
      imageValid = false;
    } else {
      setErrors(prevErrors => ({
        ...prevErrors,
        imageUrl: ''
      }));
    }

    // Validate tags separately
    let tagsValid = true;
    if (!formData.tags || formData.tags.length === 0) {
      setErrors(prevErrors => ({
        ...prevErrors,
        tags: 'At least one tag is required'
      }));
      tagsValid = false;
    } else {
      setErrors(prevErrors => ({
        ...prevErrors,
        tags: ''
      }));
    }

    // Return true only if all validations pass
    return nameValid && descriptionValid && categoryValid &&
           fundingGoalValid && endDateValid && imageValid && tagsValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Project Details */}
        <div className="space-y-6">
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
              className={`w-full rounded-md bg-background border ${errors.name ? 'border-red-500' : 'border-input'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all`}
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
              rows={6}
              value={formData.description}
              onChange={handleChange}
              className={`w-full rounded-md bg-background border ${errors.description ? 'border-red-500' : 'border-input'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-card-foreground mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full rounded-md bg-background border ${errors.category ? 'border-red-500' : 'border-input'} px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all`}
              >
                <option value="">Select a category...</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
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
                placeholder="Enter funding goal"
                value={formData.fundingGoal || ''}
                onChange={handleChange}
                className={`w-full rounded-md bg-background border ${errors.fundingGoal ? 'border-red-500' : 'border-input'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all`}
              />
              {errors.fundingGoal && <p className="mt-1 text-sm text-red-500">{errors.fundingGoal}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-card-foreground mb-2">
                Campaign End Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]} // Set minimum date to today
                  className={`w-full rounded-md bg-background border ${errors.endDate ? 'border-red-500' : 'border-input'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>
              {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Select a date at least one day in the future
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Tags (max 3) *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.tags || []).map(tag => (
                  <span
                    key={tag}
                    className="bg-black/30 text-white text-xs px-2 py-1 rounded-md border border-white/20 flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="ml-1 text-white/70 hover:text-white"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div>
                <select
                  value={tagInput || ''}
                  onChange={(e) => {
                    const selectedTag = e.target.value;
                    if (selectedTag) {
                      handleTagAdd(selectedTag);
                      setTagInput('');
                    } else {
                      setTagInput('');
                    }
                  }}
                  className="w-full rounded-md bg-background border border-input px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"
                >
                  <option value="">Select a tag...</option>
                  {availableTags
                    .filter(tag => !(formData.tags || []).includes(tag))
                    .map(tag => (
                      <option key={tag} value={tag}>
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </option>
                    ))
                  }
                </select>
              </div>

              {errors.tags && <p className="mt-1 text-sm text-red-500">{errors.tags}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                {(formData.tags || []).length}/3 tags selected. Tags help funders discover your project.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Image Upload */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Project Image *
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-black/20 transition-colors ${errors.imageUrl ? 'border-red-500' : 'border-white/20'}`}
              onClick={triggerFileInput}
            >
              {imagePreview ? (
                <div className="relative h-48 w-full mb-4">
                  <Image
                    src={imagePreview}
                    alt="Project preview"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-muted-foreground mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-muted-foreground">Click to upload an image</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                id="image"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {isUploading && (
                <div className="mt-2">
                  <div className="w-full bg-gray-900 rounded-full h-1">
                    <div className="bg-white h-1 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
                </div>
              )}
            </div>
            {errors.imageUrl && <p className="mt-1 text-sm text-red-500">{errors.imageUrl}</p>}
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-card-foreground mb-2">
              Or provide an image URL
            </label>
            <input
              type="text"
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => {
                handleChange(e);
                if (e.target.value) {
                  setImagePreview(e.target.value);
                }
              }}
              className="w-full rounded-md bg-background border border-input px-3 py-2 text-card-foreground focus:outline-none focus:ring-2 focus:ring-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="bg-black/20 rounded-xl p-4 mt-4">
            <h3 className="text-sm font-medium mb-2">Campaign Preview</h3>
            <p className="text-xs text-muted-foreground mb-4">This is how your campaign will appear to funders</p>

            <div className="bg-card border rounded-lg overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              {imagePreview ? (
                <div className="relative h-32 w-full">
                  <Image
                    src={imagePreview}
                    alt="Campaign preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-32 bg-gray-800 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">No image uploaded</p>
                </div>
              )}

              <div className="p-3">
                <h4 className="font-medium truncate">{formData.name || 'Campaign Name'}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {formData.description || 'Campaign description will appear here...'}
                </p>

                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-muted-foreground">$0 raised</span>
                  <span className="text-muted-foreground">
                    {formData.fundingGoal ? `$${formData.fundingGoal.toLocaleString()} goal` : 'Set a funding goal'}
                  </span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-1.5 mt-1">
                  <div className="bg-green-500 h-1.5 rounded-full w-0 funding-phase-indicator"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-white/10 mt-8">
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
          disabled={isLoading || isUploading}
          className="px-5 py-2.5 text-sm font-medium text-black bg-white rounded-2xl transition-colors shadow-[0_0_25px_rgba(255,255,255,0.6),_0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.8),_0_0_50px_rgba(255,255,255,0.4)] disabled:opacity-70"
        >
          {isLoading || isUploading
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
