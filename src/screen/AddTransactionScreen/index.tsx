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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BaseContainer } from 'react-native-shared-components';
import { createTransaction, getCategories } from '../../apis/apis';
import type { Category } from '../../apis/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type TransactionType = 'expense' | 'income';

// ─── Numpad ───────────────────────────────────────────────────────────────────
const NUMPAD_KEYS = [
  '7', '8', '9',
  '4', '5', '6',
  '1', '2', '3',
  '.', '0', '⌫',
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
  const route = useRoute<any>();
  const initialType: TransactionType = route.params?.type || 'expense';

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [note, setNote] = useState('');
  const [date] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Quick categories loaded from API
  const [quickCats, setQuickCats] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);

  // Load quick categories from API when type changes
  useEffect(() => {
    setSelectedCategory(null);
    loadQuickCats(type);
  }, [type]);

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



  // Receive selected category back from SelectCategoryScreen
  const routeParams = route.params as any;
  React.useEffect(() => {
    if (routeParams?.selectedCategory) {
      setSelectedCategory(routeParams.selectedCategory);
    }
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
      });
      Alert.alert(
        'Thành công',
        `Đã thêm ${type === 'expense' ? 'chi tiêu' : 'thu nhập'} thành công!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
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
  const accentColor = isExpense ? '#F44336' : '#4CAF50';

  return (
    <BaseContainer style={styles.container} edges={['top']}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtnIcon}>←</Text>
        </TouchableOpacity>

        {/* Type selector (dropdown pill) */}
        <TouchableOpacity
          style={[styles.typeSelector, { borderColor: accentColor }]}
          onPress={() => setShowTypeModal(true)}
        >
          <Text style={[styles.typeSelectorText, { color: accentColor }]}>
            {isExpense ? 'Chi tiêu' : 'Thu nhập'}
          </Text>
          <Text style={[styles.typeSelectorArrow, { color: accentColor }]}> ▾</Text>
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

          {/* ── CATEGORY ───────────────────────────────────────────────── */}
          <View style={styles.categorySection}>
            {/* Header row — tap to open full SelectCategoryScreen */}
            <TouchableOpacity
              style={styles.categoryHeader}
              onPress={() => navigation.navigate('SelectCategory', { type })}
            >
              <View style={styles.addCategoryBtn}>
                {selectedCategory ? (
                  <>
                    <View style={[styles.selectedCatDot, isExpense ? styles.selectedCatDotExpense : styles.selectedCatDotIncome]}>
                      <Text style={styles.selectedCatDotIcon}>
                        {selectedCategory.icon || selectedCategory.name.charAt(0)}
                      </Text>
                    </View>
                    <Text style={[styles.selectedCatText, { color: accentColor }]}>
                      {selectedCategory.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.addCategoryIcon}>＋</Text>
                    <Text style={styles.addCategoryText}>Chọn hạng mục</Text>
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
              <ActivityIndicator size="small" color="#1E88E5" style={styles.catsLoader} />
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
                      <View style={[
                        styles.catIconWrap,
                        isSelected && { backgroundColor: accentColor + '20' },
                      ]}>
                        <Text style={styles.catIcon}>{cat.icon || '📌'}</Text>
                      </View>
                      <Text style={[styles.catName, isSelected && { color: accentColor }]} numberOfLines={2}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>



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

          {/* Spacer for numpad */}
          <View style={styles.numpadSpacer} />
        </ScrollView>

        {/* ── NUMPAD ─────────────────────────────────────────────────────── */}
        <View style={styles.numpad}>
          {NUMPAD_KEYS.map(key => (
            <TouchableOpacity
              key={key}
              style={[
                styles.numKey,
                key === '⌫' && styles.numKeyBackspace,
              ]}
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
          </View>
        </TouchableOpacity>
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
});
