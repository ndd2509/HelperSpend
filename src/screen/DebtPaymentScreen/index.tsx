import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLoans, markLoanAsPaid, createTransaction } from '../../apis/apis';
import type { Loan } from '../../apis/types';

const DebtPaymentScreen = ({ navigation }: any) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getLoans();
      if (response.success && response.data) {
        setLoans(
          response.data.filter(
            l => l.status === 'active' && l.category !== 'Cho vay',
          ),
        );
      }
    } catch (err) {
      console.error('loadLoans error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadLoans(); }, [loadLoans]));

  const totalDebt = loans.reduce((sum, l) => sum + l.amount, 0);

  const handlePay = (loan: Loan) => {
    Alert.alert(
      'Trả nợ',
      `Xác nhận đã trả ${loan.amount.toLocaleString('vi-VN')} đ cho ${loan.lender}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setPayingId(loan.id);
              const res = await markLoanAsPaid(loan.id);
              if (res.success) {
                const today = new Date().toISOString().split('T')[0];
                await createTransaction({
                  type: 'expense',
                  category: 'Trả nợ',
                  description: `Trả nợ ${loan.lender}`,
                  amount: loan.amount,
                  date: today,
                });
                setLoans(prev => prev.filter(l => l.id !== loan.id));
              } else {
                Alert.alert('Lỗi', res.message || 'Không thể trả nợ');
              }
            } catch {
              Alert.alert('Lỗi', 'Đã xảy ra lỗi');
            } finally {
              setPayingId(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Loan }) => (
    <View style={styles.loanItem}>
      <View style={styles.loanLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.lender.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.lenderName}>{item.lender}</Text>
          <Text style={styles.loanAmount}>
            {item.amount.toLocaleString('vi-VN')} đ
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.payButton}
        onPress={() => handlePay(item)}
        disabled={payingId === item.id}
      >
        {payingId === item.id ? (
          <ActivityIndicator size="small" color="#007AFF" />
        ) : (
          <Text style={styles.payButtonText}>Trả nợ</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nợ phải trả</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.totalBanner}>
        <Text style={styles.totalLabel}>Tổng tiền</Text>
        <Text style={styles.totalAmount}>
          {totalDebt.toLocaleString('vi-VN')} đ
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Không có khoản nợ nào</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 36,
    padding: 4,
  },
  backIcon: {
    fontSize: 22,
    color: '#000000',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  headerRight: {
    width: 36,
  },
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F5C842',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5A3E00',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5A3E00',
  },
  loanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 1,
  },
  loanLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lenderName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  loanAmount: {
    fontSize: 13,
    color: '#FF3B30',
    marginTop: 2,
  },
  payButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 72,
    alignItems: 'center',
  },
  payButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
  },
});

export default DebtPaymentScreen;
