import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../src/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewRequestModal() {
  const router = useRouter();
  const { user } = useUser();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [requestType, setRequestType] = useState('Medical');
  const [targetAmount, setTargetAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const pickImage = async (useCamera = false) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: false, // Disabled to prevent native crop UI issues
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

  const submitCampaign = async () => {
    if (!user) return;
    if (!imageUri || !imageBase64) {
      Alert.alert('Please provide a proof image.');
      return;
    }
    if (!targetAmount || isNaN(Number(targetAmount))) {
      Alert.alert('Please provide a valid target amount.');
      return;
    }

    setLoading(true);
    try {
      // 1. Get NGO ID
      const { data: ngoData, error: ngoError } = await supabase
        .from('ngos')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single();

      if (ngoError || !ngoData) throw new Error('Could not find verified NGO record.');

      const ngoId = ngoData.id;

      // 2. Upload Image to Supabase Storage
      const fileName = `${ngoId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('campaign-proofs')
        .upload(fileName, decode(imageBase64), {
          contentType: 'image/jpeg',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('campaign-proofs')
        .getPublicUrl(fileName);

      const proofUrl = publicUrlData.publicUrl;

      // 3. Insert Request Record
      const { error: insertError } = await supabase.from('requests').insert({
        ngo_id: ngoId,
        request_type: requestType.toLowerCase(),
        target_amount: Number(targetAmount),
        proof_image_url: proofUrl,
        details: { title, description },
        status: 'pending' // Admin must review
      });

      if (insertError) throw insertError;

      Alert.alert('Success!', 'Your campaign has been submitted for review.');
      router.back();

    } catch (err: any) {
      console.error(err);
      Alert.alert('Submission Failed', err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0B0F19]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="px-6 py-4">
          <View className="flex-row justify-between items-center mb-8 mt-4">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-500 text-lg">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white font-bold text-xl">Step {step} of 3</Text>
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
              <Text className="text-white text-3xl font-bold tracking-tight mb-2">Upload Proof</Text>
              <Text className="text-gray-400">Capture a photo of the bill, prescription, or relevant document.</Text>
              
              {imageUri ? (
                <View className="mt-4 border-2 border-dashed border-gray-700 rounded-2xl overflow-hidden relative h-64">
                  <Image source={{ uri: imageUri }} className="w-full h-full object-cover" />
                  <TouchableOpacity 
                    onPress={() => setImageUri(null)}
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
                <TouchableOpacity onPress={submitCampaign} disabled={loading || !imageUri} className={`flex-[2] rounded-xl py-4 items-center justify-center flex-row ${imageUri ? 'bg-green-600 active:bg-green-700' : 'bg-gray-800'}`}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Submit Campaign</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
