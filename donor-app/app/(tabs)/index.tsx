import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter, Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Component for rendering a premium Campaign Card in the Feed
function DonorCampaignCard({ request }: { request: any }) {
  const targetAmount = Number(request.target_amount) || 0;
  const raisedAmount = Number(request.raised_amount) || 0;
  const progress = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;
  const safeProgress = isNaN(progress) ? 0 : Math.min(progress, 100);

  let daysLeft = 0;
  if (request.deadline) {
    daysLeft = Math.max(0, Math.ceil((new Date(request.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  const formatMoney = (amount: number) => amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  
  const title = request.details?.title || `${(request.request_type || 'Campaign').toUpperCase()}`;
  const ngoName = request.ngos?.name || 'Verified NGO';

  return (
    <View className="bg-fintech-card rounded-3xl overflow-hidden mb-6 border border-fintech-border shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
      {/* Image Header */}
      <View className="relative h-48 w-full bg-black">
        {request.proof_image_url ? (
          <Image source={{ uri: request.proof_image_url }} className="w-full h-full object-cover opacity-80" />
        ) : (
          <View className="w-full h-full items-center justify-center opacity-50">
            <Ionicons name="image-outline" size={48} color="#4B5563" />
          </View>
        )}
        
        {/* Urgency Badge */}
        {(request.urgency_level === 'critical' || request.urgency_level === 'high') && (
          <View className={`absolute top-4 left-4 px-3 py-1.5 rounded-full border shadow-[0_0_10px_rgba(239,68,68,0.5)] ${request.urgency_level === 'critical' ? 'bg-red-500/90 border-red-400' : 'bg-yellow-500/90 border-yellow-400'}`}>
            <Text className="text-white text-xs font-black uppercase tracking-wider">{request.urgency_level}</Text>
          </View>
        )}

        {/* Deadline Badge */}
        {request.deadline && (
          <View className="absolute top-4 right-4 bg-black/80 px-3 py-1.5 rounded-full border border-gray-700">
            <Text className="text-gray-300 text-xs font-bold">{daysLeft} days left</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-5">
        <Text className="text-white text-xl font-bold mb-2 leading-tight" numberOfLines={2}>
          {title}
        </Text>
        
        <View className="flex-row items-center mb-5">
          <Ionicons name="shield-checkmark" size={14} color="#10B981" />
          <Text className="text-gray-400 text-xs ml-1">Verified by <Text className="text-fintech-cyan font-bold">{ngoName}</Text></Text>
        </View>

        {/* Glowing Progress Bar */}
        <View className="mb-4">
          <View className="h-2.5 w-full bg-[#0A0E17] rounded-full overflow-hidden border border-gray-800">
            <View 
              className="h-full bg-fintech-cyan rounded-full" 
              style={{ width: `${safeProgress}%`, shadowColor: '#06B6D4', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 5, elevation: 5 }} 
            />
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-between items-end mb-6">
          <View>
            <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Raised</Text>
            <Text className="text-white text-xl font-bold">Rs. {formatMoney(raisedAmount)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Goal</Text>
            <Text className="text-gray-300 text-sm font-medium">Rs. {formatMoney(targetAmount)}</Text>
          </View>
        </View>

        {/* Donate Button */}
        <Link href={`/campaign/${request.id}`} asChild>
          <TouchableOpacity className="w-full bg-fintech-cyan/10 border border-fintech-cyan/50 rounded-2xl py-4 items-center justify-center active:bg-fintech-cyan/20">
            <Text className="text-fintech-cyan font-black text-base uppercase tracking-widest">Donate Now</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *,
          ngos ( name, is_verified )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCampaigns();
    }, [])
  );

  useEffect(() => {
    // Subscribe to realtime changes on the requests table
    // Append Date.now() to prevent "cannot add callbacks after subscribe" error during hot-reloads
    const channel = supabase
      .channel(`requests-feed-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        (payload) => {
          // Whenever a request is updated (e.g. fully_funded, or raised_amount changes),
          // refetch the feed to instantly reflect changes.
          fetchCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCampaigns();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-fintech-dark" edges={['top', 'left', 'right']}>
      
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-fintech-border">
        <View>
          <Text className="text-fintech-cyan font-bold text-xs tracking-[0.2em] uppercase mb-1">CivicDirect</Text>
          <Text className="text-white text-2xl font-bold">Discover</Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity className="w-10 h-10 rounded-full bg-fintech-card items-center justify-center border border-fintech-border">
            <Ionicons name="filter" size={20} color="#06B6D4" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={async () => {
              await signOut();
              router.replace('/');
            }} 
            className="w-10 h-10 rounded-full bg-fintech-card items-center justify-center border border-fintech-border"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#06B6D4" />
        </View>
      ) : (
        <FlatList
          data={campaigns}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <DonorCampaignCard request={item} />}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06B6D4" />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="leaf-outline" size={64} color="#1F2937" />
              <Text className="text-gray-400 mt-4 text-center">No active campaigns right now.{'\n'}Check back later!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
