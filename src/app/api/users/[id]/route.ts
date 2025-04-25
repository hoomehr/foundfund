import { NextResponse } from 'next/server';
import { connectToDatabase, User } from '@/models';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Use React.use() to properly handle dynamic params
    const { id } = context.params;
    await connectToDatabase();

    // Try to find by MongoDB _id first, then by our custom id field
    let user = await User.findById(id).lean();

    // If not found by _id, try to find by id field
    if (!user) {
      user = await User.findOne({ id }).lean();
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Convert _id to id for frontend compatibility
    const formattedUser = {
      id: user.id || user._id.toString(),
      ...user,
      _id: undefined
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
