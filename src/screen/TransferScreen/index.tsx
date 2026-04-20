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
import { requestTransfer } from '../../apis/apis';

const formatCurrency = (val: string) => {
  const num = val.replace(/\D/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseCurrency = (val: string) => val.replace(/\./g, '');

const formatDisplay = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n) + ' ₫';

// ─── Component ────────────────────────────────────────────────────────────────
const TransferScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { qrValue } = route.params as { qrValue: string };

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
    const amountNum = Number(parseCurrency(amount));
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền cần chuyển');
      return;
    }

    if (!parsed.phone) {
      Alert.alert('Lỗi', 'Không xác định được số điện thoại người nhận');
      return;
    }

    Alert.alert(
      'Xác nhận chuyển tiền',
      `Chuyển ${formatDisplay(amountNum)} đến ${recipientName}${note ? `\nNội dung: ${note}` : ''}`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await requestTransfer({
                recipientPhone: parsed.phone!,
                amount: amountNum,
                note: note.trim() || undefined,
              });

              // Navigate to success screen
              navigation.replace('TransferSuccess', {
                recipientName,
                recipientPhone: parsed.phone,
                amount: amountNum,
                note: note.trim(),
                transferId: result.data?.transfer?.id || '',
              });
            } catch (error: any) {
              const errMsg =
                error?.response?.data?.message ||
                'Chuyển tiền thất bại. Vui lòng thử lại.';
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuyển tiền</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Recipient card */}
        <View style={styles.recipientCard}>
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

        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Số tiền</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#ccc"
              keyboardType="numeric"
              value={amount}
              onChangeText={v => setAmount(formatCurrency(v))}
            />
            <Text style={styles.amountUnit}>₫</Text>
          </View>
          {amount !== '' && Number(parseCurrency(amount)) > 0 && (
            <Text style={styles.amountDisplay}>
              {formatDisplay(Number(parseCurrency(amount)))}
            </Text>
          )}
        </View>

        {/* Note */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Nội dung chuyển khoản</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Ví dụ: Trả tiền ăn"
            placeholderTextColor="#bbb"
            value={note}
            onChangeText={setNote}
            maxLength={50}
          />
          <Text style={styles.charCount}>{note.length}/50</Text>
        </View>

        {/* Non-VietQR warning */}
        {!parsed.isVietQR && (
          <View style={styles.warnBox}>
            <Text style={styles.warnText}>
              ⚠️ Mã QR này không phải chuẩn VietQR. Vui lòng kiểm tra thông tin trước khi xác nhận.
            </Text>
          </View>
        )}

        {/* Confirm button */}
        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmBtnText}>Xác nhận chuyển tiền</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default TransferScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F6FA' },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 28, color: '#333', lineHeight: 32 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },

  scroll: { padding: 16, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },

  // ── Recipient
  recipientCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  recipientRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#5C6BC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: { fontSize: 22, color: '#fff', fontWeight: '700' },
  recipientInfo: { flex: 1 },
  recipientName: { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  recipientPhone: { fontSize: 14, color: '#666', marginBottom: 6 },
  vietqrBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  vietqrText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },

  // ── Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },

  // ── Amount
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#5C6BC0',
    paddingBottom: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A2E',
    padding: 0,
  },
  amountUnit: { fontSize: 20, color: '#888', fontWeight: '600', marginLeft: 4 },
  amountDisplay: {
    fontSize: 13,
    color: '#5C6BC0',
    marginTop: 6,
    fontWeight: '600',
  },

  // ── Note
  noteInput: {
    fontSize: 15,
    color: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FAFAFA',
  },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 },

  // ── Warning
  warnBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFB300',
  },
  warnText: { fontSize: 13, color: '#7B6000', lineHeight: 18 },

  // ── Confirm
  confirmBtn: {
    backgroundColor: '#5C6BC0',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: '#5C6BC0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10 },
      android: { elevation: 8 },
    }),
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
