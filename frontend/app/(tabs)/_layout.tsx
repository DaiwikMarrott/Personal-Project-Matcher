import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#78716c',
        headerShown: true,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#a7f3d0',
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: '#e6f7ed',
        },
        headerTintColor: '#1c1917',
        headerTitleStyle: {
          fontWeight: '900',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Projects Matcher',
          headerShown: false,  // Hide default header, we're using custom
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Discover',
          headerTitle: 'Projects Matcher',
          headerShown: false,  // Hide default header, we're using custom
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post Idea',
          headerTitle: 'Projects Matcher',
          headerShown: false,  // Hide default header, we're using custom
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'Projects Matcher',
          headerShown: false,  // Hide default header, we're using custom
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
