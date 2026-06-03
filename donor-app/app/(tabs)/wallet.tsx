import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../src/lib/supabase';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { useRouter } from 'expo-router';

export default function WalletScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpModalVisible, setTopUpModalVisible] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('easypaisa');

  const fetchWallet = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('donors')
        .select('wallet_balance')
        .eq('clerk_user_id', user.id)
        .single();

      if (error) throw error;
      setBalance(data.wallet_balance || 0);
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, [user])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWallet();
  }, [user]);

  const handleTopUp = async () => {
    if (!user) return;
    
    const amount = parseInt(topUpAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setTopUpLoading(true);
    try {
      // Simulate payment gateway delay
      await new Promise(res => setTimeout(res, 1500));

      const newBalance = balance + amount;
      const { error } = await supabase
        .from('donors')
        .update({ wallet_balance: newBalance })
        .eq('clerk_user_id', user.id);

      if (error) throw error;
      
      setBalance(newBalance);
      setTopUpModalVisible(false);
      setTopUpAmount('');
      Alert.alert('Top Up Successful', `Rs. ${formatMoney(amount)} has been added to your wallet via ${paymentMethod === 'easypaisa' ? 'EasyPaisa' : paymentMethod === 'jazzcash' ? 'JazzCash' : 'Bank Transfer'}.`);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Top Up Failed', err.message);
    } finally {
      setTopUpLoading(false);
    }
  };

  const formatMoney = (amount: number) => amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    <SafeAreaView className="flex-1 bg-fintech-dark" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-fintech-border">
        <View>
          <Text className="text-white text-2xl font-bold">Wallet</Text>
        </View>
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

      <ScrollView 
        contentContainerStyle={{ padding: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06B6D4" />}
      >
        {/* Balance Card */}
        <View className="bg-fintech-card rounded-3xl p-6 border border-fintech-border shadow-[0_10px_30px_rgba(6,182,212,0.15)] relative overflow-hidden">
          <View className="absolute -right-10 -top-10 w-40 h-40 bg-fintech-cyan/10 rounded-full blur-2xl" />
          
          <Text className="text-gray-400 font-medium mb-1 uppercase tracking-wider text-xs">Available Balance</Text>
          
          {loading ? (
            <ActivityIndicator size="small" color="#06B6D4" className="my-4 self-start" />
          ) : (
            <View className="flex-row items-end mt-2">
              <Text className="text-fintech-cyan text-2xl font-bold mr-1 pb-1">Rs.</Text>
              <Text className="text-white text-5xl font-black tracking-tight">{formatMoney(balance)}</Text>
            </View>
          )}

          <View className="mt-8 flex-row gap-4">
            <TouchableOpacity 
              onPress={() => setTopUpModalVisible(true)}
              className="flex-1 bg-fintech-cyan rounded-2xl py-4 items-center justify-center flex-row shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            >
              <Ionicons name="add-circle" size={20} color="black" className="mr-2" />
              <Text className="text-black font-black text-sm uppercase tracking-wider ml-1">Top Up</Text>
            </TouchableOpacity>

            <View className="flex-1 bg-[#0A0E17] border border-fintech-border rounded-2xl py-4 items-center justify-center flex-row opacity-50">
              <Ionicons name="arrow-down" size={20} color="#4B5563" className="mr-2" />
              <Text className="text-gray-400 font-bold text-sm uppercase tracking-wider ml-1">Withdraw</Text>
            </View>
          </View>
        </View>

        {/* Mock Transaction History Header */}
        <View className="mt-10">
          <Text className="text-white text-lg font-bold mb-4">Recent Activity</Text>
          <View className="bg-fintech-card rounded-2xl p-6 border border-fintech-border items-center justify-center py-10">
            <Ionicons name="receipt-outline" size={48} color="#1F2937" />
            <Text className="text-gray-500 mt-4 font-medium text-center">Your donation history will appear here.</Text>
          </View>
        </View>

      </ScrollView>

      {/* Top Up Modal */}
      <Modal
        visible={topUpModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTopUpModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-fintech-dark rounded-t-3xl p-6 border-t border-fintech-border shadow-[0_-10px_30px_rgba(6,182,212,0.1)]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-white text-2xl font-bold tracking-tight">Top Up Wallet</Text>
              <TouchableOpacity onPress={() => setTopUpModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-400 font-medium mb-3 text-sm uppercase tracking-wider">Payment Method</Text>
            <View className="flex-row gap-3 mb-6">
              {[
                { id: 'easypaisa', label: 'EasyPaisa' },
                { id: 'jazzcash', label: 'JazzCash' },
                { id: 'bank', label: 'Bank' },
              ].map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => setPaymentMethod(method.id)}
                  className={`flex-1 py-3 rounded-xl border items-center justify-center ${paymentMethod === method.id ? 'bg-fintech-cyan/20 border-fintech-cyan' : 'bg-fintech-card border-fintech-border'}`}
                >
                  <Text className={paymentMethod === method.id ? 'text-fintech-cyan font-bold' : 'text-gray-400 font-medium'}>
                    {method.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-gray-400 font-medium mb-3 text-sm uppercase tracking-wider">Amount (Rs)</Text>
            <View className="mb-8">
              <TextInput
                value={topUpAmount}
                onChangeText={setTopUpAmount}
                placeholder="e.g. 5000"
                placeholderTextColor="#4B5563"
                keyboardType="numeric"
                className="bg-fintech-card text-white border border-fintech-border rounded-xl px-4 py-4 text-2xl font-bold text-center focus:border-fintech-cyan"
              />
              <View className="flex-row gap-2 mt-3">
                {[500, 1000, 5000].map(amt => (
                  <TouchableOpacity
                    key={amt}
                    onPress={() => setTopUpAmount(amt.toString())}
                    className="flex-1 py-2 bg-fintech-card border border-fintech-border rounded-lg items-center"
                  >
                    <Text className="text-gray-400 font-medium">+ {amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleTopUp}
              disabled={topUpLoading}
              className="bg-fintech-cyan rounded-xl py-4 items-center justify-center active:bg-fintech-cyan/80 shadow-[0_0_15px_rgba(6,182,212,0.4)] mb-4"
            >
              {topUpLoading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text className="text-black font-black text-lg">Confirm Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
