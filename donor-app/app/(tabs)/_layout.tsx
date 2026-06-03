import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { supabase } from '../../src/lib/supabase';

export default function TabLayout() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    const validateAccess = async () => {
      if (!isLoaded) return;
      
      if (!isSignedIn || !user) {
        router.replace('/(auth)/sign-in');
        return;
      }

      // Check if donor exists in Supabase
      const { data } = await supabase
        .from('donors')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single();

      if (!data) {
        // They are logged in with a non-donor account (like NGO)
        await signOut();
        router.replace('/(auth)/sign-in');
      } else {
        setIsValidated(true);
      }
    };

    validateAccess();
  }, [isLoaded, isSignedIn, user]);

  // Prevent rendering the tabs until we are 100% sure they are a valid donor
  if (!isValidated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E17', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0E17',
          borderTopWidth: 1,
          borderTopColor: '#1F2937',
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarActiveTintColor: '#06B6D4',
        tabBarInactiveTintColor: '#4B5563',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="earth" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
