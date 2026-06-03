import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useWarmUpBrowser } from '../../hooks/useWarmUpBrowser';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  useWarmUpBrowser();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert('Error', err.errors[0]?.message || 'Sign up failed');
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
        router.replace('/');
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert('Verification Failed', err.errors[0]?.message || 'Invalid code');
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
        
        <View className="mb-10">
          <Text className="text-white text-3xl font-bold tracking-tight mb-2">Join CivicDirect</Text>
          <Text className="text-gray-400 text-base">Create a donor account to start making an impact today.</Text>
        </View>

        {!pendingVerification ? (
          <View className="space-y-4">
            <TouchableOpacity 
              onPress={onSelectGoogleAuth} 
              disabled={googleLoading}
              className="bg-white rounded-xl py-4 items-center justify-center mb-4 flex-row active:bg-gray-200"
            >
              {googleLoading ? <ActivityIndicator color="#000" /> : (
                <>
                  <Ionicons name="logo-google" size={20} color="#000" className="mr-3" />
                  <Text className="text-black font-bold text-lg ml-2">Sign up with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center mb-4">
              <View className="flex-1 h-[1px] bg-fintech-border" />
              <Text className="text-gray-500 mx-4 font-bold text-xs uppercase tracking-widest">OR</Text>
              <View className="flex-1 h-[1px] bg-fintech-border" />
            </View>

            <View>
              <Text className="text-gray-400 font-medium mb-2 text-sm uppercase tracking-wider">Email Address</Text>
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
                placeholder="Create a strong password"
                placeholderTextColor="#4B5563"
                secureTextEntry
                onChangeText={setPassword}
                className="bg-fintech-card text-white border border-fintech-border rounded-xl px-4 py-4 text-base focus:border-fintech-cyan"
              />
            </View>

            <TouchableOpacity 
              onPress={onSignUpPress} 
              disabled={loading}
              className="bg-fintech-cyan rounded-xl py-4 items-center justify-center mt-8 active:bg-fintech-cyan/80 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text className="text-black font-black text-lg">Continue</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            <View>
              <Text className="text-gray-400 font-medium mb-2 text-sm uppercase tracking-wider">Verification Code</Text>
              <TextInput
                value={code}
                placeholder="Enter 6-digit code"
                placeholderTextColor="#4B5563"
                onChangeText={setCode}
                keyboardType="number-pad"
                className="bg-fintech-card text-white border border-fintech-border rounded-xl px-4 py-4 text-base focus:border-fintech-cyan text-center tracking-[0.5em]"
              />
            </View>
            <TouchableOpacity 
              onPress={onPressVerify} 
              disabled={loading}
              className="bg-fintech-cyan rounded-xl py-4 items-center justify-center mt-8 active:bg-fintech-cyan/80 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
            >
              {loading ? <ActivityIndicator color="#000" /> : <Text className="text-black font-black text-lg">Verify Email</Text>}
            </TouchableOpacity>
          </View>
        )}

        {!pendingVerification && (
          <View className="flex-row justify-center mt-8">
            <Text className="text-gray-400">Already have an account? </Text>
            <Link href="/sign-in" asChild>
              <TouchableOpacity>
                <Text className="text-fintech-cyan font-bold">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
