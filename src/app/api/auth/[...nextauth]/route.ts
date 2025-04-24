import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import { connectToDatabase, User } from '@/models';

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('NextAuth authorize called with email:', credentials?.email);

        if (!credentials?.email || !credentials?.password) {
          console.log('Missing email or password');
          return null;
        }

        try {
          await connectToDatabase();
          console.log('Connected to database');

          // Find user by email
          const user = await User.findOne({ email: credentials.email }).lean();
          console.log('User found:', user ? 'Yes' : 'No');

          if (!user) {
            console.log('User not found');
            return null;
          }

          if (!user.password) {
            console.log('User has no password');
            return null;
          }

          // Compare passwords
          console.log('Comparing passwords...');
          const isPasswordValid = await compare(credentials.password, user.password);
          console.log('Password valid:', isPasswordValid ? 'Yes' : 'No');

          if (!isPasswordValid) {
            console.log('Invalid password');
            return null;
          }

          console.log('Authentication successful for user:', user.username);

          // Return user without password
          return {
            id: user.id || user._id.toString(),
            name: user.name,
            email: user.email,
            username: user.username,
            image: user.avatarUrl,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/foundfund/login',
    signOut: '/foundfund/login',
    error: '/foundfund/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'foundfund-secret-key',
});

export { handler as GET, handler as POST };
