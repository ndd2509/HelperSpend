import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

interface RouteParams {
  amount?: string;
  requestId?: string;
}

export const DepositSuccessScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;

  const handleGoHome = () => {
    navigation.navigate('home' as never, { screen: 'HomeMain' } as never);
  };

  const handleViewTransactions = () => {
    navigation.navigate('home' as never, { screen: 'Transactions' } as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.successCard}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>✅</Text>
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Nạp Tiền Thành Công!</Text>
        <Text style={styles.subtitle}>
          Yêu cầu nạp tiền của bạn đã được duyệt
        </Text>

        {/* Amount Display */}
        {params?.amount && (
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Số tiền</Text>
            <Text style={styles.amount}>
              {new Intl.NumberFormat('vi-VN').format(Number(params.amount))} VND
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleViewTransactions}
          >
            <Text style={styles.primaryButtonText}>Xem Giao Dịch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleGoHome}
          >
            <Text style={styles.secondaryButtonText}>Về Trang Chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 24,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  amountContainer: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 32,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0066cc',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});
