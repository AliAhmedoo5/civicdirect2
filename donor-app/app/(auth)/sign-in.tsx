import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useWarmUpBrowser } from '../../hooks/useWarmUpBrowser';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  useWarmUpBrowser();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace('/');
      } else {
        Alert.alert('Error', 'Sign in failed. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.errors?.[0]?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const onSelectGoogleAuth = useCallback(async () => {
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow();
      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err: any) {
      console.error('OAuth error', err);
      Alert.alert('Google Sign-In Failed', err.message);
    } finally {
      setGoogleLoading(false);
    }
  }, [startOAuthFlow, router]);

  return (
    <SafeAreaView className="flex-1 bg-fintech-dark">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-8">
        
        <View className="items-center mb-10">
          <View className="w-20 h-20 bg-fintech-cyan/20 rounded-full items-center justify-center mb-4 border border-fintech-cyan/30 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
            <Ionicons name="heart" size={40} color="#06B6D4" />
          </View>
          <Text className="text-white text-3xl font-bold tracking-tight">CivicDirect</Text>
          <Text className="text-fintech-cyan text-sm tracking-[0.2em] uppercase font-semibold mt-1">Donor Portal</Text>
        </View>

        <View className="space-y-4">
          <TouchableOpacity 
            onPress={onSelectGoogleAuth} 
            disabled={googleLoading}
            className="bg-white rounded-xl py-4 items-center justify-center mb-4 flex-row active:bg-gray-200"
          >
            {googleLoading ? <ActivityIndicator color="#000" /> : (
              <>
                <Ionicons name="logo-google" size={20} color="#000" className="mr-3" />
                <Text className="text-black font-bold text-lg ml-2">Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View className="flex-row items-center mb-4">
            <View className="flex-1 h-[1px] bg-fintech-border" />
            <Text className="text-gray-500 mx-4 font-bold text-xs uppercase tracking-widest">OR</Text>
            <View className="flex-1 h-[1px] bg-fintech-border" />
          </View>

          <View>
            <Text className="text-gray-400 font-medium mb-2 text-sm uppercase tracking-wider">Email</Text>
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="donor@example.com"
              placeholderTextColor="#4B5563"
              onChangeText={setEmailAddress}
              className="bg-fintech-card text-white border border-fintech-border rounded-xl px-4 py-4 text-base focus:border-fintech-cyan"
            />
          </View>

          <View className="mt-4">
            <Text className="text-gray-400 font-medium mb-2 text-sm uppercase tracking-wider">Password</Text>
            <TextInput
              value={password}
              placeholder="••••••••"
              placeholderTextColor="#4B5563"
              secureTextEntry
              onChangeText={setPassword}
              className="bg-fintech-card text-white border border-fintech-border rounded-xl px-4 py-4 text-base focus:border-fintech-cyan"
            />
          </View>

          <TouchableOpacity 
            onPress={onSignInPress} 
            disabled={loading}
            className="bg-fintech-cyan rounded-xl py-4 items-center justify-center mt-8 active:bg-fintech-cyan/80 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-black font-black text-lg">Sign In</Text>}
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-400">Want to make an impact? </Text>
          <Link href="/sign-up" asChild>
            <TouchableOpacity>
              <Text className="text-fintech-cyan font-bold">Create Account</Text>
            </TouchableOpacity>
          </Link>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
