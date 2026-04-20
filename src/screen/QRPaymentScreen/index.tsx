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
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { buildPhoneQR } from '../../utils/vietqr';

const formatCurrency = (val: string) => {
  const num = val.replace(/\D/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseCurrency = (val: string) => val.replace(/\./g, '');

// ─── Component ────────────────────────────────────────────────────────────────
const QRPaymentScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const qrValue = user?.phone
    ? buildPhoneQR({
        phone: user.phone,
        accountName: user.name,
        amount: parseCurrency(amount) ? Number(parseCurrency(amount)) : undefined,
        description: note.trim() || undefined,
      })
    : '';

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
        <Text style={styles.headerTitle}>Mã QR Thanh toán</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* QR Card */}
        <View style={styles.qrCard}>
          {/* VietQR Badge */}
          <View style={styles.vietqrBadge}>
            <Text style={styles.vietqrText}>VIET</Text>
            <Text style={[styles.vietqrText, { color: '#E53935' }]}>QR</Text>
          </View>

          {/* User info */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarChar}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
          <Text style={styles.phoneLabel}>{user?.phone}</Text>

          {/* QR code */}
          <View style={styles.qrWrap}>
            {qrValue ? (
              <QRCode
                value={qrValue}
                size={210}
                color="#1A1A2E"
                backgroundColor="#fff"
                ecl="M"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderEmoji}>📵</Text>
                <Text style={styles.qrPlaceholderText}>Không có thông tin người dùng</Text>
              </View>
            )}
          </View>

          <Text style={styles.qrHint}>
            Người khác quét mã để chuyển tiền cho bạn
          </Text>
        </View>

        {/* Optional fields */}
        <View style={styles.optCard}>
          <Text style={styles.optTitle}>Tùy chỉnh mã QR</Text>

          <Text style={styles.inputLabel}>Số tiền (không bắt buộc)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#bbb"
              keyboardType="numeric"
              value={amount}
              onChangeText={v => setAmount(formatCurrency(v))}
            />
            <Text style={styles.inputUnit}>₫</Text>
          </View>

          <Text style={styles.inputLabel}>Nội dung chuyển khoản</Text>
          <TextInput
            style={[styles.input, styles.inputFull]}
            placeholder="Ví dụ: Trả tiền ăn"
            placeholderTextColor="#bbb"
            value={note}
            onChangeText={setNote}
            maxLength={25}
          />
          <Text style={styles.charCount}>{note.length}/25</Text>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Mã QR được tạo theo chuẩn VietQR (QRIBFTTC) từ số điện thoại — tương thích với hầu hết ứng dụng ngân hàng Việt Nam.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default QRPaymentScreen;

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

  // ── Scroll
  scroll: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // ── QR Card
  qrCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  vietqrBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 16,
  },
  vietqrText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1565C0',
    letterSpacing: 0.5,
  },
  avatarWrap: { marginBottom: 10 },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5C6BC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChar: { fontSize: 24, color: '#fff', fontWeight: '700' },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  phoneLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  qrWrap: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPlaceholderEmoji: { fontSize: 40, marginBottom: 12 },
  qrPlaceholderText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  qrHint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },

  // ── Optional fields card
  optCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  optTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: '#1A1A2E',
  },
  inputUnit: {
    fontSize: 15,
    color: '#888',
    marginLeft: 4,
  },
  inputFull: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    height: 44,
  },
  charCount: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'right',
    marginTop: 4,
  },

  // ── Info box
  infoBox: {
    width: '100%',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
  },
  infoText: {
    fontSize: 13,
    color: '#5C6BC0',
    lineHeight: 19,
  },
});
