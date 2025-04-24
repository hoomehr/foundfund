'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define the User type
interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  avatarUrl?: string;
}

// Define the AuthContext type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
});

// Create a provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if the user is logged in on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // For demo purposes, we'll hardcode a successful login for john@example.com
      if (email === 'john@example.com' && password === 'password123') {
        console.log('Using demo account login');

        // Try to fetch the actual user from the database
        const response = await fetch('/api/users?email=' + encodeURIComponent(email));
        let demoUser: User;

        if (response.ok) {
          const users = await response.json();
          const foundUser = users.find((u: any) => u.email === email);

          if (foundUser) {
            console.log('Found user in database:', foundUser.name);
            demoUser = {
              id: foundUser.id,
              name: foundUser.name,
              email: foundUser.email,
              username: foundUser.username,
              avatarUrl: foundUser.avatarUrl,
            };
          } else {
            // Fallback to hardcoded user if not found in database
            console.log('User not found in database, using hardcoded data');
            demoUser = {
              id: 'user1',
              name: 'John Doe',
              email: 'john@example.com',
              username: 'johndoe',
              avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
            };
          }
        } else {
          // Fallback to hardcoded user if API fails
          console.log('API call failed, using hardcoded data');
          demoUser = {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com',
            username: 'johndoe',
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
          };
        }

        setUser(demoUser);
        localStorage.setItem('user', JSON.stringify(demoUser));
        return true;
      }

      // For non-demo accounts, try to authenticate with the API
      // This is a placeholder for a real authentication system
      console.log('Attempting to authenticate with API');
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/foundfund/funders');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Create a hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}
