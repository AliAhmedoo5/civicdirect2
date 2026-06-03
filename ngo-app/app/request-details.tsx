import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setRequest(data);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B0F19] justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B0F19] justify-center items-center">
        <Text className="text-white text-lg">Request not found.</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 p-3 bg-gray-800 rounded-lg">
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const targetAmount = Number(request.target_amount) || 0;
  const raisedAmount = Number(request.raised_amount) || 0;
  const progress = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;
  const safeProgress = isNaN(progress) ? 0 : Math.min(progress, 100);

  const formatMoney = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const isRejected = request.status === 'rejected';
  const title = request.details?.title || `${(request.request_type || 'General').toUpperCase()} REQUEST`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-yellow-500/20', text: 'text-yellow-500' };
      case 'active': return { bg: 'bg-green-500/20', text: 'text-green-400' };
      case 'fully_funded': return { bg: 'bg-purple-500/20', text: 'text-purple-400' };
      case 'rejected': return { bg: 'bg-red-500/20', text: 'text-red-400' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400' };
    }
  };
  const statusBadge = getStatusBadge(request.status);

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F19]">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-gray-800">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Campaign Details</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Cover Image Section */}
        <View className="relative h-64 w-full bg-gray-800">
          {request.proof_image_url ? (
            <Image 
              source={{ uri: request.proof_image_url }} 
              className="w-full h-full object-cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center opacity-50">
              <Ionicons name="image-outline" size={64} color="#9CA3AF" />
            </View>
          )}
          
          <View className={`absolute top-4 right-4 ${statusBadge.bg} px-3 py-1.5 rounded-full border border-white/5`}>
            <Text className={`${statusBadge.text} text-xs font-black uppercase`}>
              {(request.status || 'unknown').replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View className="p-5">
          <Text className="text-gray-400 text-sm font-bold tracking-widest uppercase mb-2">
            {request.request_type}
          </Text>
          <Text className="text-white text-3xl font-bold mb-6">
            {title}
          </Text>

          {/* Progress Bar Container */}
          {!isRejected && (
            <View className="mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-white font-bold text-lg">Rs. {formatMoney(raisedAmount)}</Text>
                <Text className="text-gray-400 font-medium">raised of Rs. {formatMoney(targetAmount)}</Text>
              </View>
              <View className="h-4 w-full bg-gray-800 rounded-full overflow-hidden">
                <View 
                  className="h-full bg-purple-500 rounded-full" 
                  style={{ width: `${safeProgress}%` }} 
                />
              </View>
            </View>
          )}

          {isRejected && (
            <View className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
              <View className="flex-row items-center mb-2">
                <Ionicons name="close-circle" size={20} color="#F87171" className="mr-2" />
                <Text className="text-red-400 font-bold text-lg">Request Rejected</Text>
              </View>
              <Text className="text-red-300/90 leading-6">
                {request.rejection_reason || "No reason was provided by the administrator."}
              </Text>
            </View>
          )}

          {/* Dynamic Payload Render */}
          <Text className="text-white font-bold text-xl mb-4 mt-4">Details</Text>
          <View className="bg-[#111827] rounded-2xl p-5 border border-gray-800 shadow-xl">
            {Object.keys(request.details || {}).length === 0 ? (
              <Text className="text-gray-500 italic">No additional details provided.</Text>
            ) : (
              Object.entries(request.details).map(([key, value]) => {
                if (key === 'title') return null; // Already shown
                return (
                  <View key={key} className="mb-4 last:mb-0">
                    <Text className="text-gray-400 text-sm uppercase tracking-wider font-medium mb-1">
                      {key.replace(/_/g, ' ')}
                    </Text>
                    <Text className="text-white text-base">
                      {String(value)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
