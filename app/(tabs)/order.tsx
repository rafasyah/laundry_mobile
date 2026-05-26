import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';

import { api } from '../../services/storage';

import {
  Sparkles,
  CircleCheckBig,
  Wallet,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
} from 'lucide-react-native';

interface Service {
  id: number;
  service_name: string;
  price: number;
  unit: string;
}

export default function OrderScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] =
    useState<'cash' | 'transfer'>('cash');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);

      const data = await api.getServices();

      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);

      Alert.alert(
        'Error',
        'Failed to load services. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedService) return 0;

    const qty = parseInt(quantity) || 1;

    return selectedService.price * qty;
  };

  const increaseQty = () => {
    const qty = parseInt(quantity) || 1;
    setQuantity((qty + 1).toString());
  };

  const decreaseQty = () => {
    const qty = parseInt(quantity) || 1;

    if (qty > 1) {
      setQuantity((qty - 1).toString());
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedService) {
      Alert.alert('Error', 'Please select a service');
      return;
    }

    const qty = parseInt(quantity);

    if (qty < 1) {
      Alert.alert('Error', 'Quantity must be at least 1');
      return;
    }

    try {
      setSubmitting(true);

      await api.createTransaction(
        selectedService.id,
        calculateTotal(),
        paymentMethod
      );

      Alert.alert('Sukses!', 'Pesanan berhasil dibuat!', [
        {
          text: 'OK',
          onPress: () => {
            setSelectedService(null);
            setQuantity('1');
          },
        },
      ]);
    } catch (error) {
      console.error('Error creating order:', error);

      Alert.alert(
        'Error',
        'Failed to create order. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderService = ({ item }: { item: Service }) => {
    const selected = selectedService?.id === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.serviceCard,
          selected && styles.serviceCardSelected,
        ]}
        onPress={() => setSelectedService(item)}
      >
        <View style={styles.serviceLeft}>
          <View
            style={[
              styles.serviceIcon,
              selected && styles.serviceIconSelected,
            ]}
          >
            <Sparkles
              size={20}
              color={selected ? '#2563eb' : '#64748b'}
            />
          </View>

          <View>
            <Text style={styles.serviceName}>
              {item.service_name}
            </Text>

            <Text style={styles.servicePrice}>
              Rp {item.price.toLocaleString()} / {item.unit}
            </Text>
          </View>
        </View>

        {selected && (
          <CircleCheckBig size={24} color="#2563eb" />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>
          Loading services...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.smallTitle}>Win-dry Laundry Service</Text>

        <Text style={styles.title}>
          Buat Pesanan Baru
        </Text>

        <Text style={styles.subtitle}>
          Pilih layanan laundry terbaik untuk kamu
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 40,
        }}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>
            Pilih Layanan
          </Text>

          <FlatList
            data={services}
            renderItem={renderService}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />

          {selectedService && (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderIcon}>
                  <ShoppingBag
                    size={22}
                    color="#2563eb"
                  />
                </View>

                <View>
                  <Text style={styles.selectedServiceName}>
                    {selectedService.service_name}
                  </Text>

                  <Text style={styles.selectedServicePrice}>
                    Rp{' '}
                    {selectedService.price.toLocaleString()}{' '}
                    / {selectedService.unit}
                  </Text>
                </View>
              </View>

              <Text style={styles.inputLabel}>
                Jumlah Laundry
              </Text>

              <View style={styles.quantityWrapper}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={decreaseQty}
                >
                  <Minus size={18} color="#2563eb" />
                </TouchableOpacity>

                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />

                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={increaseQty}
                >
                  <Plus size={18} color="#2563eb" />
                </TouchableOpacity>
              </View>

              <Text style={styles.unitText}>
                Satuan: {selectedService.unit}
              </Text>

              <Text style={styles.sectionTitle}>
                Metode Pembayaran
              </Text>

              <View style={styles.paymentContainer}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.paymentCard,
                    paymentMethod === 'cash' &&
                      styles.paymentCardSelected,
                  ]}
                  onPress={() =>
                    setPaymentMethod('cash')
                  }
                >
                  <Wallet
                    size={22}
                    color={
                      paymentMethod === 'cash'
                        ? '#2563eb'
                        : '#64748b'
                    }
                  />

                  <Text
                    style={[
                      styles.paymentText,
                      paymentMethod === 'cash' &&
                        styles.paymentTextSelected,
                    ]}
                  >
                    Cash
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.paymentCard,
                    paymentMethod === 'transfer' &&
                      styles.paymentCardSelected,
                  ]}
                  onPress={() =>
                    setPaymentMethod('transfer')
                  }
                >
                  <CreditCard
                    size={22}
                    color={
                      paymentMethod === 'transfer'
                        ? '#2563eb'
                        : '#64748b'
                    }
                  />

                  <Text
                    style={[
                      styles.paymentText,
                      paymentMethod === 'transfer' &&
                        styles.paymentTextSelected,
                    ]}
                  >
                    Transfer
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>
                  Total Pembayaran
                </Text>

                <Text style={styles.totalAmount}>
                  Rp {calculateTotal().toLocaleString()}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.orderButton,
                  submitting &&
                    styles.orderButtonDisabled,
                ]}
                disabled={submitting}
                onPress={handleCreateOrder}
              >
                <Text style={styles.orderButtonText}>
                  {submitting
                    ? 'Memproses...'
                    : 'Buat Pesanan'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
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
    backgroundColor: '#f1f5f9',
  },

  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },

  header: {
    backgroundColor: '#2563eb',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  smallTitle: {
    color: '#bfdbfe',
    fontSize: 14,
    marginBottom: 6,
  },

  title: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#dbeafe',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 22,
  },

  content: {
    padding: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },

  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  serviceCardSelected: {
    borderWidth: 2,
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },

  serviceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  serviceIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  serviceIconSelected: {
    backgroundColor: '#dbeafe',
  },

  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },

  servicePrice: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },

  orderCard: {
    backgroundColor: 'white',
    marginTop: 12,
    borderRadius: 26,
    padding: 22,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },

  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  orderIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },

  selectedServiceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },

  selectedServicePrice: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },

  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
  },

  quantityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  qtyButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  quantityInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    marginHorizontal: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },

  unitText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },

  paymentContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },

  paymentCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },

  paymentCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },

  paymentText: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    fontWeight: '600',
  },

  paymentTextSelected: {
    color: '#2563eb',
  },

  totalCard: {
    backgroundColor: '#2563eb',
    borderRadius: 22,
    padding: 22,
    marginBottom: 24,
  },

  totalLabel: {
    fontSize: 14,
    color: '#bfdbfe',
    marginBottom: 8,
  },

  totalAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },

  orderButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: 'center',
  },

  orderButtonDisabled: {
    opacity: 0.6,
  },

  orderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});