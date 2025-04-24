import {
  FundItem,
  User,
  Contribution,
  Category,
  FundingStatus,
  CampaignAttachment,
  CampaignUpdate,
  CampaignFAQ,
  UserFollow,
  CampaignBookmark,
  Notification
} from '@/types';

// Mock Users
export const users: User[] = [
  {
    id: 'user1',
    username: 'johndoe',
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Entrepreneur and tech enthusiast with a passion for sustainable products.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-04-20T00:00:00Z',
    totalCreated: 3,
    totalFunded: 1,
    totalRaised: 8000,
    totalContributed: 200,
  },
  {
    id: 'user2',
    username: 'janesmith',
    name: 'Jane Smith',
    email: 'jane@example.com',
    bio: 'Investor and art collector looking for innovative projects to support.',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop',
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2023-04-18T00:00:00Z',
    totalCreated: 0,
    totalFunded: 2,
    totalRaised: 0,
    totalContributed: 250,
  },
  {
    id: 'user3',
    username: 'bobjohnson',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    bio: 'Artisan and craftsman specializing in handmade goods and culinary creations.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2070&auto=format&fit=crop',
    createdAt: '2023-01-20T00:00:00Z',
    updatedAt: '2023-04-15T00:00:00Z',
    totalCreated: 2,
    totalFunded: 1,
    totalRaised: 3200,
    totalContributed: 50,
  },
];

// Mock Campaign Attachments
const campaignAttachments: CampaignAttachment[] = [
  {
    id: 'attach1',
    campaignId: 'fund1',
    name: 'Eco Bottle Business Plan.pdf',
    fileUrl: 'https://example.com/files/eco_bottle_plan.pdf',
    fileType: 'pdf',
    fileSize: 2500000,
    description: 'Detailed business plan for the Eco-Friendly Water Bottle project',
    type: 'business_plan',
    uploadedAt: '2023-04-01T00:00:00Z',
  },
  {
    id: 'attach2',
    campaignId: 'fund1',
    name: 'Prototype Designs.pdf',
    fileUrl: 'https://example.com/files/eco_bottle_designs.pdf',
    fileType: 'pdf',
    fileSize: 1800000,
    description: 'Design specifications and prototype images',
    type: 'prototype',
    uploadedAt: '2023-04-01T00:00:00Z',
  },
  {
    id: 'attach3',
    campaignId: 'fund3',
    name: 'Smart Garden Pitch Deck.pdf',
    fileUrl: 'https://example.com/files/smart_garden_pitch.pdf',
    fileType: 'pdf',
    fileSize: 3200000,
    description: 'Investor pitch deck for the Smart Home Garden Kit',
    type: 'pitch_deck',
    uploadedAt: '2023-04-10T00:00:00Z',
  },
];

// Mock Campaign Updates
const campaignUpdates: CampaignUpdate[] = [
  {
    id: 'update1',
    campaignId: 'fund1',
    title: 'Production Started!',
    content: "We're excited to announce that production of the Eco-Friendly Water Bottles has begun. We've finalized the design and are working with our manufacturing partners to ensure the highest quality.",
    createdAt: '2023-04-15T00:00:00Z',
  },
  {
    id: 'update2',
    campaignId: 'fund1',
    title: 'New Color Options',
    content: "Based on your feedback, we've added three new color options: Ocean Blue, Forest Green, and Sunset Orange. These colors are inspired by nature and complement our eco-friendly mission.",
    createdAt: '2023-04-25T00:00:00Z',
  },
  {
    id: 'update3',
    campaignId: 'fund2',
    title: 'Shipping Update',
    content: "We've completed the first batch of ceramic mugs and will begin shipping next week. Each mug is carefully packaged to ensure it arrives safely.",
    createdAt: '2023-04-10T00:00:00Z',
  },
];

