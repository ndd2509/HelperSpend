import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { parsePhoneQR } from '../../utils/vietqr';
import { spendFromGroupFund } from '../../apis/apis';

const DARK = '#252525';
const GREY4 = '#8e8e8e';
const PURPLE = '#8662f8';
const RED = '#e53935';
const RED_BG = '#fdecea';

const formatCurrency = (val: string) => {
  const num = val.replace(/\D/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseCurrency = (val: string) => parseInt(val.replace(/\./g, ''), 10) || 0;

const formatDisplay = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n) + 'đ';

// ─── Component ────────────────────────────────────────────────────────────────
const GroupFundSpendScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    qrValue,
    fundId,
    fundName,
    fundAmount,
  } = route.params as {
    qrValue: string;
    fundId: string;
    fundName: string;
    fundAmount: number;
  };

  const parsed = parsePhoneQR(qrValue);

  const [amount, setAmount] = useState(
    parsed.amount ? formatCurrency(String(parsed.amount)) : '',
  );
  const [note, setNote] = useState(parsed.description ?? '');
  const [loading, setLoading] = useState(false);

  const recipientName = parsed.name
    ? parsed.name.charAt(0) + parsed.name.slice(1).toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    : parsed.phone ?? 'Không rõ';

  const handleConfirm = () => {
    const amountNum = parseCurrency(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền cần chi');
      return;
    }
    if (amountNum > fundAmount) {
      Alert.alert(
        'Số dư quỹ không đủ',
        `Số dư hiện tại của quỹ là ${formatDisplay(fundAmount)}. Vui lòng nhập số tiền nhỏ hơn hoặc bằng số dư quỹ.`,
      );
      return;
    }
    if (!parsed.phone) {
      Alert.alert('Lỗi', 'Không xác định được số điện thoại người nhận');
      return;
    }

    Alert.alert(
      'Xác nhận chi quỹ',
      `Chi ${formatDisplay(amountNum)} từ quỹ "${fundName}" đến ${recipientName}${note ? `\nNội dung: ${note}` : ''}`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setLoading(true);
            try {
              await spendFromGroupFund(fundId, {
                recipientPhone: parsed.phone!,
                amount: amountNum,
                note: note.trim() || undefined,
              });

              Alert.alert(
                'Chi quỹ thành công 🎉',
                `Đã chi ${formatDisplay(amountNum)} từ quỹ "${fundName}" đến ${recipientName}`,
                [
                  {
                    text: 'Đóng',
                    onPress: () => {
                      // Quay về GroupFundDetail để reload
                      navigation.pop(2);
                    },
                  },
                ],
              );
            } catch (error: any) {
              const errMsg =
                error?.response?.data?.message ||
                'Chi quỹ thất bại. Vui lòng thử lại.';
              Alert.alert('Lỗi', errMsg);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi quỹ</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Nguồn tiền (Fund) ── */}
        <View style={styles.fundBadgeCard}>
          <View style={styles.fundBadgeLeft}>
            <Text style={styles.fundBadgeIcon}>💳</Text>
            <View style={styles.fundBadgeInfo}>
              <Text style={styles.fundBadgeLabel}>Nguồn tiền</Text>
              <Text style={styles.fundBadgeName}>{fundName}</Text>
            </View>
          </View>
          <View style={styles.fundBadgeBalanceWrap}>
            <Text style={styles.fundBadgeBalanceLabel}>Số dư</Text>
            <Text style={styles.fundBadgeBalance}>{formatDisplay(fundAmount)}</Text>
          </View>
        </View>

        {/* ── Người nhận ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Người nhận</Text>
          <View style={styles.recipientRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarChar}>
                {recipientName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientName}>{recipientName}</Text>
              {parsed.phone && (
                <Text style={styles.recipientPhone}>{parsed.phone}</Text>
              )}
              {parsed.isVietQR && (
                <View style={styles.vietqrBadge}>
                  <Text style={styles.vietqrText}>VietQR · Chuyển khoản nhanh</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Số tiền ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Số tiền chi</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={amount}
              onChangeText={v => setAmount(formatCurrency(v))}
            />
            <Text style={styles.amountUnit}>đ</Text>
          </View>
          {amount !== '' && parseCurrency(amount) > 0 && (
            <Text style={styles.amountDisplay}>
              {formatDisplay(parseCurrency(amount))}
            </Text>
          )}
          {amount !== '' && parseCurrency(amount) > fundAmount && (
            <View style={styles.overBudgetWarn}>
              <Text style={styles.overBudgetWarnText}>
                ⚠️ Vượt quá số dư quỹ ({formatDisplay(fundAmount)})
              </Text>
            </View>
          )}
        </View>

        {/* ── Ghi chú ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Nội dung chi</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Ví dụ: Mua nguyên liệu, trả phí thuê phòng..."
            placeholderTextColor="#bbb"
            value={note}
            onChangeText={setNote}
            maxLength={50}
          />
          <Text style={styles.charCount}>{note.length}/50</Text>
        </View>

        {/* ── Non-VietQR warning ── */}
        {!parsed.isVietQR && (
          <View style={styles.warnBox}>
            <Text style={styles.warnText}>
              ⚠️ Mã QR này không phải chuẩn VietQR. Vui lòng kiểm tra thông tin trước khi xác nhận.
            </Text>
          </View>
        )}

        {/* ── Info box ── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Số tiền sẽ được trừ trực tiếp từ quỹ nhóm và ghi nhận là khoản chi quỹ.
          </Text>
        </View>

        {/* ── Nút xác nhận ── */}
        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmBtnText}>✓  Xác nhận chi quỹ</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── Home indicator ── */}
      <View style={styles.homeBar}>
        <View style={styles.homeIndicator} />
      </View>
    </KeyboardAvoidingView>
  );
};

