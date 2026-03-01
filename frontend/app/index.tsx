/**
 * App Entry Point
 * Handles splash screen, landing, and routing to auth or main app
 */
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { user, loading, session } = useAuth();
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);

  // Show splash for 2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading while checking auth
  if (loading || showSplash) {
    return (
      <View style={{ flex: 1, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Redirect based on auth state
  if (user && session) {
    return <Redirect href="/(tabs)" />;
  }

  // Show landing if not authenticated
  return <Redirect href="/landing" />;
}
