import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send the email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign Up Error:', JSON.stringify(err, null, 2));
      alert(err?.errors?.[0]?.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace('/(auth)/onboarding');
      } else {
        alert('Verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification Error:', JSON.stringify(err, null, 2));
      alert(err?.errors?.[0]?.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-[#0B0F19] justify-center px-6">
        <View className="mb-10">
          <Text className="text-white text-4xl font-bold tracking-tight mb-2">Verify Email</Text>
          <Text className="text-gray-400 text-base">We sent a verification code to {emailAddress}.</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-gray-300 font-medium mb-2">Verification Code</Text>
            <TextInput
              value={code}
              placeholder="Enter code"
              placeholderTextColor="#4B5563"
              onChangeText={setCode}
              keyboardType="number-pad"
              className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500"
            />
          </View>

          <TouchableOpacity onPress={onPressVerify} disabled={loading} className="bg-blue-600 rounded-xl py-4 items-center justify-center mt-8 active:bg-blue-700 shadow-lg flex-row">
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Verify</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0B0F19] justify-center px-6"
    >
      <View className="mb-10">
        <Text className="text-white text-4xl font-bold tracking-tight mb-2">Create Account</Text>
        <Text className="text-gray-400 text-base">Register your NGO organization to start submitting campaigns.</Text>
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
            placeholder="Choose a secure password"
            placeholderTextColor="#4B5563"
            secureTextEntry={true}
            onChangeText={setPassword}
            className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500"
          />
        </View>

        <TouchableOpacity 
          onPress={onSignUpPress}
          disabled={loading}
          className="bg-blue-600 rounded-xl py-4 items-center justify-center mt-8 active:bg-blue-700 shadow-lg flex-row"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Sign Up</Text>
          )}
        </TouchableOpacity>

        <View className="mt-6 items-center">
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text className="text-gray-400">
                Already have an account? <Text className="text-blue-500 font-bold">Sign In</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
