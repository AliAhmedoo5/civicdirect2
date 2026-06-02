import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../../src/lib/supabase';

export default function OnboardingScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [cityZone, setCityZone] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name || !registrationNumber || !cityZone) {
      alert('Please fill out all fields.');
      return;
    }

    if (!user) {
      alert('User session not found.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('ngos').insert({
        clerk_user_id: user.id,
        name,
        registration_number: registrationNumber,
        city_zone: cityZone,
        is_verified: false,
      });

      if (error) {
        console.error('Supabase Insert Error:', error);
        alert(error.message || 'Failed to save NGO details.');
        return;
      }

      // Automatically go to tabs where it will show "Pending Admin Approval"
      router.replace('/(tabs)');
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0B0F19] justify-center px-6"
    >
      <View className="mb-10">
        <Text className="text-white text-4xl font-bold tracking-tight mb-2">NGO Details</Text>
        <Text className="text-gray-400 text-base">Please complete your registration so our admins can verify your organization.</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-gray-300 font-medium mb-2">NGO Name</Text>
          <TextInput
            value={name}
            placeholder="E.g. Edhi Foundation"
            placeholderTextColor="#4B5563"
            onChangeText={setName}
            className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500"
          />
        </View>

        <View className="mt-4">
          <Text className="text-gray-300 font-medium mb-2">Govt Registration Number</Text>
          <TextInput
            value={registrationNumber}
            placeholder="Enter registration ID"
            placeholderTextColor="#4B5563"
            onChangeText={setRegistrationNumber}
            className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500"
          />
        </View>

        <View className="mt-4">
          <Text className="text-gray-300 font-medium mb-2">City / Zone</Text>
          <TextInput
            value={cityZone}
            placeholder="E.g. Karachi South"
            placeholderTextColor="#4B5563"
            onChangeText={setCityZone}
            className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500"
          />
        </View>

        <TouchableOpacity 
          onPress={onSubmit}
          disabled={loading}
          className="bg-blue-600 rounded-xl py-4 items-center justify-center mt-8 active:bg-blue-700 shadow-lg flex-row"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Submit for Approval</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
