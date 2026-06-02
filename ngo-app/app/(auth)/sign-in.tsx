import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      await setActive({ session: completeSignIn.createdSessionId });
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Sign In Error:', JSON.stringify(err, null, 2));
      alert(err?.errors?.[0]?.message || 'An error occurred during sign in.');
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
        <Text className="text-white text-4xl font-bold tracking-tight mb-2">Welcome Back</Text>
        <Text className="text-gray-400 text-base">Sign in to your NGO organization account to continue.</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-gray-300 font-medium mb-2">Email Address</Text>
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="admin@ngo.org"
            placeholderTextColor="#4B5563"
            onChangeText={setEmailAddress}
            className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500"
          />
        </View>

        <View className="mt-4">
          <Text className="text-gray-300 font-medium mb-2">Password</Text>
          <TextInput
            value={password}
            placeholder="Enter your password"
            placeholderTextColor="#4B5563"
            secureTextEntry={true}
            onChangeText={setPassword}
            className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500"
          />
        </View>

        <TouchableOpacity 
          onPress={onSignInPress}
          disabled={loading}
          className="bg-blue-600 rounded-xl py-4 items-center justify-center mt-8 active:bg-blue-700 shadow-lg flex-row"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Sign In</Text>
          )}
        </TouchableOpacity>

        <View className="mt-6 items-center">
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text className="text-gray-400">
                Don't have an account? <Text className="text-blue-500 font-bold">Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
