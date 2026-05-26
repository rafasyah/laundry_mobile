import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { api, storage } from '../../services/storage';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import {
  ShoppingBag,
  Plus,
  Clock3,
  CircleCheckBig,
  CircleX,
  Package,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';

interface Transaction {
  id: number;
  invoice_id: string;
  service: {
    service_name: string;
  };
  total_price: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export default function DashboardScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

  const fetchTransactions = useCallback(async () => {
    try {
      const data = await api.getTransactions();
      setTransactions(data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert(
        'Error',
        'Failed to load transactions. Please check your connection.'
      );
      router.replace('/login');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Antrian':
        return {
          color: '#f59e0b',
          bg: '#fff7ed',
          icon: <Clock3 size={14} color="#f59e0b" />,
        };

      case 'Dicuci':
        return {
          color: '#3b82f6',
          bg: '#eff6ff',
          icon: <Package size={14} color="#3b82f6" />,
        };

      case 'Disetrika':
        return {
          color: '#10b981',
          bg: '#ecfdf5',
          icon: <CircleCheckBig size={14} color="#10b981" />,
        };

      case 'Siap Diambil':
        return {
          color: '#10b981',
          bg: '#ecfdf5',
          icon: <CircleCheckBig size={14} color="#10b981" />,
        };

      default:
        return {
          color: '#6b7280',
          bg: '#f3f4f6',
          icon: <Clock3 size={14} color="#6b7280" />,
        };
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.card}
        onPress={() => router.push(`/transaction/${item.id}`)}
      >
        <View style={styles.cardTop}>
          <View style={styles.invoiceContainer}>
            <Text style={styles.invoiceLabel}>Riwayat</Text>
            <Text style={styles.invoiceId}>{item.invoice_id}</Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bg },
            ]}
          >
            {statusConfig.icon}
            <Text
              style={[
                styles.statusText,
                { color: statusConfig.color },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.serviceContainer}>
          <View style={styles.serviceIcon}>
            <ShoppingBag size={20} color="#2563eb" />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>
              {item.service.service_name}
            </Text>

            <Text style={styles.paymentMethod}>
              Payment: {item.payment_method}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.totalLabel}>Total Payment</Text>
            <Text style={styles.price}>
              Rp {item.total_price.toLocaleString()}
            </Text>
          </View>

          <View style={styles.rightSection}>
            <Text style={styles.date}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>

            <ChevronRight size={18} color="#9ca3af" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Win-dry Laundry App</Text>
          <Text style={styles.title}>List Cucian Saya</Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={() => router.push('/(tabs)/order')}
          >
            <Plus size={18} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={async () => {
              await storage.removeItem('token');
              router.replace('/login');
            }}
          >
            <LogOut size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingBottom: 30,
          paddingTop: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <ShoppingBag size={40} color="#94a3b8" />
            </View>

            <Text style={styles.emptyTitle}>
              Belum Ada Transaksi
            </Text>

            <Text style={styles.emptySubtitle}>
              Yuk mulai pesan laundry pertama kamu
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/order')}
            >
              <Text style={styles.emptyButtonText}>
                Pesan Sekarang
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
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
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  greeting: {
    color: '#bfdbfe',
    fontSize: 14,
    marginBottom: 4,
  },

  title: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },

  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1d4ed8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  logoutButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  card: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  invoiceContainer: {
    flex: 1,
  },

  invoiceLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 3,
  },

  invoiceId: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 30,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  serviceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },

  paymentMethod: {
    fontSize: 13,
    color: '#64748b',
  },

  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 18,
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  totalLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },

  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },

  rightSection: {
    alignItems: 'flex-end',
  },

  date: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  emptyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },

  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});