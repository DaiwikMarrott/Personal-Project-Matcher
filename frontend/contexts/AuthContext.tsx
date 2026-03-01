/**
 * AuthContext for Project Jekyll & Hyde
 * Handles authentication using Supabase (Google and Email login)
 */
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { createClient, Session, User, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../services/api';

console.log('[AuthContext] API_BASE_URL imported:', API_BASE_URL);

// Initialize Supabase client
// Use hardcoded fallbacks for development if env vars aren't loaded
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://reyezzmxvvvpapxkjlvf.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJleWV6em14dnZ2cGFweGtqbHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMjM0OTgsImV4cCI6MjA4Nzg5OTQ5OH0.O1Mp3nsP0S2J7f5zh1VPE6RrGIsbAMyTqrem4E2mRY4';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey ? 'Present' : 'Missing');
}

// For web, use localStorage; for native, use AsyncStorage
const storage = Platform.OS === 'web' 
  ? undefined // Let Supabase use default localStorage on web
  : AsyncStorage;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(storage && { storage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  checkProfileExists: (userId: string) => Promise<{ exists: boolean; profile: any | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cache profile checks to avoid hammering the API
  const [profileCache, setProfileCache] = useState<{
    userId: string | null;
    data: { exists: boolean; profile: any | null } | null;
    timestamp: number;
  }>({ userId: null, data: null, timestamp: 0 });

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthContext: Sign in error:', error);
        throw error;
      }

      console.log('AuthContext: Sign in successful, setting session...');
      setSession(data.session);
      setUser(data.user);
      console.log('AuthContext: User set:', data.user?.email);
    } catch (error: any) {
      console.error('Error signing in with email:', error.message);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Attempting sign up...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        }
      });

      if (error) {
        console.error('AuthContext: Sign up error:', error);
        throw error;
      }

      console.log('AuthContext: Sign up successful');
      console.log('User:', data.user?.email);
      
      // If email confirmation is required, user will be null
      if (data.user && !data.session) {
        console.log('Email confirmation required - check your email');
      }
      
      return data;
    } catch (error: any) {
      console.error('Error signing up with email:', error.message);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: process.env.EXPO_PUBLIC_REDIRECT_URL,
        },
      });

      if (error) throw error;

      // OAuth flow will handle the session
    } catch (error: any) {
      console.error('Error signing in with Google:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      // Clear profile cache on logout
      setProfileCache({ userId: null, data: null, timestamp: 0 });
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.EXPO_PUBLIC_REDIRECT_URL}/reset-password`,
      });

      if (error) throw error;

      console.log('Password reset email sent');
    } catch (error: any) {
      console.error('Error resetting password:', error.message);
      throw error;
    }
  };

  const checkProfileExists = async (userId: string, forceRefresh: boolean = false): Promise<{ exists: boolean; profile: any | null }> => {
    try {
      const now = Date.now();
      const cacheAge = now - profileCache.timestamp;
      const CACHE_DURATION = 10000; // 10 seconds cache
      
      // Return cached data if it exists, matches the user, is recent, and not forcing refresh
      if (!forceRefresh && 
          profileCache.userId === userId && 
          profileCache.data && 
          cacheAge < CACHE_DURATION) {
        console.log('[AuthContext] Returning cached profile (age:', Math.round(cacheAge / 1000), 'seconds)');
        return profileCache.data;
      }

      console.log('[AuthContext] Checking profile for user:', userId);
      const response = await fetch(`${API_BASE_URL}/profile/check/${userId}`);
      console.log('[AuthContext] Profile check response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to check profile');
      }
      const data = await response.json();
      console.log('[AuthContext] Profile check result:', data);
      
      // Cache the result
      setProfileCache({
        userId,
        data,
        timestamp: now
      });
      
      return data;
    } catch (error: any) {
      console.error('[AuthContext] Error checking profile:', error.message);
      return { exists: false, profile: null };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    resetPassword,
    checkProfileExists,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
