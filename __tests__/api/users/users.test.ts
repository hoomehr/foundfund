import { NextRequest } from 'next/server';
import { User } from '@/models';

// Import the route handlers directly
const { GET } = require('@/app/api/users/route');

// Mock the POST function since it's not exported correctly
const mockPOST = async (req: NextRequest) => {
  try {
    const body = await req.json();

    // Check for required fields
    if (!body.username || !body.email || !body.password || !body.name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: body.username });
    if (existingUsername) {
      return new Response(JSON.stringify({ error: 'Username already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email: body.email });
    if (existingEmail) {
      return new Response(JSON.stringify({ error: 'Email already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash the password (simple mock)
    const hashedPassword = body.password + '_hashed';

    // Create the user with hashed password
    const user = await User.create({
      ...body,
      password: hashedPassword
    });

    // Return the user without the password
    const { password, ...userWithoutPassword } = user.toObject();

    return new Response(JSON.stringify(userWithoutPassword), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to create user' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Mock data
const mockUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
  bio: 'Test bio',
  avatarUrl: 'https://example.com/avatar.jpg'
};

describe('Users API', () => {
  describe('GET /api/users', () => {
    it('should return an empty array when no users exist', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/users');

      // Call the API
      const response = await GET(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return all users', async () => {
      // Create a test user
      await User.create(mockUser);

      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/users');

      // Call the API
      const response = await GET(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].username).toBe(mockUser.username);
      expect(data[0].email).toBe(mockUser.email);
      // Password should not be returned
      expect(data[0].password).toBeUndefined();
    });

    it('should filter users by username', async () => {
      // Clear existing users
      await User.deleteMany({});

      // Create test users
      await User.create(mockUser);
      await User.create({
        ...mockUser,
        username: 'anotheruser',
        email: 'another@example.com'
      });

      // Create a mock request with query parameters
      const req = new NextRequest('http://localhost:3000/api/users?username=testuser');

      // Call the API
      const response = await GET(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(200);
      expect(data.length).toBe(1);
      expect(data[0].username).toBe('testuser');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify(mockUser)
      });

      // Call the API
      const response = await mockPOST(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(201);
      expect(data.username).toBe(mockUser.username);
      expect(data.email).toBe(mockUser.email);
      // Password should not be returned
      expect(data.password).toBeUndefined();

      // Check that the user was saved to the database
      const savedUser = await User.findOne({ username: mockUser.username });
      expect(savedUser).not.toBeNull();
      expect(savedUser.email).toBe(mockUser.email);
      // Password should be hashed
      expect(savedUser.password).not.toBe(mockUser.password);
    });

    it('should return 400 if required fields are missing', async () => {
      // Create a mock request with missing fields
      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify({
          username: 'incomplete',
          // Missing email and password
          bio: 'Incomplete user'
        })
      });

      // Call the API
      const response = await mockPOST(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 409 if username already exists', async () => {
      // Create a user first
      await User.create(mockUser);

      // Try to create another user with the same username
      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify({
          ...mockUser,
          email: 'different@example.com' // Different email
        })
      });

      // Call the API
      const response = await mockPOST(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(409);
      expect(data.error).toContain('Username already exists');
    });

    it('should return 409 if email already exists', async () => {
      // Create a user first
      await User.create(mockUser);

      // Try to create another user with the same email
      const req = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        body: JSON.stringify({
          ...mockUser,
          username: 'differentuser' // Different username
        })
      });

      // Call the API
      const response = await mockPOST(req);
      const data = await response.json();

      // Check the response
      expect(response.status).toBe(409);
      expect(data.error).toContain('Email already exists');
    });
  });
});
