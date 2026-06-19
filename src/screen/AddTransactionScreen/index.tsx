import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { BaseContainer } from 'react-native-shared-components';
import { useAuth } from '../../contexts/AuthContext';
import { createTransaction, getCategories } from '../../apis/apis';
import type { Category } from '../../apis/types';
import { LoanFields } from './LoanFields';

// ─── Types ────────────────────────────────────────────────────────────────────
type TransactionType = 'expense' | 'income' | 'loan';

// ─── Numpad ───────────────────────────────────────────────────────────────────
const NUMPAD_KEYS = [
  '7',
  '8',
  '9',
  '4',
  '5',
  '6',
  '1',
  '2',
  '3',
  '.',
  '0',
  '⌫',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatAmountDisplay = (val: string) => {
  if (!val || val === '0') return '0';
  const [int, dec] = val.split('.');
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${formatted}.${dec}` : formatted;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatTime = (date: Date) =>
  date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

// ─── Component ────────────────────────────────────────────────────────────────
export const AddTransactionScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const route = useRoute<any>();
  const initialType: TransactionType = route.params?.type || 'expense';

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [note, setNote] = useState('');
  const [date] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Loan-specific fields
  const [lender, setLender] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  // Quick categories loaded from API
  const [quickCats, setQuickCats] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);

  // Account selection
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // Load quick categories from API when type changes
  useEffect(() => {
    setSelectedCategory(null);
    setSelectedAccount(null); // Reset account to allow auto-select
    loadQuickCats(type);
    loadAccounts(); // Reload to auto-select default for new type
  }, [type]);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  // Reload accounts when screen focused (after creating new account)
  useFocusEffect(
    React.useCallback(() => {
      // Don't reload here - it would override manually selected account
      // Only reload when type changes (in useEffect above)
    }, []),
  );

  const loadQuickCats = async (t: TransactionType) => {
    try {
      setCatsLoading(true);
      const res = await getCategories(t);
      if (res.success) {
        setQuickCats(res.data.slice(0, 8)); // Show first 8 as "Hay dùng"
      }
    } catch {
      setQuickCats([]);
    } finally {
      setCatsLoading(false);
    }
  };

  const loadAccounts = async () => {
    try {
      setAccountsLoading(true);

      // Always reload user from AsyncStorage to get latest defaultAccountId
      const AuthService = (await import('../../services/AuthService')).default;
      const { EKeyAsyncStorage } = await import('../../services/AuthService');
      const userStr = await AuthService.shared.getCredentials(
        EKeyAsyncStorage.INFO_USER,
      );
      let currentUser = user;
      if (userStr) {
        currentUser = JSON.parse(userStr);
        console.log('🔍 Loaded user from storage:', currentUser);
      }

      const { getAccounts } = await import('../../apis/apis');
      const res = await getAccounts();
      if (res.success && res.data.accounts) {
        setAccounts(res.data.accounts);

        console.log(
          '🔍 Current user defaultAccountId:',
          currentUser?.defaultAccountId,
        );
        console.log(
          '🔍 Available accounts:',
          res.data.accounts.map((a: any) => ({ id: a.id, name: a.name })),
        );

        // Auto-select default account if defaultAccountId exists
        if (currentUser?.defaultAccountId) {
          const defaultAcc = res.data.accounts.find(
            (acc: any) => acc.id === currentUser.defaultAccountId,
          );
          console.log('🔍 Found default account:', defaultAcc);
          if (defaultAcc) {
            setSelectedAccount(defaultAcc);
            console.log('✅ Auto-selected default account:', defaultAcc.name);
          }
        }
      }
    } catch (error) {
      console.error('Load accounts error:', error);
    } finally {
      setAccountsLoading(false);
    }
  };

  // Receive selected category back from SelectCategoryScreen
  const routeParams = route.params as any;
  React.useEffect(() => {
    if (routeParams?.selectedCategory) {
      setSelectedCategory(routeParams.selectedCategory);
    }
    // selectedAccount now handled via callback, not params
  }, [routeParams?.selectedCategory]);

  // ── Numpad handler
  const handleNumpad = (key: string) => {
    if (key === '⌫') {
      if (amount.length <= 1) {
        setAmount('0');
      } else {
        setAmount(p => p.slice(0, -1));
      }
      return;
    }
    if (key === '.') {
      if (amount.includes('.')) return;
      setAmount(p => p + '.');
      return;
    }
    // Max 2 decimal places
    if (amount.includes('.')) {
      const dec = amount.split('.')[1];
      if (dec.length >= 2) return;
    }
    if (amount === '0' && key !== '.') {
      setAmount(key);
    } else {
      if (amount.replace('.', '').length >= 12) return; // max digits
      setAmount(p => p + key);
    }
  };

  // ── Save
  const handleSave = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Lỗi', 'Vui lòng chọn hạng mục');
      return;
    }
    if (!selectedAccount) {
      Alert.alert('Lỗi', 'Vui lòng chọn tài khoản');
      return;
    }
    // Loan-specific validation
    if (isLoan && !lender.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập người cho vay');
      return;
    }
    try {
      setLoading(true);
      // Format date as YYYY-MM-DD in local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;

      const response = await createTransaction({
        type,
        amount: amountNum,
        category: selectedCategory.name,
        description: note,
        date: localDateString,
        accountId: selectedAccount.id,
        // Loan-specific fields
        ...(type === 'loan' && {
          lender,
          dueDate: dueDate?.toISOString().split('T')[0],
          location,
          imageUri,
        }),
      });
      
      const successMsg =
        type === 'expense'
          ? 'chi tiêu'
          : type === 'loan'
            ? 'khoản vay'
            : 'thu nhập';
      Alert.alert('Thành công', `Đã thêm ${successMsg} thành công!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const switchType = (newType: TransactionType) => {
    setType(newType);
    setShowTypeModal(false);
  };

  const isExpense = type === 'expense';
  const isLoan = type === 'loan';
  const accentColor = isExpense ? '#F44336' : isLoan ? '#FF9800' : '#4CAF50';

  return (
    <BaseContainer style={styles.container} edges={['top']}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBtnIcon}>←</Text>
        </TouchableOpacity>

        {/* Type selector (dropdown pill) */}
        <TouchableOpacity
          style={[styles.typeSelector, { borderColor: accentColor }]}
          onPress={() => setShowTypeModal(true)}
        >
          <Text style={[styles.typeSelectorText, { color: accentColor }]}>
            {isExpense ? 'Chi tiêu' : isLoan ? 'Đi vay' : 'Thu nhập'}
          </Text>
          <Text style={[styles.typeSelectorArrow, { color: accentColor }]}>
            {' '}
            ▾
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={[styles.headerBtnIcon, { color: accentColor }]}>✓</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── AMOUNT ─────────────────────────────────────────────────── */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Số tiền</Text>
            <Text style={[styles.amountDisplay, { color: accentColor }]}>
              {formatAmountDisplay(amount)} ₫
            </Text>
          </View>

          {/* ── LOAN FIELDS (when type === 'loan') ──────────────────────── */}
          {isLoan ? (
            <LoanFields
              lender={lender}
              setLender={setLender}
              dueDate={dueDate}
              setShowDueDatePicker={setShowDueDatePicker}
              location={location}
              setLocation={setLocation}
              imageUri={imageUri}
              setShowImagePicker={setShowImagePicker}
              note={note}
              setNote={setNote}
              userName={user?.name || 'User'}
              date={date}
              selectedCategory={selectedCategory}
              onCategoryPress={() =>
                navigation.navigate('SelectCategory', { type })
              }
              selectedAccount={selectedAccount}
              onAccountPress={() =>
                navigation.navigate('SelectAccount', {
                  currentAccountId: selectedAccount?.id,
                  type,
                  onSelect: (account: any) => {
                    setSelectedAccount(account);
                  },
                })
              }
              navigation={navigation}
            />
          ) : (
            <>
              {/* ── CATEGORY ───────────────────────────────────────────────── */}
              <View style={styles.categorySection}>
                {/* Header row — tap to open full SelectCategoryScreen */}
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() =>
                    navigation.navigate('SelectCategory', { type })
                  }
                >
                  <View style={styles.addCategoryBtn}>
                    {selectedCategory ? (
                      <>
                        <View
                          style={[
                            styles.selectedCatDot,
                            isExpense
                              ? styles.selectedCatDotExpense
                              : styles.selectedCatDotIncome,
                          ]}
                        >
                          <Text style={styles.selectedCatDotIcon}>
                            {selectedCategory.icon ||
                              selectedCategory.name.charAt(0)}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.selectedCatText,
                            { color: accentColor },
                          ]}
                        >
                          {selectedCategory.name}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.addCategoryIcon}>＋</Text>
                        <Text style={styles.addCategoryText}>
                          Chọn hạng mục
                        </Text>
                      </>
                    )}
                  </View>
                  <Text style={styles.viewAllCats}>Tất cả ›</Text>
                </TouchableOpacity>

                {/* Quick cats grid — loaded from API */}
                <Text style={styles.frequentLabel}>
                  Hay dùng <Text style={styles.chevron}>∨</Text>
                </Text>

                {catsLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="#1E88E5"
                    style={styles.catsLoader}
                  />
                ) : (
                  <View style={styles.categoryGrid}>
                    {quickCats.map(cat => {
                      const isSelected = selectedCategory?.id === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryItem,
                            isSelected && styles.categoryItemSelected,
                          ]}
                          onPress={() => setSelectedCategory(cat)}
                        >
                          <View
                            style={[
                              styles.catIconWrap,
                              isSelected && {
                                backgroundColor: accentColor + '20',
                              },
                            ]}
                          >
                            <Text style={styles.catIcon}>
                              {cat.icon || '📌'}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.catName,
                              isSelected && { color: accentColor },
                            ]}
                            numberOfLines={2}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* ── ACCOUNT SELECTOR ────────────────────────────────────────────── */}
              <TouchableOpacity
                style={styles.accountSelector}
                onPress={() =>
                  navigation.navigate('SelectAccount', {
                    currentAccountId: selectedAccount?.id,
                    type, // Preserve transaction type
                    onSelect: (account: any) => {
                      setSelectedAccount(account);
                    },
                  })
                }
              >
                <View style={styles.accountSelectorContent}>
                  <View style={styles.accountSelectorLeft}>
                    <View style={styles.accountIcon}>
                      <Text style={styles.accountIconText}>
                        {selectedAccount?.icon || '💰'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.accountSelectorLabel}>Tài khoản</Text>
                      <Text style={styles.accountSelectorValue}>
                        {selectedAccount?.name || 'Chọn tài khoản'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.accountSelectorArrow}>›</Text>
                </View>
              </TouchableOpacity>

              {/* ── META FIELDS ────────────────────────────────────────────── */}
              <View style={styles.metaSection}>
                {/* Date */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaIcon}>📅</Text>
                  <View style={styles.metaContent}>
                    <Text style={styles.metaLabel}>
                      Hôm nay - {formatDate(date)}
                    </Text>
                  </View>
                  <Text style={styles.metaTime}>{formatTime(date)}</Text>
                </View>

                <View style={styles.divider} />

                {/* Note */}
                <View style={styles.metaRow}>
                  <Text style={styles.metaIcon}>📝</Text>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Diễn giải"
                    placeholderTextColor="#bbb"
                    value={note}
                    onChangeText={setNote}
                    multiline
                  />
                </View>
              </View>
            </>
          )}

          {/* Spacer for numpad */}
          <View style={styles.numpadSpacer} />
        </ScrollView>

        {/* ── NUMPAD ───────────────────────────────────── */}
        <View style={styles.numpad}>
          {NUMPAD_KEYS.map(key => (
            <TouchableOpacity
              key={key}
              style={[styles.numKey, key === '⌫' && styles.numKeyBackspace]}
              onPress={() => handleNumpad(key)}
            >
              <Text
                style={[
                  styles.numKeyText,
                  key === '⌫' && styles.numKeyBackspaceText,
                ]}
              >
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── SAVE BUTTON ────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: accentColor }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveBtnText}>
            {loading ? 'Đang lưu...' : 'Lưu lại'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* ── TYPE MODAL ─────────────────────────────────────────────────── */}
      <Modal
        visible={showTypeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTypeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowTypeModal(false)}
        >
          <View style={styles.typeModal}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                type === 'expense' && styles.typeOptionActive,
              ]}
              onPress={() => switchType('expense')}
            >
              <Text style={styles.typeOptionIcon}>💸</Text>
              <Text
                style={[
                  styles.typeOptionText,
                  type === 'expense' && styles.typeExpenseActive,
                ]}
              >
                Chi tiêu
              </Text>
              {type === 'expense' && <Text style={styles.typeCheck}>✓</Text>}
            </TouchableOpacity>
            <View style={styles.typeModalDivider} />
            <TouchableOpacity
              style={[
                styles.typeOption,
                type === 'income' && styles.typeOptionActive,
              ]}
              onPress={() => switchType('income')}
            >
              <Text style={styles.typeOptionIcon}>💰</Text>
              <Text
                style={[
                  styles.typeOptionText,
                  type === 'income' && styles.typeIncomeActive,
                ]}
              >
                Thu nhập
              </Text>
              {type === 'income' && <Text style={styles.typeCheck}>✓</Text>}
            </TouchableOpacity>
            <View style={styles.typeModalDivider} />
            <TouchableOpacity
              style={[
                styles.typeOption,
                type === 'loan' && styles.typeOptionActive,
              ]}
              onPress={() => switchType('loan')}
            >
              <Text style={styles.typeOptionIcon}>💳</Text>
              <Text
                style={[
                  styles.typeOptionText,
                  type === 'loan' && styles.typeLoanActive,
                ]}
              >
                Đi vay
              </Text>
              {type === 'loan' && <Text style={styles.typeCheck}>✓</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── ACCOUNT MODAL ─────────────────────────────────────────────────── */}
      <Modal
        visible={showAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.accountModalContainer}>
          <View style={styles.accountModalContent}>
            {/* Header */}
            <View style={styles.accountModalHeader}>
              <TouchableOpacity
                style={styles.accountModalClose}
                onPress={() => setShowAccountModal(false)}
              >
                <Text style={styles.accountModalCloseText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.accountModalTitle}>Chọn tài khoản</Text>
              <TouchableOpacity style={styles.accountModalSearch}>
                <Text style={styles.accountModalSearchIcon}>🔍</Text>
              </TouchableOpacity>
            </View>

            {/* Account List */}
            <ScrollView style={styles.accountModalList}>
              {accountsLoading ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#999" />
                </View>
              ) : accounts.length === 0 ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: '#999' }}>Chưa có tài khoản nào</Text>
                </View>
              ) : (
                accounts.map(account => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.accountModalItem,
                      selectedAccount?.id === account.id &&
                        styles.accountModalItemActive,
                    ]}
                    onPress={() => {
                      setSelectedAccount(account);
                      setShowAccountModal(false);
                    }}
                  >
                    <View style={styles.accountModalItemLeft}>
                      {selectedAccount?.id === account.id && (
                        <Text style={styles.accountModalCheck}>✓</Text>
                      )}
                      <View style={styles.accountModalIcon}>
                        <Text style={styles.accountModalIconText}>
                          {account.icon || '💰'}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.accountModalItemName}>
                          {account.name}
                        </Text>
                        <Text style={styles.accountModalItemBalance}>
                          {account.balance?.toLocaleString('vi-VN')} ₫
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* FAB - Create Account */}
            <TouchableOpacity
              style={styles.accountModalFab}
              onPress={() => {
                setShowAccountModal(false);
                navigation.navigate('CreateAccount');
              }}
            >
              <Text style={styles.accountModalFabIcon}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </BaseContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  flex1: { flex: 1 },
  scroll: { flex: 1 },
  numpadSpacer: { height: 300 },
  categoryItemSelected: {
    borderWidth: 2,
    borderRadius: 12,
    borderColor: '#5C6BC0', // overridden by dynamic style in JSX but TS needs it
  },
  typeExpenseActive: {
    color: '#F44336',
    fontWeight: '700' as const,
  },
  typeIncomeActive: {
    color: '#4CAF50',
    fontWeight: '700' as const,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnIcon: {
    fontSize: 22,
    color: '#888',
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: '#fff',
  },
  typeSelectorText: {
    fontSize: 15,
    fontWeight: '600',
  },
  typeSelectorArrow: {
    fontSize: 12,
  },

  // ── Amount
  amountSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  amountLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
  },
  amountDisplay: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },

  // ── Categories
  categorySection: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedCatDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCatDotExpense: { backgroundColor: '#FFE5E5' },
  selectedCatDotIncome: { backgroundColor: '#E8F5E9' },
  catsLoader: { marginVertical: 20 },
  selectedCatDotIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#555',
  },
  selectedCatText: {
    fontSize: 15,
    fontWeight: '600',
  },
  addCategoryIcon: {
    fontSize: 18,
    color: '#aaa',
    fontWeight: '300',
  },
  addCategoryText: {
    fontSize: 14,
    color: '#aaa',
  },
  viewAllCats: {
    fontSize: 13,
    color: '#1E88E5',
    fontWeight: '600',
  },
  frequentLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
    marginBottom: 12,
  },
  chevron: {
    color: '#999',
    fontSize: 11,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryItem: {
    width: '22%',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  catIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catIcon: { fontSize: 26 },
  catName: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── Meta fields
  metaSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  metaIcon: { fontSize: 20 },
  metaContent: { flex: 1 },
  metaLabel: {
    fontSize: 14,
    color: '#333',
  },
  metaTime: {
    fontSize: 14,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginLeft: 36,
  },
  noteInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 0,
    minHeight: 20,
    textAlignVertical: 'center',
  },

  // ── Numpad
  numpad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#ECEFF1',
    borderTopWidth: 1,
    borderTopColor: '#DDD',
  },
  numKey: {
    width: '33.33%',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
    borderRightWidth: 1,
    borderRightColor: '#DDD',
    backgroundColor: '#fff',
  },
  numKeyBackspace: {
    backgroundColor: '#ECEFF1',
  },
  numKeyText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#222',
  },
  numKeyBackspaceText: {
    fontSize: 22,
    color: '#F44336',
  },

  // ── Save button
  saveBtn: {
    marginHorizontal: 12,
    marginBottom: Platform.OS === 'ios' ? 24 : 12,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#F44336',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Type Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 220,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  typeOptionActive: {
    backgroundColor: '#F9F9F9',
  },
  typeOptionIcon: { fontSize: 22 },
  typeOptionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  typeCheck: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '700',
  },
  typeModalDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  typeLoanActive: {
    color: '#FF9800',
    fontWeight: '600',
  },
  // ── Account Selector
  accountSelector: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
    marginTop: 16,
  },
  accountSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  accountSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIconText: {
    fontSize: 20,
  },
  accountSelectorLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  accountSelectorValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  accountSelectorArrow: {
    fontSize: 20,
    color: '#CCC',
  },

  // ── Account Modal
  accountModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  accountModalContent: {
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  accountModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  accountModalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountModalCloseText: {
    fontSize: 24,
    color: '#333',
  },
  accountModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  accountModalSearch: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountModalSearchIcon: {
    fontSize: 18,
  },
  accountModalList: {
    flex: 1,
  },
  accountModalItem: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  accountModalItemActive: {
    backgroundColor: '#F0F8FF',
  },
  accountModalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountModalCheck: {
    fontSize: 18,
    color: '#4A90E2',
    marginRight: 4,
  },
  accountModalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountModalIconText: {
    fontSize: 22,
  },
  accountModalItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  accountModalItemBalance: {
    fontSize: 13,
    color: '#999',
  },
  accountModalFab: {
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
  accountModalFabIcon: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
});
