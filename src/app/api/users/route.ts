import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/models';

export async function GET(request: Request) {
  try {
    console.log('GET /api/users - Starting');

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    console.log('GET /api/users - Query params:', { email });

    await connectToDatabase();
    console.log('GET /api/users - Connected to database');

    // Build query
    const query: any = {};
    if (email) {
      query.email = email;
    }

    console.log('GET /api/users - Executing query:', JSON.stringify(query));
    const users = await User.find(query).lean();
    console.log('GET /api/users - Found users:', users ? users.length : 0);

    // Handle case where no users are found
    if (!users || users.length === 0) {
      // Return an empty array
      return NextResponse.json([]);
    }

    // Convert _id to id for frontend compatibility
    const formattedUsers = users.map(user => {
      // If the user already has an id field, use it
      const id = user.id || user._id.toString();
      return {
        id,
        ...user,
        _id: undefined
      };
    });

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
