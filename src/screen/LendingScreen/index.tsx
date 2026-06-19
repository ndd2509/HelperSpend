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

const LendingScreen = ({ navigation }: any) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getLoans();
      if (response.success && response.data) {
        setLoans(
          response.data.filter(
            l => l.status === 'active' && l.category === 'Cho vay',
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

  const totalReceivable = loans.reduce((sum, l) => sum + l.amount, 0);

  const handleCollect = (loan: Loan) => {
    Alert.alert(
      'Thu nợ',
      `Xác nhận đã thu ${loan.amount.toLocaleString('vi-VN')} đ từ ${loan.lender}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              setCollectingId(loan.id);
              const res = await markLoanAsPaid(loan.id);
              if (res.success) {
                const today = new Date().toISOString().split('T')[0];
                await createTransaction({
                  type: 'income',
                  category: 'Thu nợ',
                  description: `Thu nợ từ ${loan.lender}`,
                  amount: loan.amount,
                  date: today,
                });
                setLoans(prev => prev.filter(l => l.id !== loan.id));
              } else {
                Alert.alert('Lỗi', res.message || 'Không thể thu nợ');
              }
            } catch {
              Alert.alert('Lỗi', 'Đã xảy ra lỗi');
            } finally {
              setCollectingId(null);
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
        style={styles.collectButton}
        onPress={() => handleCollect(item)}
        disabled={collectingId === item.id}
      >
        {collectingId === item.id ? (
          <ActivityIndicator size="small" color="#4CAF50" />
        ) : (
          <Text style={styles.collectButtonText}>Thu nợ</Text>
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
        <Text style={styles.headerTitle}>Nợ phải thu</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.totalBanner}>
        <Text style={styles.totalLabel}>Tổng tiền</Text>
        <Text style={styles.totalAmount}>
          {totalReceivable.toLocaleString('vi-VN')} đ
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Không có khoản cho vay nào</Text>
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
    backgroundColor: '#C8E6C9',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1B5E20',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B5E20',
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
    backgroundColor: '#4CAF50',
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
    color: '#4CAF50',
    marginTop: 2,
  },
  collectButton: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 72,
    alignItems: 'center',
  },
  collectButtonText: {
    fontSize: 14,
    color: '#4CAF50',
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

export default LendingScreen;
