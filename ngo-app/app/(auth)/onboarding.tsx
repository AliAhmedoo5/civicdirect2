import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { supabase } from '../../src/lib/supabase';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export default function OnboardingScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [name, setName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [cityZone, setCityZone] = useState('');
  const [documentUri, setDocumentUri] = useState<string | null>(null);
  const [documentBase64, setDocumentBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        if (Platform.OS === 'web') {
          const f = file.file;
          if (!f) throw new Error('No file object available on web');
          
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const base64 = dataUrl.split(',')[1];
            setDocumentUri(file.uri);
            setDocumentBase64(base64);
          };
          reader.readAsDataURL(f);
        } else {
          const base64 = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.Base64 });
          setDocumentUri(file.uri);
          setDocumentBase64(base64);
        }
      }
    } catch (err: any) {
      console.log(err);
      alert('Failed to pick document: ' + (err.message || JSON.stringify(err)));
    }
  };

  const onSubmit = async () => {
    if (!name || !registrationNumber || !cityZone || !documentBase64) {
      alert('Please fill out all fields and upload your registration PDF.');
      return;
    }

    if (!user) {
      alert('User session not found.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload PDF
      const fileName = `${user.id}-${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, decode(documentBase64), { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const docUrl = publicUrlData.publicUrl;

      // 2. Insert NGO
      const { error } = await supabase.from('ngos').insert({
        clerk_user_id: user.id,
        name,
        registration_number: registrationNumber,
        city_zone: cityZone,
        verification_document_url: docUrl,
        is_verified: false,
      });

      if (error) {
        console.error('Supabase Insert Error:', error);
        alert(error.message || 'Failed to save NGO details.');
        return;
      }

      // Automatically go to tabs where it will show "Pending Admin Approval"
      router.replace('/(tabs)');
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0B0F19] justify-center px-6"
    >
      <View className="mb-10">
        <Text className="text-white text-4xl font-bold tracking-tight mb-2">NGO Details</Text>
        <Text className="text-gray-400 text-base">Please complete your registration so our admins can verify your organization.</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-gray-300 font-medium mb-2">NGO Name</Text>
          <TextInput
            value={name}
            placeholder="E.g. Edhi Foundation"
            placeholderTextColor="#4B5563"
            onChangeText={setName}
            className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500"
          />
        </View>

        <View className="mt-4">
          <Text className="text-gray-300 font-medium mb-2">Govt Registration Number</Text>
          <TextInput
            value={registrationNumber}
            placeholder="Enter registration ID"
            placeholderTextColor="#4B5563"
            onChangeText={setRegistrationNumber}
            className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500"
          />
        </View>

        <View className="mt-4">
          <Text className="text-gray-300 font-medium mb-2">City / Zone</Text>
          <TextInput
            value={cityZone}
            placeholder="E.g. Karachi South"
            placeholderTextColor="#4B5563"
            onChangeText={setCityZone}
            className="bg-[#111827] text-white border border-gray-800 rounded-xl px-4 py-4 text-base focus:border-blue-500"
          />
        </View>

        <View className="mt-4">
          <Text className="text-gray-300 font-medium mb-2">Registration Certificate (PDF)</Text>
          <TouchableOpacity 
            onPress={pickDocument}
            className="bg-[#111827] border border-gray-800 rounded-xl px-4 py-4 items-center justify-center border-dashed"
          >
            <Text className={documentUri ? 'text-green-400 font-bold' : 'text-blue-500 font-medium'}>
              {documentUri ? '✅ PDF Uploaded. Tap to change.' : 'Tap to Upload PDF'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={onSubmit}
          disabled={loading}
          className="bg-blue-600 rounded-xl py-4 items-center justify-center mt-8 active:bg-blue-700 shadow-lg flex-row"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Submit for Approval</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