export default GroupFundSpendScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f5fa' },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    height: Platform.OS === 'ios' ? 99 : 68,
    backgroundColor: '#f7f5fa',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: DARK, lineHeight: 34 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: DARK, flex: 1, textAlign: 'center' },

  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 12 },

  // ── Fund badge card
  fundBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: RED_BG,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: RED,
  },
  fundBadgeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  fundBadgeIcon: { fontSize: 28 },
  fundBadgeInfo: { flex: 1 },
  fundBadgeLabel: { fontSize: 12, color: RED, fontWeight: '500', marginBottom: 2 },
  fundBadgeName: { fontSize: 16, fontWeight: '700', color: DARK },
  fundBadgeBalanceWrap: { alignItems: 'flex-end' },
  fundBadgeBalanceLabel: { fontSize: 11, color: GREY4, marginBottom: 2 },
  fundBadgeBalance: { fontSize: 14, fontWeight: '700', color: RED },

  // ── Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: DARK, lineHeight: 21 },

  // ── Recipient
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarChar: { fontSize: 22, color: '#fff', fontWeight: '700' },
  recipientInfo: { flex: 1 },
  recipientName: { fontSize: 17, fontWeight: '700', color: DARK, marginBottom: 2 },
  recipientPhone: { fontSize: 14, color: GREY4, marginBottom: 6 },
  vietqrBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  vietqrText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },

  // ── Amount
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: PURPLE,
    paddingBottom: 6,
  },
  amountInput: {
    flex: 1, fontSize: 28, fontWeight: '700', color: DARK,
    padding: 0,
  },
  amountUnit: { fontSize: 18, fontWeight: '400', color: GREY4 },
  amountDisplay: { fontSize: 13, color: GREY4 },
  overBudgetWarn: {
    backgroundColor: RED_BG,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  overBudgetWarnText: { fontSize: 12, color: RED, fontWeight: '600' },

  // ── Note
  noteInput: {
    height: 48, borderRadius: 16,
    borderWidth: 1, borderColor: '#d1d1d1',
    paddingHorizontal: 16,
    fontSize: 15, color: DARK,
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  charCount: { fontSize: 12, color: '#a5a5a5', textAlign: 'right' },

  // ── Warning
  warnBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB300',
  },
  warnText: { fontSize: 13, color: '#7B6000', lineHeight: 18 },

  // ── Info box
  infoBox: {
    backgroundColor: '#dff8f2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  infoText: { fontSize: 13, color: '#0e957e', lineHeight: 20 },

  // ── Confirm button
  confirmBtn: {
    height: 52, borderRadius: 100,
    backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: RED, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  // ── Home indicator
  homeBar: { height: 32, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8 },
  homeIndicator: { width: 134, height: 5, borderRadius: 100, backgroundColor: DARK },
});
