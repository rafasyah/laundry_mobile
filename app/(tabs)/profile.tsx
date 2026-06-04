import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, storage } from '../../services/storage';
import { useRouter } from 'expo-router';
import { User, Phone, MapPin, Mail, LogOut, Save } from 'lucide-react-native';

interface ProfileData {
  id: number;
  name: string;
  email: string;
  customer: {
    id: number;
    phone: string;
    address: string;
  } | null;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data);
      setName(data.name || '');
      setPhone(data.customer?.phone || '');
      setAddress(data.customer?.address || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      await api.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });

      Alert.alert('Success', 'Profil berhasil diperbarui!', [
        {
          text: 'OK',
          onPress: () => fetchProfile(),
        },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await storage.removeItem('token');
            await storage.removeItem('user');
            router.replace('/login');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <User size={28} color="white" />
        </View>
        <View>
          <Text style={styles.greeting}>Profil Anda</Text>
          <Text style={styles.title}>Pengaturan Akun</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Informasi Pribadi</Text>

          {/* Name */}
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <User size={18} color="#111827" />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          {/* Email (read-only) */}
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Mail size={18} color="#64748b" />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Alamat Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={profile?.email || ''}
                editable={false}
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.readOnlyHint}>Alamat email tidak dapat diubah</Text>
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Phone size={18} color="#111827" />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Nomor Telepon</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <MapPin size={18} color="#111827" />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Alamat</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your full address"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Save size={20} color="white" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <LogOut size={20} color="#dc2626" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Perubahan akan diterapkan di semua perangkat Anda
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    backgroundColor: '#111827',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    color: '#e5e7eb',
    fontSize: 14,
    marginBottom: 2,
  },
  title: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  readOnlyHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    fontStyle: 'italic',
  },
  textArea: {
    minHeight: 90,
    paddingTop: 14,
  },
  saveButton: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
    marginBottom: 14,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fee2e2',
    marginBottom: 24,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontSize: 17,
    fontWeight: '700',
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
});
