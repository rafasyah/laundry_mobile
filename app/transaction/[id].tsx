import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../services/storage';

interface Transaction {
  id: number;
  invoice_id: string;
  service: {
    service_name: string;
  };
  total_price: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  paid_at?: string;
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
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
    const steps = ['Antrian', 'Dicuci', 'Disetrika', 'Siap Diambil'];
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
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invoiceId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
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
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  stepActive: {
    backgroundColor: '#007AFF',
  },
  stepText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTextActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  stepLine: {
    position: 'absolute',
    top: 20,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#ddd',
    zIndex: -1,
  },
  stepLineActive: {
    backgroundColor: '#007AFF',
  },
  backButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});