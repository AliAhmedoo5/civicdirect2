import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const completeOnboarding = async () => {
    if (!user) return;
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      // 1. Insert Donor Record into Supabase
      const { error } = await supabase
        .from('donors')
        .insert({
          clerk_user_id: user.id,
          full_name: fullName.trim(),
          wallet_balance: 0 // Initialize empty wallet
        });

      if (error) {
        // If it already exists (duplicate), that's fine, we can just proceed
        if (error.code !== '23505') {
          throw error;
        }
      }

      // 2. Head to feed
      router.replace('/(tabs)');

    } catch (err: any) {
      console.error(err);
      Alert.alert('Setup Failed', err.message || 'Could not complete onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-fintech-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-8">
        
        <View className="mb-10">
          <Text className="text-white text-4xl font-bold tracking-tight mb-2">Almost Done!</Text>
          <Text className="text-gray-400 text-base">Let's set up your donor profile.</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-400 font-medium mb-2 text-sm uppercase tracking-wider">Full Name</Text>
            <TextInput
              value={fullName}
              placeholder="e.g. John Doe"
              placeholderTextColor="#4B5563"
              onChangeText={setFullName}
              className="bg-fintech-card text-white border border-fintech-border rounded-xl px-4 py-4 text-base focus:border-fintech-cyan"
            />
          </View>

          <TouchableOpacity 
            onPress={completeOnboarding} 
            disabled={loading} 
            className="bg-fintech-cyan rounded-xl py-4 items-center justify-center mt-8 active:bg-fintech-cyan/80 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
          >
            {loading ? <ActivityIndicator color="#000" /> : <Text className="text-black font-black text-lg">Complete Setup</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
