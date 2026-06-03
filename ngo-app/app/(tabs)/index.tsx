import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { Link } from 'expo-router';
import CampaignCard from '../../src/components/CampaignCard';

// Remove dummy data

export default function DashboardScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  const checkVerification = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('ngos')
        .select('id, is_verified')
        .eq('clerk_user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching NGO status:', error);
        setIsVerified(false);
      } else {
        setIsVerified(data?.is_verified || false);
        if (data?.is_verified) {
          fetchRecentRequests(data.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecentRequests = async (ngoId: string) => {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('ngo_id', ngoId)
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (!error && data) setRequests(data);
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
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-xl font-bold tracking-tight">Recent Requests</Text>
                <Link href="/my-requests" asChild>
                  <TouchableOpacity>
                    <Text className="text-blue-400 font-medium">View All</Text>
                  </TouchableOpacity>
                </Link>
              </View>
              
              <View style={{ paddingBottom: 40 }}>
                {requests.filter(req => req.status !== 'rejected').length === 0 ? (
                  <Text className="text-gray-500 text-center py-4">No requests found. Create one above!</Text>
                ) : (
                  requests.filter(req => req.status !== 'rejected').map((req) => (
                    <CampaignCard 
                      key={req.id} 
                      request={req} 
                      ngoName={user?.firstName || 'My NGO'} 
                    />
                  ))
                )}
              </View>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
