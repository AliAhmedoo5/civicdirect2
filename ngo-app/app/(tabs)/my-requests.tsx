import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import CampaignCard from '../../src/components/CampaignCard';

type TabType = 'pending' | 'approved' | 'rejected';

export default function RequestsScreen() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  const fetchRequests = async () => {
    if (!user) return;
    try {
      const { data: ngoData } = await supabase
        .from('ngos')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single();

      if (ngoData) {
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .eq('ngo_id', ngoData.id)
          .order('created_at', { ascending: false });
        
        if (!error && data) setRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests().finally(() => setLoading(false));
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'active': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'fully_funded': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredRequests = requests.filter(req => {
    if (activeTab === 'pending') return req.status === 'pending';
    if (activeTab === 'approved') return req.status === 'active' || req.status === 'fully_funded';
    if (activeTab === 'rejected') return req.status === 'rejected';
    return true;
  });

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B0F19] justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F19]">
      <View className="px-4 pt-6 pb-2">
        <Text className="text-white text-2xl font-bold tracking-tight mb-6">My Requests</Text>
        
        {/* Segmented Control */}
        <View className="flex-row bg-[#111827] p-1 rounded-xl border border-gray-800">
          {(['pending', 'approved', 'rejected'] as TabType[]).map((tab) => (
            <TouchableOpacity 
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 py-2 rounded-lg items-center"
              style={{ backgroundColor: activeTab === tab ? '#2563EB' : 'transparent' }}
            >
              <Text 
                className="font-bold capitalize"
                style={{ color: activeTab === tab ? '#FFFFFF' : '#9CA3AF' }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        <View style={{ paddingBottom: 40 }}>
          {filteredRequests.length === 0 ? (
            <Text className="text-gray-500 text-center py-10 mt-10">
              No {activeTab} requests found.
            </Text>
          ) : (
            filteredRequests.map((req) => (
              <CampaignCard 
                key={req.id} 
                request={req} 
                ngoName={user?.firstName || 'My NGO'} 
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