// Mock Campaign FAQs
const campaignFaqs: CampaignFAQ[] = [
  {
    id: 'faq1',
    campaignId: 'fund1',
    question: 'How long does the bottle keep drinks cold?',
    answer: "Our Eco-Friendly Water Bottle keeps drinks cold for up to 24 hours and hot for up to 12 hours thanks to its double-wall vacuum insulation.",
  },
  {
    id: 'faq2',
    campaignId: 'fund1',
    question: 'Is the bottle dishwasher safe?',
    answer: "Yes, the bottle is dishwasher safe. However, we recommend hand washing to extend the life of the bottle and maintain its insulating properties.",
  },
  {
    id: 'faq3',
    campaignId: 'fund3',
    question: 'How much space does the Smart Garden require?',
    answer: "The Smart Home Garden Kit has a compact footprint of just 16\" x 8\", making it perfect for countertops, windowsills, or small spaces.",
  },
];

// Mock Fund Items (Campaigns)
export const fundItems: FundItem[] = [
  {
    id: 'fund1',
    name: 'Eco-Friendly Water Bottle',
    description: 'A reusable water bottle made from recycled materials that keeps your drinks cold for 24 hours.',
    story: `Our journey began when we noticed the alarming amount of single-use plastic bottles being discarded every day. We wanted to create a solution that was not only environmentally friendly but also practical and stylish.

The Eco-Friendly Water Bottle is made from 100% recycled materials, primarily recovered ocean plastic. Each bottle prevents approximately 100 single-use plastic bottles from entering our oceans and landfills.

Our unique double-wall vacuum insulation technology keeps your drinks cold for 24 hours or hot for 12 hours, making it perfect for any activity or climate. The sleek design and variety of colors make it a fashionable accessory that you'll want to carry everywhere.

By supporting this campaign, you're not just getting a high-quality water bottle - you're contributing to a cleaner planet. A portion of every sale goes toward ocean cleanup initiatives around the world.

Join us in our mission to reduce plastic waste and make sustainable choices more accessible to everyone.`,
    shortDescription: 'Sustainable hydration solution made from recycled ocean plastic.',
    creatorId: 'user1',
    category: 'technology',
    tags: ['eco-friendly', 'sustainable', 'recycled', 'hydration'],
    fundingGoal: 5000,
    currentAmount: 3200,
    minContribution: 25,
    maxContribution: 1000,
    status: 'active',
    featured: true,
    createdAt: '2023-04-01T00:00:00Z',
    publishedAt: '2023-04-01T00:00:00Z',
    endDate: '2023-06-01T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
    galleryImages: [
      'https://images.unsplash.com/photo-1523362628745-0c100150b504',
      'https://images.unsplash.com/photo-1536939459926-301728717817',
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5'
    ],
    contributionsCount: 42,
    uniqueContributorsCount: 38,
    attachments: campaignAttachments.filter(a => a.campaignId === 'fund1'),
    updates: campaignUpdates.filter(u => u.campaignId === 'fund1'),
    faqs: campaignFaqs.filter(f => f.campaignId === 'fund1'),
  },
  {
    id: 'fund2',
    name: 'Handcrafted Ceramic Mugs',
    description: 'Unique, handmade ceramic mugs with custom designs. Each piece is one of a kind.',
    story: `As a lifelong potter, I have always been passionate about creating functional art that brings joy to everyday moments. These handcrafted ceramic mugs are the culmination of years of refining my craft and developing unique glazing techniques.

Each mug is individually thrown on my potter's wheel, carefully shaped, and then decorated with my signature designs. No two mugs are exactly alike - each has its own character and subtle variations that make it truly one of a kind.

I use only food-safe glazes and high-fire my pieces to ensure they're durable enough for daily use. These mugs are microwave and dishwasher safe, though hand washing is recommended to preserve their beauty for years to come.

By supporting this campaign, you're not just getting a beautiful mug - you're supporting traditional craftsmanship and small-scale artisan production. In a world of mass-produced goods, these mugs represent a return to thoughtful, handmade quality.

I am excited to share my work with you and bring a touch of artistry to your morning coffee or evening tea ritual.`,
    shortDescription: 'Artisanal pottery that brings beauty to your daily rituals.',
    creatorId: 'user3',
    category: 'art',
    tags: ['handmade', 'ceramic', 'artisanal', 'pottery'],
    fundingGoal: 2000,
    currentAmount: 2000,
    minContribution: 35,
    status: 'funded',
    featured: true,
    createdAt: '2023-03-15T00:00:00Z',
    publishedAt: '2023-03-15T00:00:00Z',
    endDate: '2023-05-15T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d',
    galleryImages: [
      'https://images.unsplash.com/photo-1577903700896-ab0d31c3ef3f',
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261',
      'https://images.unsplash.com/photo-1578079577681-b712f3d2d1ac'
    ],
    contributionsCount: 57,
    uniqueContributorsCount: 57,
    updates: campaignUpdates.filter(u => u.campaignId === 'fund2'),
  },
  {
    id: 'fund3',
    name: 'Smart Home Garden Kit',
    description: 'An automated indoor garden system that lets you grow herbs and vegetables year-round.',
    story: `The Smart Home Garden Kit was born from a simple desire: to make fresh, homegrown produce accessible to everyone, regardless of space or gardening experience.

Our innovative system combines hydroponics, smart sensors, and automated care to create the perfect environment for plants to thrive. Simply plant the included seed pods, fill the water reservoir, and let the Smart Garden do the rest. The integrated LED grow lights provide the optimal spectrum for photosynthesis, while the smart sensors monitor water levels, nutrient content, and growth progress.

The companion app keeps you informed about your garden's status and sends notifications when it is time to harvest or add water. You can even control the light schedule and monitor growth statistics remotely.

The compact design fits perfectly on countertops, windowsills, or small spaces, making it ideal for urban dwellers, busy professionals, or anyone who wants to enjoy the benefits of gardening without the guesswork.

With the Smart Home Garden Kit, you can grow fresh herbs, leafy greens, and even small vegetables year-round, regardless of the season or climate. Imagine harvesting fresh basil for your pasta or crisp lettuce for your salad, right from your kitchen!

By supporting this campaign, you are not just getting a revolutionary gardening system - you are joining a movement toward sustainable, local food production and reconnecting with the joy of growing your own food.`,
    shortDescription: 'Grow fresh herbs and vegetables indoors with zero effort.',
    creatorId: 'user1',
    category: 'technology',
    tags: ['smart-home', 'gardening', 'hydroponics', 'sustainable'],
    fundingGoal: 10000,
    currentAmount: 4500,
    minContribution: 50,
    status: 'active',
    featured: false,
    createdAt: '2023-04-10T00:00:00Z',
    publishedAt: '2023-04-10T00:00:00Z',
    endDate: '2023-07-10T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae',
    galleryImages: [
      'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2',
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b',
      'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735'
    ],
    videoUrl: 'https://example.com/videos/smart_garden_demo.mp4',
    contributionsCount: 30,
    uniqueContributorsCount: 28,
    attachments: campaignAttachments.filter(a => a.campaignId === 'fund3'),
    faqs: campaignFaqs.filter(f => f.campaignId === 'fund3'),
  },
  {
    id: 'fund4',
    name: 'Artisanal Chocolate Collection',
    description: 'A curated box of handcrafted chocolates made with ethically sourced ingredients.',
    story: `As a chocolatier with over a decade of experience, I have traveled the world to source the finest cacao beans and perfect my craft. This Artisanal Chocolate Collection represents the culmination of that journey - a carefully curated selection of handcrafted chocolates that showcase the incredible depth and diversity of flavors that chocolate can offer.

Each chocolate in this collection is made from bean-to-bar in our small workshop. We work directly with cacao farmers in Ecuador, Madagascar, and Peru, ensuring fair compensation and sustainable farming practices. By cutting out middlemen, we are able to pay farmers up to 300% more than standard market rates while obtaining the highest quality beans.

Our chocolates feature unique flavor combinations inspired by global culinary traditions - from Madagascan vanilla and Himalayan sea salt to Japanese yuzu and Ethiopian coffee. We use only natural ingredients, with no artificial flavors, preservatives, or additives.

The collection comes in elegant, eco-friendly packaging that makes it perfect for gifting or treating yourself. Each box includes a guide to the chocolates inside, with tasting notes and information about the origin of the ingredients.

By supporting this campaign, you are not just getting exceptional chocolate - you are supporting ethical trade practices and helping to preserve traditional chocolate-making techniques in a world dominated by mass production.

Join us in celebrating the art of chocolate and making a positive impact on the lives of cacao farmers around the world.`,
    shortDescription: 'Ethically sourced, bean-to-bar chocolates with unique flavor profiles.',
    creatorId: 'user3',
    category: 'food',
    tags: ['chocolate', 'artisanal', 'gourmet', 'ethical'],
    fundingGoal: 3000,
    currentAmount: 1200,
    minContribution: 30,
    status: 'active',
    featured: false,
    createdAt: '2023-04-05T00:00:00Z',
    publishedAt: '2023-04-05T00:00:00Z',
    endDate: '2023-06-05T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b',
    galleryImages: [
      'https://images.unsplash.com/photo-1511381939415-e44015466834',
      'https://images.unsplash.com/photo-1481391319762-47dff72954d9',
      'https://images.unsplash.com/photo-1606312619070-d48b4c652a52'
    ],
    contributionsCount: 40,
    uniqueContributorsCount: 38,
  },
  {
    id: 'fund5',
    name: 'Minimalist Desk Organizer',
    description: 'A sleek, modular desk organizer that helps keep your workspace tidy and efficient.',
    story: `The Minimalist Desk Organizer was designed with one goal in mind: to bring calm and order to your workspace without adding visual clutter.

As someone who works from home, I found that most desk organizers on the market were either too bulky, too flimsy, or simply not adaptable to my changing needs. I wanted something that would grow with me and adapt to different projects and workflows.

After countless prototypes and refinements, I created this modular system that combines clean, minimalist aesthetics with practical functionality. Made from sustainable bamboo and recycled aluminum, each component is designed to work seamlessly together while also functioning beautifully on its own.

The system includes:
- A pen and pencil holder with dividers for different sizes
- A phone/tablet stand with cable management
- A stackable paper tray system
- Modular small item containers for paperclips, sticky notes, etc.
- A hidden drawer for items you want to keep accessible but out of sight

Each piece connects magnetically, allowing you to arrange and rearrange your setup as needed. The natural materials and clean lines complement any workspace, from corporate offices to home studios.

By supporting this campaign, you are not just getting an exceptional desk organizer - you are investing in a system that will help you work more efficiently and create a workspace that inspires productivity.

Join me in bringing mindful design to everyday objects and transforming the way we organize our work lives.`,
    shortDescription: 'Modular organization system for the modern workspace.',
    creatorId: 'user1',
    category: 'other',
    tags: ['minimalist', 'organization', 'workspace', 'productivity'],
    fundingGoal: 1500,
    currentAmount: 300,
    minContribution: 20,
    status: 'active',
    featured: false,
    createdAt: '2023-04-15T00:00:00Z',
    publishedAt: '2023-04-15T00:00:00Z',
    endDate: '2023-06-15T00:00:00Z',
    imageUrl: 'https://images.unsplash.com/photo-1593642532744-d377ab507dc8',
    galleryImages: [
      'https://images.unsplash.com/photo-1593642634315-48f5414c3ad9',
      'https://images.unsplash.com/photo-1593642634443-44adaa06623a',
      'https://images.unsplash.com/photo-1593642533144-3d62aa4783ec'
    ],
    contributionsCount: 15,
    uniqueContributorsCount: 15,
  },
];

