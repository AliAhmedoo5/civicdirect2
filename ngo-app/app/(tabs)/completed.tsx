import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import CampaignCard from '../../src/components/CampaignCard';

export default function CompletedScreen() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

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
          .in('status', ['fully_funded', 'disbursed'])
          .order('created_at', { ascending: false });
        
        if (!error && data) setRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRequests().finally(() => setLoading(false));

    // Realtime subscription
    const channel = supabase
      .channel(`ngo-completed-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload) => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  }, [user]);

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
        <Text className="text-white text-2xl font-bold tracking-tight mb-2">Completed</Text>
        <Text className="text-gray-400 text-sm mb-6">Fully funded and disbursed campaigns.</Text>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        <View style={{ paddingBottom: 40 }}>
          {requests.length === 0 ? (
            <Text className="text-gray-500 text-center py-10 mt-10">
              No completed campaigns found.
            </Text>
          ) : (
            requests.map((req) => (
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
