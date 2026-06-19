import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { BaseContainer } from 'react-native-shared-components';
import { useFocusEffect } from '@react-navigation/native';
import { createDepositRequest, getMyDepositRequests } from '../../apis/apis';
import type { DepositRequest } from '../../apis/types';

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatVND = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n) + ' ₫';

const formatDate = (d: string) =>
  new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_MAP: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: { label: 'Đang chờ', color: '#F59E0B', bg: '#FEF3C7', icon: '⏳' },
  approved: { label: 'Đã duyệt', color: '#10B981', bg: '#D1FAE5', icon: '✅' },
  rejected: {
    label: 'Đã từ chối',
    color: '#EF4444',
    bg: '#FEE2E2',
    icon: '❌',
  },
};
const getStatus = (s: string) =>
  STATUS_MAP[s] ?? { label: s, color: '#6B7280', bg: '#F3F4F6', icon: '❓' };

// ── Sub-components (defined OUTSIDE to avoid focus loss) ─────────────────────
const QuickAmountBtn = ({
  value,
  selected,
  onPress,
}: {
  value: number;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.quickBtn, selected && styles.quickBtnActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.quickBtnText, selected && styles.quickBtnTextActive]}>
      {value >= 1000000 ? `${value / 1000000}M` : `${value / 1000}K`}
    </Text>
  </TouchableOpacity>
);

const RequestCard = ({ item }: { item: DepositRequest }) => {
  const st = getStatus(item.status);
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardAmount}>+{formatVND(item.amount)}</Text>
          <Text style={styles.cardDesc} numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: st.bg }]}>
          <Text style={styles.badgeIcon}>{st.icon}</Text>
          <Text style={[styles.badgeText, { color: st.color }]}>
            {st.label}
          </Text>
        </View>
      </View>
      <View style={styles.cardDivider} />
      <View style={styles.cardBottom}>
        <Text style={styles.cardDate}>🕐 {formatDate(item.createdAt)}</Text>
        {item.processedAt && (
          <Text style={styles.cardProcessed}>
            Xử lý: {formatDate(item.processedAt)}
          </Text>
        )}
      </View>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export const DepositRequestScreen = ({ navigation }: any) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const numericAmount = Number(amount.replace(/\D/g, ''));

  const loadRequests = useCallback(async () => {
    try {
      const res = await getMyDepositRequests();
      if (res.success) setRequests(res.data);
    } catch (e) {
      console.error('Load requests error:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleAmountChange = (text: string) => {
    const digits = text.replace(/\D/g, '');
    setAmount(digits);
  };

  const handleSubmit = async () => {
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (numericAmount < 10000) {
      Alert.alert('Lỗi', 'Số tiền tối thiểu là 10.000 ₫');
      return;
    }
    setLoading(true);
    try {
      const res = await createDepositRequest(
        numericAmount,
        description.trim() || 'Yêu cầu nạp tiền',
      );
      if (res.success) {
        Alert.alert(
          '✅ Gửi thành công',
          'Yêu cầu đã được gửi. Admin sẽ xác nhận sớm nhất.',
        );
        setAmount('');
        setDescription('');
        await loadRequests();
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể tạo yêu cầu');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const isValid = numericAmount >= 10000;

  const ListHeader = (
    <View>
      {/* ── Form card ── */}
      <View style={styles.formCard}>
        {/* Amount input */}
        <Text style={styles.fieldLabel}>Số tiền nạp</Text>
        <View style={styles.amountRow}>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor="#CBD5E1"
            keyboardType="numeric"
            value={
              numericAmount > 0
                ? formatVND(numericAmount).replace(' ₫', '')
                : amount
            }
            onChangeText={handleAmountChange}
            editable={!loading}
          />
          <Text style={styles.currency}>₫</Text>
        </View>

        {/* Quick amounts */}
        <View style={styles.quickRow}>
          {QUICK_AMOUNTS.map(v => (
            <QuickAmountBtn
              key={v}
              value={v}
              selected={numericAmount === v}
              onPress={() => handleQuickAmount(v)}
            />
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Description */}
        <Text style={styles.fieldLabel}>Ghi chú (tuỳ chọn)</Text>
        <TextInput
          style={styles.descInput}
          placeholder="Ví dụ: Nạp tiền tháng 6..."
          placeholderTextColor="#CBD5E1"
          multiline
          numberOfLines={2}
          value={description}
          onChangeText={setDescription}
          editable={!loading}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitIcon}>💸</Text>
              <Text style={styles.submitText}>Gửi yêu cầu</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Note */}
        {/* <View style={styles.noteRow}>
          <Text style={styles.noteText}>
            ℹ️  Yêu cầu sẽ được admin xác nhận trong thời gian sớm nhất
          </Text>
        </View> */}
      </View>

      {/* ── History header ── */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Lịch sử yêu cầu</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{requests.length}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <BaseContainer
      isHeader
      barStyle="dark-content"
      left={
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
      }
      center={<Text style={styles.headerTitle}>Nạp tiền</Text>}
      right={<View style={{ width: 40 }} />}
      style={styles.safeArea}
    >
      <FlatList
        data={requests}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <RequestCard item={item} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6366F1"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Chưa có yêu cầu nào</Text>
            <Text style={styles.emptyDesc}>
              Tạo yêu cầu nạp tiền ở trên để bắt đầu
            </Text>
          </View>
        }
      />
    </BaseContainer>
  );
};

const ACCENT = '#6366F1';

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F1F5F9' },

  // ── Header ──
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 28, color: '#1E293B', lineHeight: 34, marginTop: -2 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },

  // ── List ──
  listContent: { paddingBottom: 32 },

  // ── Form card ──
  formCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#6366F1',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 10,
    letterSpacing: 0.3,
  },

  // Amount
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
    paddingBottom: 8,
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    padding: 0,
  },
  currency: { fontSize: 22, fontWeight: '700', color: ACCENT, marginLeft: 6 },

  // Quick amounts
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  quickBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  quickBtnActive: {
    borderColor: ACCENT,
    backgroundColor: '#EEF2FF',
  },
  quickBtnText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  quickBtnTextActive: { color: ACCENT },

  // Divider
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 20 },

  // Description
  descInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: '#1E293B',
    textAlignVertical: 'top',
    minHeight: 72,
    marginBottom: 20,
    backgroundColor: '#F8FAFC',
  },

  // Submit button
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    shadowColor: ACCENT,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitBtnDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitIcon: { fontSize: 18 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Note
  noteRow: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
  },
  noteText: { fontSize: 12, color: '#3B82F6', lineHeight: 18 },

  // ── History ──
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  countBadge: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // ── Request card ──
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardLeft: { flex: 1, marginRight: 12 },
  cardAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
    marginBottom: 4,
  },
  cardDesc: { fontSize: 13, color: '#64748B' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  badgeIcon: { fontSize: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 10 },
  cardBottom: { gap: 4 },
  cardDate: { fontSize: 12, color: '#94A3B8' },
  cardProcessed: { fontSize: 12, color: '#6B7280' },

  // ── Empty state ──
  emptyWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center' },
});

export default DepositRequestScreen;
