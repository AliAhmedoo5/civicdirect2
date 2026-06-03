import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../src/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditRequestModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useUser();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialFetchLoading, setInitialFetchLoading] = useState(true);

  // Form Data
  const [requestType, setRequestType] = useState('Medical');
  const [targetAmount, setTargetAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Image State
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('requests')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Request not found');

        // Can only edit pending or rejected
        if (data.status !== 'pending' && data.status !== 'rejected') {
          Alert.alert('Cannot Edit', 'Only pending or rejected requests can be edited.');
          router.back();
          return;
        }

        setRequestType(data.request_type.charAt(0).toUpperCase() + data.request_type.slice(1));
        setTargetAmount(data.target_amount ? data.target_amount.toString() : '');
        setTitle(data.details?.title || '');
        setDescription(data.details?.description || '');
        setOriginalImageUrl(data.proof_image_url);

      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load campaign details.');
        router.back();
      } finally {
        setInitialFetchLoading(false);
      }
    };

    fetchRequest();
  }, [id]);

  const pickImage = async (useCamera = false) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.7,
      base64: true,
    };

    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera permissions to make this work!');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const updateCampaign = async () => {
    if (!user) return;
    if (!originalImageUrl && !imageUri) {
      Alert.alert('Please provide a proof image.');
      return;
    }
    if (!targetAmount || isNaN(Number(targetAmount))) {
      Alert.alert('Please provide a valid target amount.');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = originalImageUrl;

      // 1. Upload new Image if provided
      if (imageBase64) {
        const fileName = `edit-${id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('campaign-proofs')
          .upload(fileName, decode(imageBase64), {
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('campaign-proofs')
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      // 2. Update Request Record and reset status to 'pending'
      const { error: updateError } = await supabase
        .from('requests')
        .update({
          request_type: requestType.toLowerCase(),
          target_amount: Number(targetAmount),
          proof_image_url: finalImageUrl,
          details: { title, description },
          status: 'pending' // Admin must re-review
        })
        .eq('id', id);

      if (updateError) throw updateError;

      Alert.alert('Success!', 'Campaign updated and submitted for re-review.');
      
      // Navigate to top level tabs instead of back, because back might show stale data in the detail modal until re-fetched
      // Actually, router.dismissAll() or router.replace('/') is better
      router.dismissAll();
      router.replace('/');

    } catch (err: any) {
      console.error(err);
      Alert.alert('Update Failed', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (initialFetchLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B0F19] justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }

  // Which image to display? The newly selected one, or the existing one?
  const displayImageUri = imageUri || originalImageUrl;

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F19]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-8 mt-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-500 text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white font-bold text-xl">Edit: Step {step} of 3</Text>
            <View className="w-12" />
          </View>

          {step === 1 && (
            <View className="space-y-6 mt-4">
              <Text className="text-white text-3xl font-bold tracking-tight mb-2">Campaign Basics</Text>
              
              <View>
                <Text className="text-gray-300 font-medium mb-2">Category</Text>
                <View className="flex-row gap-2">
                  {['Medical', 'Education', 'Utility'].map(cat => (
                    <TouchableOpacity 
                      key={cat}
                      onPress={() => setRequestType(cat)}
                      className={`px-4 py-3 rounded-full border ${requestType === cat ? 'bg-blue-600 border-blue-500' : 'bg-[#111827] border-gray-800'}`}
                    >
                      <Text className={requestType === cat ? 'text-white font-bold' : 'text-gray-400 font-medium'}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="mt-6">
                <Text className="text-gray-300 font-medium mb-2">Target Amount (PKR)</Text>
                <TextInput
                  value={targetAmount}
                  placeholder="e.g. 50000"
                  placeholderTextColor="#4B5563"
                  keyboardType="numeric"
                  onChangeText={setTargetAmount}
                  className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-2xl font-bold focus:border-blue-500"
                />
              </View>

              <TouchableOpacity onPress={() => setStep(2)} className="bg-blue-600 rounded-xl py-4 items-center justify-center mt-10 active:bg-blue-700">
                <Text className="text-white font-bold text-lg">Next Step</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View className="space-y-6 mt-4">
              <Text className="text-white text-3xl font-bold tracking-tight mb-2">Campaign Details</Text>
              
              <View>
                <Text className="text-gray-300 font-medium mb-2">Title</Text>
                <TextInput
                  value={title}
                  placeholder={
                    requestType === 'Medical' ? 'e.g. Heart Surgery for Ali' :
                    requestType === 'Education' ? 'e.g. School Fees for Ahmed' :
                    'e.g. Electricity Bill for Widow'
                  }
                  placeholderTextColor="#4B5563"
                  onChangeText={setTitle}
                  className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500"
                />
              </View>

              <View className="mt-4">
                <Text className="text-gray-300 font-medium mb-2">Description</Text>
                <TextInput
                  value={description}
                  placeholder={
                    requestType === 'Medical' ? 'Provide context about the medical emergency, hospital, etc...' :
                    requestType === 'Education' ? 'Provide context about the school, grade, student needs...' :
                    'Provide context about the overdue bill, family situation...'
                  }
                  placeholderTextColor="#4B5563"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  onChangeText={setDescription}
                  className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500 h-32"
                />
              </View>

              <View className="flex-row gap-4 mt-10">
                <TouchableOpacity onPress={() => setStep(1)} className="flex-1 bg-[#111827] border border-gray-800 rounded-xl py-4 items-center justify-center active:bg-gray-800">
                  <Text className="text-white font-bold text-lg">Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(3)} className="flex-1 bg-blue-600 rounded-xl py-4 items-center justify-center active:bg-blue-700">
                  <Text className="text-white font-bold text-lg">Next</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {step === 3 && (
            <View className="space-y-6 mt-4">
              <Text className="text-white text-3xl font-bold tracking-tight mb-2">Proof Document</Text>
              <Text className="text-gray-400">Keep the existing image, or upload a new one.</Text>
              
              {displayImageUri ? (
                <View className="mt-4 border-2 border-dashed border-gray-700 rounded-2xl overflow-hidden relative h-64">
                  <Image source={{ uri: displayImageUri }} className="w-full h-full object-cover" />
                  <TouchableOpacity 
                    onPress={() => {
                      setImageUri(null);
                      setOriginalImageUrl(null);
                    }}
                    className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-full"
                  >
                    <Text className="text-white text-xs font-bold">Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="mt-4 flex-row gap-4">
                  <TouchableOpacity onPress={() => pickImage(true)} className="flex-1 bg-[#111827] border border-gray-800 rounded-2xl h-48 items-center justify-center active:bg-gray-800 border-dashed">
                    <Text className="text-3xl mb-2">📸</Text>
                    <Text className="text-blue-500 font-bold">Take Photo</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={() => pickImage(false)} className="flex-1 bg-[#111827] border border-gray-800 rounded-2xl h-48 items-center justify-center active:bg-gray-800 border-dashed">
                    <Text className="text-3xl mb-2">🖼️</Text>
                    <Text className="text-blue-500 font-bold">Choose Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View className="flex-row gap-4 mt-10">
                <TouchableOpacity onPress={() => setStep(2)} disabled={loading} className="flex-1 bg-[#111827] border border-gray-800 rounded-xl py-4 items-center justify-center active:bg-gray-800">
                  <Text className="text-white font-bold text-lg">Back</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={updateCampaign} disabled={loading || !displayImageUri} className={`flex-[2] rounded-xl py-4 items-center justify-center flex-row ${displayImageUri ? 'bg-green-600 active:bg-green-700' : 'bg-gray-800'}`}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Save Changes</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
