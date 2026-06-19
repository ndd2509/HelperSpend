import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardSummary, getLoanSummary } from '../../apis/apis';

export const AccountListScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [balance, setBalance] = useState<any>({ balance: 0 });
  const [totalLent, setTotalLent] = useState<number>(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultAccountId, setDefaultAccountId] = useState<string | undefined>(
    undefined,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  // Fetch accounts and calculate balance
  useFocusEffect(
    React.useCallback(() => {
      loadAccounts();
    }, []),
  );

  const loadAccounts = async () => {
    try {
      setLoading(true);

      // Load defaultAccountId from AsyncStorage
      const AuthService = (await import('../../services/AuthService')).default;
      const { EKeyAsyncStorage } = await import('../../services/AuthService');
      const userStr = await AuthService.shared.getCredentials(
        EKeyAsyncStorage.INFO_USER,
      );
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        setDefaultAccountId(currentUser.defaultAccountId);
      }

      const { getAccounts } = await import('../../apis/apis');
      const res = await getAccounts();

      if (res.success) {
        setAccounts(res.data.accounts || []);
        const totalBalance = (res.data.accounts || []).reduce(
          (sum: number, acc: any) => sum + (acc.balance || 0),
          0,
        );
        setBalance({ balance: totalBalance });
      }

      try {
        const loanRes = await getLoanSummary();
        if (loanRes.success && loanRes.data) {
          setTotalLent(loanRes.data.totalLent || 0);
        }
      } catch {
        setTotalLent(0);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '0 ₫';
    return amount.toLocaleString('vi-VN') + ' ₫';
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
        <Text style={styles.headerTitle}>Tài khoản của tôi</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Total Assets Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Tổng tài sản</Text>
          <View style={styles.totalRow}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.totalAmount}>
                {formatCurrency((balance?.balance || 0) - totalLent)}
              </Text>
            )}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate('CreateAccount')}
            >
              <Text style={styles.addIcon}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Status Section */}
        <TouchableOpacity
          style={styles.financialCard}
          onPress={() =>
            navigation.navigate('BalanceDetailScreen', {
              totalCo: balance?.balance,
              totalNo: balance?.monthlyIncome,
            })
          }
        >
          <View style={styles.financialHeader}>
            <Text style={styles.financialTitle}>Tài chính hiện tại</Text>
            <Text style={styles.arrow}>›</Text>
          </View>
          <Text style={styles.financialAmount}>
            {loading ? '...' : formatCurrency((balance?.balance || 0) - totalLent)}
          </Text>
        </TouchableOpacity>

        {/* Accounts Section */}
        <View style={styles.accountsSection}>
          <View style={styles.accountsHeader}>
            <Text style={styles.accountsTitle}>
              Tài khoản chi tiêu ({accounts.length})
            </Text>
            {/* <TouchableOpacity>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity> */}
          </View>

          {/* Account List */}
          {loading ? (
            <View style={{ padding: 20 }}>
              <ActivityIndicator size="small" color="#999" />
            </View>
          ) : accounts.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: '#999' }}>Chưa có tài khoản nào</Text>
            </View>
          ) : (
            accounts.map(account => (
              <TouchableOpacity
                key={account.id}
                style={styles.accountCard}
                // onPress={() => navigation.navigate('EditAccount', { account })}
              >
                <View style={styles.accountLeft}>
                  <View style={styles.accountIcon}>
                    <Text style={styles.accountIconText}>
                      {account.icon || '💰'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Text style={styles.accountName}>{account.name}</Text>
                      {defaultAccountId === account.id && (
                        <Text style={styles.defaultBadge}>⭐</Text>
                      )}
                    </View>
                    <Text style={styles.accountBalance}>
                      {formatCurrency(account.balance)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={e => {
                    e.stopPropagation();
                    setSelectedAccount(account);
                    setModalVisible(true);
                  }}
                >
                  <Text style={styles.moreIcon}>⋮</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedAccount?.name || 'Tài khoản'}
            </Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('EditAccount', {
                  account: selectedAccount,
                });
              }}
            >
              <Text style={styles.modalOptionIcon}>✏️</Text>
              <Text style={styles.modalOptionText}>Sửa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setModalVisible(false);
                Alert.alert(
                  'Xác nhận xóa',
                  `Bạn có chắc chắn muốn xóa tài khoản "${selectedAccount?.name}"?`,
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const { deleteAccount } = await import(
                            '../../apis/apis'
                          );
                          const res = await deleteAccount(selectedAccount.id);
                          if (res.success) {
                            // If deleted account was default, clear it from AsyncStorage
                            if (defaultAccountId === selectedAccount.id) {
                              const AuthService = (
                                await import('../../services/AuthService')
                              ).default;
                              const { EKeyAsyncStorage } = await import(
                                '../../services/AuthService'
                              );
                              const userStr =
                                await AuthService.shared.getCredentials(
                                  EKeyAsyncStorage.INFO_USER,
                                );
                              if (userStr) {
                                const currentUser = JSON.parse(userStr);
                                const updatedUser = {
                                  ...currentUser,
                                  defaultAccountId: undefined,
                                };
                                await AuthService.shared.setCredentials(
                                  EKeyAsyncStorage.INFO_USER,
                                  JSON.stringify(updatedUser),
                                );
                                setDefaultAccountId(undefined);
                              }
                            }
                            Alert.alert('Thành công', 'Đã xóa tài khoản');
                            loadAccounts();
                          } else {
                            Alert.alert(
                              'Lỗi',
                              res.message || 'Không thể xóa tài khoản',
                            );
                          }
                        } catch (error: any) {
                          Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi');
                        }
                      },
                    },
                  ],
                );
              }}
            >
              <Text style={styles.modalOptionIcon}>🗑️</Text>
              <Text style={[styles.modalOptionText, styles.modalOptionDanger]}>
                Xóa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={async () => {
                setModalVisible(false);
                try {
                  const { setDefaultAccount } = await import('../../apis/apis');
                  const res = await setDefaultAccount(selectedAccount.id);
                  if (res.success) {
                    // Update AsyncStorage immediately
                    const AuthService = (
                      await import('../../services/AuthService')
                    ).default;
                    const { EKeyAsyncStorage } = await import(
                      '../../services/AuthService'
                    );
                    const userStr = await AuthService.shared.getCredentials(
                      EKeyAsyncStorage.INFO_USER,
                    );
                    if (userStr) {
                      const currentUser = JSON.parse(userStr);
                      const updatedUser = {
                        ...currentUser,
                        defaultAccountId: selectedAccount.id,
                      };
                      await AuthService.shared.setCredentials(
                        EKeyAsyncStorage.INFO_USER,
                        JSON.stringify(updatedUser),
                      );
                      console.log(
                        '✅ Saved defaultAccountId to AsyncStorage:',
                        selectedAccount.id,
                      );
                    }

                    Alert.alert(
                      'Thành công',
                      `Đã đặt "${selectedAccount.name}" làm tài khoản mặc định`,
                    );
                    loadAccounts();
                  } else {
                    Alert.alert(
                      'Lỗi',
                      res.message || 'Không thể đặt tài khoản mặc định',
                    );
                  }
                } catch (error: any) {
                  Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi');
                }
              }}
            >
              <Text style={styles.modalOptionIcon}>⭐</Text>
              <Text style={styles.modalOptionText}>
                {defaultAccountId === selectedAccount?.id
                  ? 'Đã là mặc định'
                  : 'Đặt làm mặc định'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    // backgroundColor: '#fff',
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
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  totalCard: {
    backgroundColor: '#4A90E2',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  financialCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  financialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  financialTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  financialAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A90E2',
  },
  accountsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
  },
  accountsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  accountsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  arrow: {
    fontSize: 20,
    color: '#999',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountIconText: {
    fontSize: 20,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  defaultBadge: {
    fontSize: 14,
  },
  accountBalance: {
    fontSize: 13,
    color: '#666',
  },
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreIcon: {
    fontSize: 20,
    color: '#999',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalOptionDanger: {
    color: '#FF3B30',
  },
});
