import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

export default function DonationScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();

  const [campaign, setCampaign] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmountText, setCustomAmountText] = useState<string>('');

  const fetchDetails = async () => {
    if (!user || !id) return;
    try {
      // Fetch Campaign
      const { data: reqData, error: reqError } = await supabase
        .from('requests')
        .select('*, ngos(name)')
        .eq('id', id)
        .single();
      if (reqError) throw reqError;
      setCampaign(reqData);

      // Fetch Wallet Balance
      const { data: donorData, error: donorError } = await supabase
        .from('donors')
        .select('wallet_balance')
        .eq('clerk_user_id', user.id)
        .single();
      if (donorError) throw donorError;
      setWalletBalance(donorData.wallet_balance || 0);

    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load details.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();

    // Subscribe to realtime changes for THIS specific campaign
    // Append Date.now() to prevent "cannot add callbacks after subscribe" error during hot-reloads
    const channel = supabase
      .channel(`campaign-${id}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests', filter: `id=eq.${id}` },
        (payload) => {
          // Update the local campaign state with the newly raised amount
          setCampaign((prev: any) => ({
            ...prev,
            ...payload.new
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  const handleDonate = async () => {
    if (!user || !campaign) return;

    if (selectedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid donation amount.');
      return;
    }

    if (walletBalance < selectedAmount) {
      Alert.alert(
        'Insufficient Funds', 
        'You need to top up your wallet to make this donation.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Top Up Now', onPress: () => router.push('/(tabs)/wallet') }
        ]
      );
      return;
    }

    const remainingGoal = campaign.target_amount - (campaign.raised_amount || 0);
    if (selectedAmount > remainingGoal) {
      Alert.alert('Amount too high', `This campaign only needs Rs. ${remainingGoal} to be fully funded!`);
      return;
    }

    setDonating(true);
    try {
      // 1. Get Donor ID (Internal UUID, not clerk ID)
      const { data: donorData } = await supabase
        .from('donors')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single();

      if (!donorData) throw new Error('Donor profile not found.');

      // 2. Call the RPC to process donation atomically
      const { error: rpcError } = await supabase.rpc('process_donation', {
        p_amount: selectedAmount,
        p_donor_id: donorData.id,
        p_request_id: campaign.id
      });

      if (rpcError) throw rpcError;

      Alert.alert('Thank You!', `You successfully donated Rs. ${selectedAmount} to this cause!`, [
        { text: 'Awesome', onPress: () => router.back() }
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Donation Failed', err.message);
    } finally {
      setDonating(false);
    }
  };

  const formatMoney = (amount: number) => amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  if (loading || !campaign) {
    return (
      <SafeAreaView className="flex-1 bg-fintech-dark justify-center items-center">
        <ActivityIndicator size="large" color="#06B6D4" />
      </SafeAreaView>
    );
  }

  const title = campaign.details?.title || `${(campaign.request_type || 'Campaign').toUpperCase()}`;
  const target = Number(campaign.target_amount) || 0;
  const raised = Number(campaign.raised_amount) || 0;
  const remaining = target - raised;
  const progress = target > 0 ? (raised / target) * 100 : 0;

  let daysLeft = 0;
  if (campaign.deadline) {
    daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <SafeAreaView className="flex-1 bg-fintech-dark">
      <ScrollView className="flex-1">
        {/* Header Image */}
        <View className="h-64 w-full bg-black relative">
          {campaign.proof_image_url ? (
            <Image source={{ uri: campaign.proof_image_url }} className="w-full h-full object-cover opacity-70" />
          ) : (
            <View className="w-full h-full items-center justify-center opacity-30">
              <Ionicons name="image" size={64} color="#4B5563" />
            </View>
          )}
          <TouchableOpacity 
            onPress={() => router.back()}
            className="absolute top-6 left-6 w-10 h-10 bg-black/50 rounded-full items-center justify-center backdrop-blur-md"
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View className="p-6 -mt-10 bg-fintech-dark rounded-t-[40px]">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-fintech-cyan text-xs font-bold uppercase tracking-[0.2em]">{campaign.request_type}</Text>
            
            <View className="flex-row gap-2">
              {campaign.deadline && (
                <View className="bg-gray-800 px-2 py-1 rounded-md border border-gray-700">
                  <Text className="text-gray-300 text-[10px] font-bold">{daysLeft} DAYS LEFT</Text>
                </View>
              )}
              {(campaign.urgency_level === 'critical' || campaign.urgency_level === 'high') && (
                <View className={`px-2 py-1 rounded-md border ${campaign.urgency_level === 'critical' ? 'bg-red-500/20 border-red-500' : 'bg-yellow-500/20 border-yellow-500'}`}>
                  <Text className={`text-[10px] font-bold uppercase ${campaign.urgency_level === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {campaign.urgency_level}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <Text className="text-white text-2xl font-bold mb-4">{title}</Text>
          
          <Text className="text-gray-400 leading-6 mb-6">
            {campaign.details?.description || 'No description provided by the NGO.'}
          </Text>

          {/* Progress Box */}
          <View className="bg-fintech-card rounded-2xl p-5 border border-fintech-border mb-6">
            <View className="flex-row justify-between items-end mb-3">
              <View>
                <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Raised</Text>
                <Text className="text-white text-lg font-bold">Rs. {formatMoney(raised)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Goal</Text>
                <Text className="text-gray-400 font-medium">Rs. {formatMoney(target)}</Text>
              </View>
            </View>
            <View className="h-2 w-full bg-[#0A0E17] rounded-full overflow-hidden">
              <View className="h-full bg-fintech-cyan rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
            </View>
            <Text className="text-fintech-cyan text-xs font-bold text-center mt-3 uppercase tracking-wider">
              {progress.toFixed(0)}% Funded • Rs. {formatMoney(remaining)} Remaining
            </Text>
          </View>

          {/* Wallet Balance */}
          <View className="flex-row justify-between items-center mb-4 px-2">
            <Text className="text-gray-400 font-medium">Your Wallet Balance</Text>
            <Text className={`font-bold ${walletBalance < selectedAmount ? 'text-red-400' : 'text-fintech-green'}`}>
              Rs. {formatMoney(walletBalance)}
            </Text>
          </View>

          {/* Quick Select Amounts */}
          <Text className="text-white font-bold text-lg mb-3">Select Amount (Rs)</Text>
          <View className="flex-row gap-3 mb-4">
            {[100, 500, 1000].map(amt => (
              <TouchableOpacity
                key={amt}
                onPress={() => {
                  setSelectedAmount(amt);
                  setCustomAmountText('');
                }}
                className={`flex-1 py-4 rounded-xl items-center border ${selectedAmount === amt && !customAmountText ? 'bg-fintech-cyan/20 border-fintech-cyan' : 'bg-fintech-card border-fintech-border'}`}
              >
                <Text className={selectedAmount === amt && !customAmountText ? 'text-fintech-cyan font-bold' : 'text-gray-400 font-medium'}>
                  {formatMoney(amt)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-gray-400 font-medium mb-2 text-sm uppercase tracking-wider">Or enter custom amount</Text>
          <TextInput
            value={customAmountText}
            onChangeText={(val) => {
              setCustomAmountText(val);
              const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
              setSelectedAmount(isNaN(parsed) ? 0 : parsed);
            }}
            placeholder="e.g. 2500"
            placeholderTextColor="#4B5563"
            keyboardType="numeric"
            className="bg-fintech-card text-white border border-fintech-border rounded-xl px-4 py-4 text-xl font-bold focus:border-fintech-cyan mb-8"
          />
        </View>
      </ScrollView>

      {/* Floating Donate Button */}
      <View className="p-6 pt-2 bg-fintech-dark border-t border-fintech-border/50">
        <TouchableOpacity 
          onPress={handleDonate}
          disabled={donating}
          className={`rounded-2xl py-5 items-center justify-center flex-row shadow-[0_0_20px_rgba(6,182,212,0.3)] ${donating ? 'bg-fintech-cyan/50' : 'bg-fintech-cyan active:bg-fintech-cyan/80'}`}
        >
          {donating ? <ActivityIndicator color="#000" /> : (
            <Text className="text-black font-black text-lg uppercase tracking-wider">
              Donate Rs. {formatMoney(selectedAmount)}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
