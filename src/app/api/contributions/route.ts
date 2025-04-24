import { NextResponse } from 'next/server';
import { connectToDatabase, Contribution } from '@/models';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId') || searchParams.get('fundItemId');
    const userId = searchParams.get('userId') || searchParams.get('contributorId');

    await connectToDatabase();

    // Build query based on parameters
    const query: any = {};

    if (campaignId) {
      // Support both old and new field names
      query.$or = [{ fundItemId: campaignId }, { campaignId }];
    }

    if (userId) {
      // Support both old and new field names
      query.$or = [{ userId }, { contributorId: userId }];
    }

    const contributions = await Contribution.find(query).lean();

    // Handle case where no contributions are found
    if (!contributions || contributions.length === 0) {
      return NextResponse.json([]);
    }

    // Convert _id to id for frontend compatibility
    const formattedContributions = contributions.map(contribution => ({
      id: contribution.id || contribution._id.toString(),
      ...contribution,
      _id: undefined
    }));

    return NextResponse.json(formattedContributions);
  } catch (error) {
    console.error('Error fetching contributions:', error);
    return NextResponse.json({ error: 'Failed to fetch contributions' }, { status: 500 });
  }
}
