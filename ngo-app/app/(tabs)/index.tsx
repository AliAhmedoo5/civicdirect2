import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { Link } from 'expo-router';

// Dummy data for the shell
const DUMMY_REQUESTS = [
  { id: '1', type: 'Medical', amount: 5000, status: 'pending', date: '2023-10-27' },
  { id: '2', type: 'Utility', amount: 1200, status: 'active', date: '2023-10-26' },
  { id: '3', type: 'Education', amount: 15000, status: 'fully_funded', date: '2023-10-25' },
];

export default function DashboardScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const checkVerification = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('ngos')
        .select('is_verified')
        .eq('clerk_user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching NGO status:', error);
        setIsVerified(false);
      } else {
        setIsVerified(data?.is_verified || false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    checkVerification().finally(() => setLoading(false));
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkVerification();
    setRefreshing(false);
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'fully_funded': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B0F19] justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F19]">
      <ScrollView 
        className="flex-1 px-4 pt-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        
        {/* Header section */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-gray-400 text-sm font-medium">NGO Dashboard</Text>
            <Text className="text-white text-2xl font-bold tracking-tight">
              {user?.firstName || 'Dashboard'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => signOut()}
            className="bg-[#111827] border border-gray-800 px-4 py-2 rounded-full"
          >
            <Text className="text-gray-300 font-medium text-sm">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {!isVerified ? (
          <View className="flex-1 items-center justify-center mt-20 p-6 bg-[#111827] border border-gray-800 rounded-2xl shadow-lg">
            <Text className="text-yellow-500 text-xl font-bold mb-2">Pending Admin Approval</Text>
            <Text className="text-gray-400 text-center leading-6">
              Your NGO account is currently under review by CivicDirect administrators. You will be able to create campaigns once verified.
            </Text>
          </View>
        ) : (
          <>
            {/* Action button */}
            <Link href="/new-request" asChild>
              <TouchableOpacity className="bg-blue-600 rounded-2xl p-5 mb-10 shadow-lg active:bg-blue-700 items-center">
                <Text className="text-white font-bold text-lg">+ New Request</Text>
              </TouchableOpacity>
            </Link>

            {/* Recent Requests Section */}
            <View className="mb-4">
              <Text className="text-white text-xl font-bold mb-4 tracking-tight">Recent Requests</Text>
              
              <View className="space-y-4">
                {DUMMY_REQUESTS.map((req) => (
                  <View 
                    key={req.id} 
                    className="bg-[#111827] border border-gray-800 p-4 rounded-2xl flex-row justify-between items-center mt-3"
                  >
                    <View>
                      <Text className="text-white font-bold text-lg mb-1">{req.type}</Text>
                      <Text className="text-gray-400">Rs. {req.amount.toLocaleString()}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full border ${getStatusColor(req.status)}`}>
                      <Text className={`text-xs font-bold capitalize ${getStatusColor(req.status).split(' ')[1]}`}>
                        {req.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