// Mock Contributions
export const contributions: Contribution[] = [
  {
    id: 'contrib1',
    fundItemId: 'fund1',
    userId: 'user2',
    campaignId: 'fund1',
    contributorId: 'user2',
    amount: 100,
    status: 'completed',
    message: 'Love this eco-friendly initiative!',
    anonymous: false,
    createdAt: '2023-04-10T00:00:00Z',
  },
  {
    id: 'contrib2',
    fundItemId: 'fund1',
    userId: 'user3',
    campaignId: 'fund1',
    contributorId: 'user3',
    amount: 50,
    status: 'completed',
    anonymous: true,
    createdAt: '2023-04-12T00:00:00Z',
  },
  {
    id: 'contrib3',
    fundItemId: 'fund2',
    userId: 'user1',
    campaignId: 'fund2',
    contributorId: 'user1',
    amount: 200,
    status: 'completed',
    message: 'These mugs look beautiful! Can\'t wait to receive mine.',
    anonymous: false,
    createdAt: '2023-03-20T00:00:00Z',
  },
  {
    id: 'contrib4',
    fundItemId: 'fund3',
    userId: 'user2',
    campaignId: 'fund3',
    contributorId: 'user2',
    amount: 150,
    status: 'completed',
    message: 'This is exactly what I need for my apartment!',
    anonymous: false,
    createdAt: '2023-04-15T00:00:00Z',
  },
];

