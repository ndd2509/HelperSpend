import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export const SelectAccountScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const currentAccountId = route.params?.currentAccountId;
  const transactionType = route.params?.type; // Get transaction type
  const onSelect = route.params?.onSelect; // Get callback

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const { getAccounts } = await import('../../apis/apis');
      const res = await getAccounts();
      if (res.success && res.data.accounts) {
        setAccounts(res.data.accounts);
      }
    } catch (error) {
      console.error('Load accounts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAccount = (account: any) => {
    // Call the callback if provided
    if (onSelect) {
      onSelect(account);
      navigation.goBack(); // Simple go back
    } else {
      // Fallback to navigate if no callback (shouldn't happen)
      navigation.navigate('AddTransaction', {
        selectedAccount: account,
        type: transactionType,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn tài khoản</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('CreateAccount')}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Account List */}
      <ScrollView style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#999" />
          </View>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={styles.emptyText}>Chưa có tài khoản nào</Text>
            <TouchableOpacity
              style={styles.createAccountBtn}
              onPress={() => navigation.navigate('CreateAccount')}
            >
              <Text style={styles.createAccountBtnText}>+ Tạo tài khoản</Text>
            </TouchableOpacity>
          </View>
        ) : (
          accounts.map(account => {
            const isSelected = account.id === currentAccountId;
            return (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountItem,
                  isSelected && styles.accountItemSelected,
                ]}
                onPress={() => handleSelectAccount(account)}
              >
                {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                <View style={styles.accountIcon}>
                  <Text style={styles.accountIconText}>
                    {account.icon || '💰'}
                  </Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountBalance}>
                    {account.balance?.toLocaleString('vi-VN')} ₫
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  addBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 20,
  },
  addIcon: {
    fontSize: 26,
    color: '#00BCD4',
    fontWeight: '300',
    lineHeight: 30,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginBottom: 20,
  },
  createAccountBtn: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#00BCD4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  createAccountBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  accountItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  checkIcon: {
    fontSize: 18,
    color: '#4A90E2',
    marginRight: 4,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIconText: {
    fontSize: 22,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 13,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00BCD4',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#00BCD4',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
