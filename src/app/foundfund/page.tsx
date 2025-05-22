"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// Removed 3D card imports for better performance
import { getCampaigns } from '@/lib/api';
import { FundItem } from '@/types';

export default function FoundFundHomePage() {
  const [featuredProjects, setFeaturedProjects] = useState<FundItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch featured projects from the database
  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        setLoading(true);
        // Fetch campaigns with featured=true parameter
        const featuredCampaigns = await getCampaigns({ featured: true });

        // If we have exactly 3 featured campaigns, use them
        if (featuredCampaigns && featuredCampaigns.length === 3) {
          setFeaturedProjects(featuredCampaigns);
        }
        // If we have more than 3 featured campaigns, take the first 3
        else if (featuredCampaigns && featuredCampaigns.length > 3) {
          setFeaturedProjects(featuredCampaigns.slice(0, 3));
        }
        // If we have fewer than 3 featured campaigns, supplement with newest campaigns
        else {
          // Fetch all campaigns and sort by creation date (newest first)
          const allCampaigns = await getCampaigns();
          const sortedCampaigns = allCampaigns.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          // Start with any featured campaigns we have
          const combinedCampaigns = [...(featuredCampaigns || [])];

          // Add newest non-featured campaigns until we have 3
          for (const campaign of sortedCampaigns) {
            // Skip campaigns that are already in our list (featured ones)
            if (!combinedCampaigns.some(c => c.id === campaign.id) && combinedCampaigns.length < 3) {
              combinedCampaigns.push(campaign);
            }

            // Stop once we have 3 campaigns
            if (combinedCampaigns.length >= 3) break;
          }

          setFeaturedProjects(combinedCampaigns);
        }

        setError(null);
      } catch (err) {
        setError('Failed to load featured projects');

        // Fallback to static data if API fails
        setFeaturedProjects([
          {
            id: 'featured1',
            name: 'Eco-Friendly Water Bottle',
            description: 'A reusable water bottle made from recycled materials that keeps your drinks cold for 24 hours.',
            imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=2070&auto=format&fit=crop',
            currentAmount: 3200,
            fundingGoal: 5000,
            category: 'technology',
            status: 'active',
            createdAt: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            creatorId: 'user1'
          },
          {
            id: 'featured2',
            name: 'Smart Home Garden Kit',
            description: 'An automated indoor garden system that lets you grow herbs and vegetables year-round.',
            imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=2070&auto=format&fit=crop',
            currentAmount: 4500,
            fundingGoal: 10000,
            category: 'technology',
            status: 'active',
            createdAt: new Date().toISOString(),
            endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            creatorId: 'user1'
          },
          {
            id: 'featured3',
            name: 'Artisanal Chocolate Collection',
            description: 'A curated box of handcrafted chocolates made with ethically sourced ingredients.',
            imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?q=80&w=2070&auto=format&fit=crop',
            currentAmount: 2000,
            fundingGoal: 5000,
            category: 'food',
            status: 'active',
            createdAt: new Date().toISOString(),
            endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            creatorId: 'user1'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProjects();
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 relative">
      {/* Background gradients for enhanced visual appeal */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-white/5 to-transparent rounded-full blur-3xl"></div>
      </div>

      {/* Hero Section with Enhanced Typography */}
      <div className="text-center mb-16 relative">
        <h1 className="text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
          Welcome to FoundFund
        </h1>
        <p className="text-xl max-w-2xl mx-auto text-muted-foreground bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent">
          A micro-funding platform connecting product creators with funders of any budget.
        </p>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full blur-2xl -z-10"></div>
      </div>

      {/* Enhanced Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
        <div className="bg-gradient-to-br from-card via-card/95 to-card/90 relative border w-full h-auto rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden hover:-translate-y-2" style={{ borderColor: 'var(--border)' }}>
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent group-hover:via-green-500 transition-all duration-300"></div>
          
          <h3 className="text-3xl font-bold text-card-foreground mb-3 transition-all duration-300">
            Fund Projects
          </h3>
          <p className="text-muted-foreground mt-2 mb-6 leading-relaxed">
            Discover innovative products and support creators with any amount. Be part of bringing amazing ideas to life.
          </p>
          <div className="w-full mt-4 mb-8">
            <div className="relative rounded-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
              <Image
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop"
                height="1000"
                width="1000"
                className="h-60 w-full object-cover"
                alt="People working on projects"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
          </div>
          <Link
            href="/foundfund/funders"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-white via-white to-gray-100 text-black text-sm font-semibold inline-block transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative overflow-hidden group/btn"
          >
            <span className="relative z-10">Browse Projects →</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white to-green-100 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>

        <div className="bg-gradient-to-br from-card via-card/95 to-card/90 relative border w-full h-auto rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden hover:-translate-y-2" style={{ borderColor: 'var(--border)' }}>
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent group-hover:via-purple-500 transition-all duration-300"></div>
          
          <h3 className="text-3xl font-bold text-card-foreground mb-3 transition-all duration-300">
            Create Campaigns
          </h3>
          <p className="text-muted-foreground mt-2 mb-6 leading-relaxed">
            Share your product ideas and get funded by the community. Turn your vision into reality with crowd support.
          </p>
          <div className="w-full mt-4 mb-8">
            <div className="relative rounded-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
              <Image
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
                height="1000"
                width="1000"
                className="h-60 w-full object-cover"
                alt="Creator working on project"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            </div>
          </div>
          <Link
            href="/foundfund/creators"
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-white via-white to-gray-100 text-black text-sm font-semibold inline-block transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative overflow-hidden group/btn"
          >
            <span className="relative z-10">Manage Campaigns →</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white to-purple-100 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>
      </div>

      {/* Enhanced Featured Projects Section */}
      <div className="mb-16">
        <h2 className="text-4xl font-bold mb-8 tracking-tight text-center bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">Featured Projects</h2>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 shadow-[0_0_20px_rgba(74,222,128,0.5)]"></div>
              <div className="absolute inset-0 animate-pulse rounded-full bg-green-500/10"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-r from-red-500/10 via-red-500/5 to-red-500/10 border border-red-500/30 text-red-400 px-6 py-4 rounded-2xl mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>{error}</span>
            </div>
          </div>
        ) : featuredProjects.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-card via-card/95 to-card/90 border rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xl text-muted-foreground mb-6">No featured projects available at the moment.</p>
            <Link
              href="/foundfund/funders"
              className="bg-gradient-to-r from-white via-white to-gray-100 text-black font-semibold py-3 px-8 rounded-2xl transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.6)] hover:shadow-[0_0_30px_rgba(255,255,255,0.8)] hover:scale-105 hover:-translate-y-1 inline-block"
            >
              Browse All Projects
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((project, index) => {
              // Calculate funding percentage
              const fundedPercentage = Math.min(
                Math.round((project.currentAmount / project.fundingGoal) * 100),
                100
              );

              return (
                <div key={project.id} className="bg-gradient-to-br from-card via-card/95 to-card/90 relative border w-full h-auto rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden hover:-translate-y-2" style={{ borderColor: 'var(--border)' }}>
                  {/* Dynamic background gradients based on index */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    index === 0 ? 'bg-gradient-to-br from-green-500/5 to-blue-500/5' :
                    index === 1 ? 'bg-gradient-to-br from-blue-500/5 to-purple-500/5' :
                    'bg-gradient-to-br from-purple-500/5 to-pink-500/5'
                  }`}></div>
                  
                  <div className="w-full mb-6">
                    <div className="relative rounded-xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                      <Image
                        src={project.imageUrl || 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=2070&auto=format&fit=crop'}
                        height="1000"
                        width="1000"
                        className="h-48 w-full object-cover"
                        alt={project.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-card-foreground mb-3 transition-all duration-300">
                    {project.name}
                  </h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`text-white text-xs px-3 py-1.5 rounded-full border transition-all duration-300 ${
                      index === 0 ? 'bg-green-500/20 border-green-500/40' :
                      index === 1 ? 'bg-blue-500/20 border-blue-500/40' :
                      'bg-purple-500/20 border-purple-500/40'
                    }`}>
                      {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                    </span>
                    {project.status === 'active' && (
                      <span className="bg-green-500/20 text-green-400 text-xs px-3 py-1.5 rounded-full border border-green-500/40 transition-all duration-300">
                        trending
                      </span>
                    )}
                    {fundedPercentage > 50 && (
                      <span className="bg-orange-500/20 text-orange-400 text-xs px-3 py-1.5 rounded-full border border-orange-500/40 transition-all duration-300">
                        popular
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground mb-5 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                  
                  <div className="mb-6 w-full">
                    <div className="w-full bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 rounded-full h-2 shadow-inner overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${fundedPercentage}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground mt-2 font-medium">
                      {fundedPercentage}% funded • ${project.currentAmount.toLocaleString()} raised
                    </div>
                  </div>
                  
                  <Link
                    href={`/foundfund/projects/${project.id}`}
                    className="w-full px-6 py-3 rounded-2xl bg-gradient-to-r from-white via-white to-gray-100 text-black text-sm font-semibold text-center transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative overflow-hidden group/btn block"
                  >
                    <span className="relative z-10">View Project</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white to-green-100 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enhanced How It Works Section */}
      <div className="mb-16">
        <h2 className="text-4xl font-bold mb-12 tracking-tight text-center bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { number: "01", title: "Create a Campaign", description: "Share your product idea with the world. Set your funding goal and campaign duration.", gradient: "from-green-500/5 to-blue-500/5", accentColor: "green" },
            { number: "02", title: "Get Funded", description: "Backers support your project with contributions of any size to help you reach your goal.", gradient: "from-blue-500/5 to-purple-500/5", accentColor: "blue" },
            { number: "03", title: "Bring It to Life", description: "Use the funds to bring your product to market and share updates with your backers.", gradient: "from-purple-500/5 to-pink-500/5", accentColor: "purple" }
          ].map((step, index) => (
            <div key={index} className="bg-gradient-to-br from-card via-card/95 to-card/90 relative border w-full h-auto rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden hover:-translate-y-2" style={{ borderColor: 'var(--border)' }}>
              <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className={`text-5xl font-bold mb-6 bg-gradient-to-r from-${step.accentColor}-400 to-${step.accentColor}-500 bg-clip-text text-transparent transition-all duration-300`}>
                {step.number}
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-4 transition-all duration-300">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
