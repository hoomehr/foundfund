import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/models';

export async function GET() {
  try {
    console.log('GET /api/users - Starting');
    await connectToDatabase();
    console.log('GET /api/users - Connected to database');

    const users = await User.find({}).lean();
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