// Helper functions to work with mock data
export const getCurrentUser = () => users[0]; // For simplicity, we'll always use the first user

export const getFundItemsByCreator = (creatorId: string) => {
  return fundItems.filter(item => item.creatorId === creatorId);
};

export const getContributionsByFundItem = (fundItemId: string) => {
  return contributions.filter(contrib => contrib.fundItemId === fundItemId);
};

export const getContributionsByCampaign = (campaignId: string) => {
  return contributions.filter(contrib => contrib.campaignId === campaignId);
};

export const getUserById = (userId: string) => {
  return users.find(user => user.id === userId);
};

export const getFundItemById = (fundItemId: string) => {
  return fundItems.find(item => item.id === fundItemId);
};

export const getCategories = (): Category[] => {
  return [
    'technology',
    'art',
    'music',
    'film',
    'games',
    'publishing',
    'fashion',
    'food',
    'community',
    'other'
  ];
};

export const getFundingStatuses = (): FundingStatus[] => {
  return ['draft', 'active', 'funded', 'expired', 'canceled'];
};

// Mock user follows, bookmarks, and notifications
export const userFollows: UserFollow[] = [
  {
    id: 'follow1',
    followerId: 'user2',
    followedId: 'user1',
    createdAt: '2023-03-15T00:00:00Z',
  },
  {
    id: 'follow2',
    followerId: 'user3',
    followedId: 'user1',
    createdAt: '2023-03-20T00:00:00Z',
  },
  {
    id: 'follow3',
    followerId: 'user1',
    followedId: 'user3',
    createdAt: '2023-04-05T00:00:00Z',
  },
];

