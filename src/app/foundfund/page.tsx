"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';
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
        console.error('Error fetching featured projects:', err);
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
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6 tracking-tight">Welcome to FoundFund</h1>
        <p className="text-xl max-w-2xl mx-auto text-muted-foreground">
          A micro-funding platform connecting product creators with funders of any budget.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
        <CardContainer>
          <CardBody className="bg-card relative border w-full h-auto rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow duration-300" style={{ borderColor: 'var(--border)' }}>
            <CardItem translateZ="50" className="text-2xl font-bold text-card-foreground">
              Fund Projects
            </CardItem>
            <CardItem as="p" translateZ="60" className="text-muted-foreground mt-2 mb-4">
              Discover innovative products and support creators with any amount.
            </CardItem>
            <CardItem translateZ="100" className="w-full mt-4 mb-8">
              <Image
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop"
                height="1000"
                width="1000"
                className="h-60 w-full object-cover rounded-lg"
                alt="People working on projects"
              />
            </CardItem>
            <CardItem
              translateZ={20}
              as={Link}
              href="/foundfund/funders"
              className="px-6 py-3 rounded-2xl bg-white text-black text-sm font-medium inline-block transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
            >
              Browse Projects →
            </CardItem>
          </CardBody>
        </CardContainer>

        <CardContainer>
          <CardBody className="bg-card relative border w-full h-auto rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow duration-300" style={{ borderColor: 'var(--border)' }}>
            <CardItem translateZ="50" className="text-2xl font-bold text-card-foreground">
              Create Campaigns
            </CardItem>
            <CardItem as="p" translateZ="60" className="text-muted-foreground mt-2 mb-4">
              Share your product ideas and get funded by the community.
            </CardItem>
            <CardItem translateZ="100" className="w-full mt-4 mb-8">
              <Image
                src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
                height="1000"
                width="1000"
                className="h-60 w-full object-cover rounded-lg"
                alt="Creator working on project"
              />
            </CardItem>
            <CardItem
              translateZ={20}
              as={Link}
              href="/foundfund/creators"
              className="px-6 py-3 rounded-2xl bg-white text-black text-sm font-medium inline-block transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
            >
              Manage Campaigns →
            </CardItem>
          </CardBody>
        </CardContainer>
      </div>

      {/* Featured Projects Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 tracking-tight">Featured Projects</h2>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        ) : featuredProjects.length === 0 ? (
          <div className="text-center py-12 bg-card border rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)]" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xl text-muted-foreground mb-4">No featured projects available at the moment.</p>
            <Link
              href="/foundfund/funders"
              className="bg-white text-black font-medium py-2.5 px-6 rounded-2xl transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
            >
              Browse All Projects
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((project) => {
              // Calculate funding percentage
              const fundedPercentage = Math.min(
                Math.round((project.currentAmount / project.fundingGoal) * 100),
                100
              );

              return (
                <CardContainer key={project.id}>
                  <CardBody className="bg-card relative border w-full h-auto rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow duration-300" style={{ borderColor: 'var(--border)' }}>
                    <CardItem translateZ="100" className="w-full mb-6">
                      <Image
                        src={project.imageUrl || 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=2070&auto=format&fit=crop'}
                        height="1000"
                        width="1000"
                        className="h-48 w-full object-cover rounded-lg"
                        alt={project.name}
                      />
                    </CardItem>
                    <CardItem translateZ="50" className="text-xl font-bold text-card-foreground mb-2">
                      {project.name}
                    </CardItem>
                    <CardItem translateZ="30" className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md inline-block mb-3">
                      {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                    </CardItem>

                    <CardItem translateZ="30" className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        {project.category.charAt(0).toUpperCase() + project.category.slice(1)}
                      </span>
                      {project.status === 'active' && (
                        <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                          trending
                        </span>
                      )}
                      {fundedPercentage > 50 && (
                        <span className="bg-white/10 text-white text-xs px-2 py-1 rounded-md border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                          popular
                        </span>
                      )}
                    </CardItem>

                    <CardItem as="p" translateZ="60" className="text-muted-foreground mb-4 line-clamp-2">
                      {project.description}
                    </CardItem>
                    <CardItem translateZ="40" className="mb-5 w-full">
                      <div className="w-full bg-secondary rounded-full h-1.5">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{
                            width: `${fundedPercentage}%`,
                            boxShadow: '0 0 10px rgba(74, 222, 128, 0.7), 0 0 5px rgba(74, 222, 128, 0.5)'
                          }}
                        ></div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground mt-1">
                        {fundedPercentage}% funded
                      </div>
                    </CardItem>
                    <CardItem
                      translateZ={20}
                      as={Link}
                      href={`/foundfund/projects/${project.id}`}
                      className="w-full px-4 py-2.5 rounded-2xl bg-white text-black text-sm font-medium text-center transition-colors shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
                    >
                      View Project
                    </CardItem>
                  </CardBody>
                </CardContainer>
              );
            })}
          </div>
        )}
      </div>

      {/* How It Works Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-8 tracking-tight">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <CardContainer>
            <CardBody className="bg-card relative border w-full h-auto rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow duration-300" style={{ borderColor: 'var(--border)' }}>
              <CardItem translateZ="40" className="text-4xl font-bold text-card-foreground mb-4">01</CardItem>
              <CardItem translateZ="50" className="text-xl font-bold text-card-foreground mb-2">
                Create a Campaign
              </CardItem>
              <CardItem as="p" translateZ="60" className="text-muted-foreground">
                Share your product idea with the world. Set your funding goal and campaign duration.
              </CardItem>
            </CardBody>
          </CardContainer>

          <CardContainer>
            <CardBody className="bg-card relative border w-full h-auto rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow duration-300" style={{ borderColor: 'var(--border)' }}>
              <CardItem translateZ="40" className="text-4xl font-bold text-card-foreground mb-4">02</CardItem>
              <CardItem translateZ="50" className="text-xl font-bold text-card-foreground mb-2">
                Get Funded
              </CardItem>
              <CardItem as="p" translateZ="60" className="text-muted-foreground">
                Backers support your project with contributions of any size to help you reach your goal.
              </CardItem>
            </CardBody>
          </CardContainer>

          <CardContainer>
            <CardBody className="bg-card relative border w-full h-auto rounded-xl p-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-shadow duration-300" style={{ borderColor: 'var(--border)' }}>
              <CardItem translateZ="40" className="text-4xl font-bold text-card-foreground mb-4">03</CardItem>
              <CardItem translateZ="50" className="text-xl font-bold text-card-foreground mb-2">
                Bring It to Life
              </CardItem>
              <CardItem as="p" translateZ="60" className="text-muted-foreground">
                Use the funds to bring your product to market and share updates with your backers.
              </CardItem>
            </CardBody>
          </CardContainer>
        </div>
      </div>
    </div>
  );
}
