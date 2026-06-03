import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { supabase } from '../lib/supabase';

interface CampaignCardProps {
  request: any;
  ngoName?: string;
}

export default function CampaignCard({ request: req, ngoName = 'My NGO' }: CampaignCardProps) {
  const targetAmount = Number(req.target_amount) || 0;
  const raisedAmount = Number(req.raised_amount) || 0;
  const progress = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;
  const safeProgress = isNaN(progress) ? 0 : Math.min(progress, 100);
  const [backersCount, setBackersCount] = React.useState(0);

  React.useEffect(() => {
    const fetchBackers = async () => {
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', req.id);
      
      if (count !== null) setBackersCount(count);
    };
    fetchBackers();
  }, [req.id, req.raised_amount]);

  // Safe number formatter to replace toLocaleString() which crashes on some Hermes engines
  const formatMoney = (amount: number) => {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const isRejected = req.status === 'rejected';

  // Status mapping for the top-right indicator (since NGOs need to know status)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-yellow-500/20', text: 'text-yellow-500' };
      case 'active': return { bg: 'bg-green-500/20', text: 'text-green-400' };
      case 'fully_funded': return { bg: 'bg-purple-500/20', text: 'text-purple-400' };
      case 'rejected': return { bg: 'bg-red-500/20', text: 'text-red-400' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400' };
    }
  };

  const statusBadge = getStatusBadge(req.status);

  // Fallback title if old records don't have details.title
  const title = req.details?.title || `${(req.request_type || 'General').toUpperCase()} REQUEST`;

  return (
    <View className="bg-[#111827] rounded-3xl overflow-hidden mb-5 border border-gray-800 shadow-xl">
      {/* Cover Image Section */}
      <View className="relative h-48 w-full bg-gray-800">
        {req.proof_image_url ? (
          <Image 
            source={{ uri: req.proof_image_url }} 
            className="w-full h-full object-cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center opacity-50">
            <Ionicons name="image-outline" size={48} color="#9CA3AF" />
          </View>
        )}
        
        {/* Category Badge overlay (Top Left) */}
        <View className="absolute top-4 left-4 bg-emerald-900/90 px-3 py-1.5 rounded-full border border-emerald-700/50">
          <Text className="text-emerald-300 text-xs font-black uppercase tracking-wider">
            CATEGORY: {req.request_type || 'OTHER'}
          </Text>
        </View>

        {/* Status Badge overlay (Top Right) */}
        <View className={`absolute top-4 right-4 ${statusBadge.bg} px-3 py-1.5 rounded-full border border-white/5`}>
          <Text className={`${statusBadge.text} text-xs font-black uppercase`}>
            {(req.status || 'unknown').replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Content Section */}
      <View className="p-5">
        <Text className="text-white text-2xl font-bold mb-4" numberOfLines={2}>
          {title}
        </Text>

        {/* Progress Bar Container - Hidden if Rejected */}
        {!isRejected && (
          <View className="mb-4">
            <View className="h-3 w-full bg-gray-800 rounded-full overflow-hidden">
              <View 
                className="h-full bg-purple-500 rounded-full" 
                style={{ width: `${safeProgress}%` }} 
              />
            </View>
          </View>
        )}

        {/* Stats Row */}
        <View className="flex-row justify-between items-center mb-5">
          {!isRejected ? (
            <View>
              <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Raised</Text>
              <Text className="text-white text-lg font-bold">Rs. {formatMoney(raisedAmount)}</Text>
            </View>
          ) : (
            <View>
              <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Status</Text>
              <Text className="text-red-400 text-lg font-bold">Denied by Admin</Text>
            </View>
          )}
          <View className="items-end">
            <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
              Goal: Rs. {formatMoney(targetAmount)}
            </Text>
            {!isRejected && (
              <Text className="text-gray-500 text-xs">
                {safeProgress.toFixed(0)}% funded
              </Text>
            )}
          </View>
        </View>

        {/* Organizer Row */}
        <View className="flex-row items-center mb-5">
          <View className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center mr-3 border border-gray-700">
            <Ionicons name="business-outline" size={16} color="#9CA3AF" />
          </View>
          <Text className="text-gray-400 text-sm">
            Organized by: <Text className="text-gray-200 font-bold">{ngoName}</Text>
          </Text>
        </View>

        {/* Bottom Actions Row */}
        <View className="flex-row items-center justify-between mt-2">
          <Link href={`/request-details?id=${req.id}`} asChild>
            <TouchableOpacity className="flex-1 bg-purple-600 rounded-2xl py-4 items-center justify-center active:bg-purple-700 shadow-lg shadow-purple-500/20">
              <Text className="text-white font-bold text-base">View Details</Text>
            </TouchableOpacity>
          </Link>
          
          <View className="ml-5 items-center">
            <Text className="text-white text-lg font-bold">{backersCount}</Text>
            <Text className="text-gray-500 text-xs uppercase tracking-wider">Backers</Text>
          </View>
        </View>

        {/* Rejection Alert */}
        {req.status === 'rejected' && req.rejection_reason && (
          <View className="mt-5 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
            <View className="flex-row items-center mb-1">
              <Ionicons name="warning" size={16} color="#F87171" className="mr-2" />
              <Text className="text-red-400 text-xs font-bold ml-1">REJECTION REASON</Text>
            </View>
            <Text className="text-red-300/80 text-sm mt-1 leading-5">{req.rejection_reason}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
