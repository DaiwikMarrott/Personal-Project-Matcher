/**
 * App Entry Point
 * Handles splash screen, landing, and routing to auth or main app
 */
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, loading, session, checkProfileExists } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  // Show splash for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Check if user has profile
  useEffect(() => {
    const checkProfile = async () => {
      if (user && !showSplash) {
        console.log('[Index] Checking profile for user:', user.id);
        const { exists } = await checkProfileExists(user.id);
        console.log('[Index] Profile exists:', exists);
        setHasProfile(exists);
        setCheckingProfile(false);
      } else if (!user && !showSplash) {
        console.log('[Index] No user, skipping profile check');
        setCheckingProfile(false);
      }
    };
    
    checkProfile();
  }, [user, showSplash]);

  // Show loading while checking auth or profile
  if (loading || showSplash || checkingProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Redirect based on auth state and profile existence
  if (user && session) {
    if (!hasProfile) {
      console.log('[Index] User authenticated but no profile -> /create-profile');
      return <Redirect href="/create-profile" />;
    }
    console.log('[Index] User authenticated with profile -> /(tabs)');
    return <Redirect href="/(tabs)" />;
  }

  // Show landing if not authenticated
  console.log('[Index] No user/session -> /landing');
  return <Redirect href="/landing" />;
}
