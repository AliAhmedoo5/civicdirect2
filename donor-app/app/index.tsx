import React, { useEffect, useState } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../src/lib/supabase';

export default function Index() {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [isDonor, setIsDonor] = useState<boolean | null>(null);

  useEffect(() => {
    const checkDonorStatus = async () => {
      if (isSignedIn && user) {
        const { data, error } = await supabase
          .from('donors')
          .select('id')
          .eq('clerk_user_id', user.id)
          .single();
        
        if (data) {
          setIsDonor(true);
        } else {
          // They don't have a profile yet (new Google signup), 
          // route them to onboarding.
          setIsDonor(false);
        }
      }
    };

    if (isLoaded && isSignedIn) {
      checkDonorStatus();
    }
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || (isSignedIn && isDonor === null)) {
    return (
      <View className="flex-1 bg-fintech-dark justify-center items-center">
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  if (isSignedIn) {
    if (isDonor) {
      return <Redirect href="/(tabs)" />;
    } else {
      return <Redirect href="/(auth)/onboarding" />;
    }
  }

  return <Redirect href="/(auth)/sign-in" />;
}