export const campaignBookmarks: CampaignBookmark[] = [
  {
    id: 'bookmark1',
    userId: 'user1',
    campaignId: 'fund2',
    createdAt: '2023-03-16T00:00:00Z',
  },
  {
    id: 'bookmark2',
    userId: 'user2',
    campaignId: 'fund1',
    createdAt: '2023-04-02T00:00:00Z',
  },
  {
    id: 'bookmark3',
    userId: 'user2',
    campaignId: 'fund3',
    createdAt: '2023-04-11T00:00:00Z',
  },
];

export const notifications: Notification[] = [
  {
    id: 'notif1',
    userId: 'user1',
    type: 'contribution',
    message: "Jane Smith contributed $100 to your Eco-Friendly Water Bottle campaign",
    read: false,
    relatedId: 'contrib1',
    createdAt: '2023-04-10T00:00:00Z',
  },
  {
    id: 'notif2',
    userId: 'user1',
    type: 'contribution',
    message: "Someone contributed $50 to your Eco-Friendly Water Bottle campaign",
    read: true,
    relatedId: 'contrib2',
    createdAt: '2023-04-12T00:00:00Z',
  },
  {
    id: 'notif3',
    userId: 'user3',
    type: 'contribution',
    message: "John Doe contributed $200 to your Handcrafted Ceramic Mugs campaign",
    read: false,
    relatedId: 'contrib3',
    createdAt: '2023-03-20T00:00:00Z',
  },
  {
    id: 'notif4',
    userId: 'user1',
    type: 'campaign_update',
    message: "Bob Johnson posted an update on Handcrafted Ceramic Mugs",
    read: false,
    relatedId: 'update3',
    createdAt: '2023-04-10T00:00:00Z',
  },
  {
    id: 'notif5',
    userId: 'user3',
    type: 'goal_reached',
    message: "Congratulations! Your Handcrafted Ceramic Mugs campaign has reached its funding goal",
    read: true,
    relatedId: 'fund2',
    createdAt: '2023-04-05T00:00:00Z',
  },
];
