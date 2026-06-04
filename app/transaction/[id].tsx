import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/storage';

interface Transaction {
  id: number;
  invoice_id: string;
  service: {
    service_name: string;
    unit: string;
  };
  total_price: number;
  amount: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  paid_at?: string;
  payment_proof?: string;
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTransactionDetail();
  }, [id]);

  const fetchTransactionDetail = async () => {
    try {
      console.log('Fetching transaction detail for ID:', id);
      const data = await api.getTransaction(Number(id));
      setTransaction(data);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      Alert.alert('Error', 'Failed to load transaction details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Antrian':
      case 'pending': return '#f59e0b';
      case 'Dicuci': return '#3b82f6';
      case 'Disetrika': return '#10b981';
      case 'Siap Diambil': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderProgressBar = () => {
    const steps = ['Antrian', 'Dicusi', 'Disetrika', 'Siap Diambil'];
    const currentStep = transaction?.status === 'Antrian' || transaction?.status === 'pending' ? 0 :
                       transaction?.status === 'Dicuci' ? 1 :
                       transaction?.status === 'Disetrika' ? 2 : 3;

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step} style={styles.stepContainer}>
            <View style={[
              styles.stepCircle,
              index <= currentStep && styles.stepActive
            ]}>
              <Text style={[
                styles.stepText,
                index <= currentStep && styles.stepTextActive
              ]}>
                {index + 1}
              </Text>
            </View>
            <Text style={[
              styles.stepLabel,
              index <= currentStep && styles.stepLabelActive
            ]}>
              {step}
            </Text>
            {index < steps.length - 1 && (
              <View style={[
                styles.stepLine,
                index < currentStep && styles.stepLineActive
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  const handleUploadProof = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload payment proof.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadProof(result.assets[0].uri);
    }
  };

  const uploadProof = async (uri: string) => {
    setUploadingProof(true);
    try {
      await api.uploadTransactionProof(Number(id), uri);
      Alert.alert('Success', 'Payment proof uploaded successfully');
      await fetchTransactionDetail();
    } catch (error) {
      console.error('Error uploading proof:', error);
      Alert.alert('Error', 'Failed to upload payment proof');
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.center}>
        <Text>Transaction not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.invoiceId}>{transaction.invoice_id}</Text>
        <Text style={styles.sectionTitle}>Detail Transaksi</Text>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Layanan:</Text>
          <Text style={styles.value}>{transaction.service.service_name}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Jumlah:</Text>
          <Text style={styles.value}>{transaction.amount} {transaction.service.unit}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Harga:</Text>
          <Text style={styles.value}>Rp {transaction.total_price.toLocaleString()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Metode Bayar:</Text>
          <Text style={styles.value}>{transaction.payment_method}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Status Pembayaran:</Text>
          <Text style={styles.value}>{transaction.payment_status}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.label}>Tanggal Pesan:</Text>
          <Text style={styles.value}>{new Date(transaction.created_at).toLocaleDateString()}</Text>
        </View>

        {transaction.paid_at && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Tanggal Bayar:</Text>
            <Text style={styles.value}>{new Date(transaction.paid_at).toLocaleDateString()}</Text>
          </View>
        )}

        {transaction.payment_proof ? (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Payment Proof:</Text>
            <Image
              source={{ uri: transaction.payment_proof }}
              style={styles.paymentProofImage}
              resizeMode="contain"
            />
          </View>
        ) : null}

        {!transaction.payment_proof && transaction.payment_method === 'transfer' && transaction.payment_status === 'pending' ? (
          <TouchableOpacity style={styles.uploadProofButton} onPress={handleUploadProof} disabled={uploadingProof}>
            <Text style={styles.uploadProofButtonText}>
              {uploadingProof ? 'Uploading...' : 'Upload Payment Proof'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Cucian</Text>
        {renderProgressBar()}
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Kembali</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    margin: 10,
    padding: 20,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#0f172a',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  label: {
    fontSize: 14,
    color: '#64748b',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  paymentProofImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepActive: {
    backgroundColor: '#111827',
  },
  stepText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTextActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#111827',
    fontWeight: 'bold',
  },
  stepLine: {
    position: 'absolute',
    top: 20,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#e5e7eb',
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: '#111827',
  },
  backButton: {
    backgroundColor: '#111827',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadProofButton: {
    backgroundColor: '#111827',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadProofButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
