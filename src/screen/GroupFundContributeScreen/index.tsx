import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { getGroupFundPublic, contributeToGroupFund } from '../../apis/apis';

const DARK = '#252525';
const GREY4 = '#8e8e8e';
const GREY5 = '#4f4f4f';
const PURPLE = '#8662f8';
const GREEN_BG = '#dff8f2';
const GREEN_TEXT = '#0e957e';
const BORDER = '#d1d1d1';
const BG = '#f7f5fa';
const MIN_AMOUNT = 50000;

const BG_IMAGE_MAP: Record<string, any> = {
  bg1: require('../../assets/image/group-fund-backgrounds/bg1.png'),
  bg2: require('../../assets/image/group-fund-backgrounds/bg2.png'),
  bg3: require('../../assets/image/group-fund-backgrounds/bg3.png'),
  bg4: require('../../assets/image/group-fund-backgrounds/bg4.png'),
};

const formatCurrency = (val: string) => {
  const num = val.replace(/\D/g, '');
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseCurrency = (val: string) => parseInt(val.replace(/\./g, ''), 10) || 0;

const formatDisplay = (n: number) => n.toLocaleString('vi-VN') + 'đ';

const GroupFundContributeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { fundId, amount: initAmount = '', note: initNote = '' } = route.params ?? {};

  const [fund, setFund] = useState<any>(null);
  const [loadingFund, setLoadingFund] = useState(true);
  const [amount, setAmount] = useState(
    initAmount ? formatCurrency(String(initAmount)) : '',
  );
  const [note, setNote] = useState(initNote ?? '');
  const [submitting, setSubmitting] = useState(false);

  const loadFund = useCallback(async () => {
    if (!fundId) return;
    try {
      setLoadingFund(true);
      const res = await getGroupFundPublic(fundId);
      if (res.success) setFund(res.data);
    } catch (e: any) {
      Alert.alert('Lỗi', e?.response?.data?.message ?? 'Không tải được thông tin quỹ');
    } finally {
      setLoadingFund(false);
    }
  }, [fundId]);

  useFocusEffect(useCallback(() => { loadFund(); }, [loadFund]));

  const handleConfirm = () => {
    const amountNum = parseCurrency(amount);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số tiền đóng góp');
      return;
    }
    if (amountNum < MIN_AMOUNT) {
      Alert.alert('Số tiền quá nhỏ', `Tối thiểu mỗi lần đóng góp là ${formatDisplay(MIN_AMOUNT)}`);
      return;
    }

    Alert.alert(
      'Xác nhận đóng góp',
      `Góp ${formatDisplay(amountNum)} vào ${fund?.name ?? 'quỹ nhóm'}${note ? `\nLời nhắn: ${note}` : ''}`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            setSubmitting(true);
            try {
              await contributeToGroupFund(fundId, { amount: amountNum, note: note.trim() || undefined });
              Alert.alert(
                'Thành công 🎉',
                `Đã góp ${formatDisplay(amountNum)} vào ${fund?.name}!`,
                [{ text: 'Đóng', onPress: () => navigation.navigate('ScanMain') }],
              );
            } catch (error: any) {
              const msg = error?.response?.data?.message ?? 'Đóng góp thất bại, vui lòng thử lại.';
              const isBalanceError = msg.includes('Số dư ví');
              Alert.alert(isBalanceError ? 'Số dư không đủ' : 'Lỗi', msg);
            } finally {
              setSubmitting(false);
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
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Góp quỹ nhóm</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Fund info card ───────────────────────────────────────────── */}
        {loadingFund ? (
          <ActivityIndicator color={DARK} style={styles.loader} />
        ) : fund ? (
          <View style={styles.fundCard}>
            <View style={styles.fundCardBg}>
              {BG_IMAGE_MAP[fund.emoji] ? (
                <Image source={BG_IMAGE_MAP[fund.emoji]} style={styles.fundBgImage} resizeMode="cover" />
              ) : (
                <View style={styles.fundBgFallback} />
              )}
              <View style={styles.fundBgOverlay} />
            </View>
            <View style={styles.fundCardContent}>
              <Text style={styles.fundCardName}>{fund.name}</Text>
              <View style={styles.fundCardBalance}>
                <Text style={styles.fundCardBalanceLabel}>Số dư quỹ</Text>
                <Text style={styles.fundCardBalanceValue}>
                  {fund.currentAmount.toLocaleString('vi-VN')}đ
                </Text>
              </View>
              <View style={styles.memberCountRow}>
                <Text style={styles.memberCountText}>👥 {fund.members?.length ?? 0} thành viên</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.fundNotFound}>
            <Text style={styles.fundNotFoundText}>Không tìm thấy thông tin quỹ</Text>
          </View>
        )}

        {/* ── Amount card ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Số tiền đóng góp</Text>
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
            <Text style={styles.amountDisplay}>{formatDisplay(parseCurrency(amount))}</Text>
          )}
          <View style={styles.minAmountRow}>
            <Text style={styles.minAmountText}>Tối thiểu </Text>
            <Text style={styles.minAmountBold}>{formatDisplay(MIN_AMOUNT)}</Text>
          </View>
        </View>

        {/* ── Note card ────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Lời nhắn</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Nhập lời nhắn (không bắt buộc)"
            placeholderTextColor="#bbb"
            value={note}
            onChangeText={setNote}
            maxLength={50}
          />
          <Text style={styles.charCount}>{note.length}/50</Text>
        </View>

        {/* ── Confirm button ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.confirmBtn, (submitting || loadingFund) && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting || loadingFund}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.confirmBtnText}>✓  Xác nhận đóng góp</Text>
          )}
        </TouchableOpacity>

        {/* ── Info row ──────────────────────────────────────────────────── */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Số tiền sẽ được trừ từ ví của bạn và cộng trực tiếp vào quỹ nhóm.
          </Text>
        </View>
      </ScrollView>

      {/* ── Home indicator ───────────────────────────────────────────── */}
      <View style={styles.homeBar}>
        <View style={styles.homeIndicator} />
      </View>
    </KeyboardAvoidingView>
  );
};

export default GroupFundContributeScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    height: Platform.OS === 'ios' ? 99 : 68,
    backgroundColor: BG,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: DARK, lineHeight: 34 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: DARK, flex: 1, textAlign: 'center' },

  loader: { marginTop: 24, alignSelf: 'center' },
  scroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 12 },

  // ── Fund card
  fundCard: {
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  fundCardBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fundBgImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  fundBgFallback: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', backgroundColor: '#d5c8ff' },
  fundBgOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fundCardContent: {
    flex: 1, padding: 16,
    justifyContent: 'space-between',
  },
  fundCardName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  fundCardBalance: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fundCardBalanceLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  fundCardBalanceValue: { fontSize: 14, fontWeight: '600', color: '#fff' },
  memberCountRow: {},
  memberCountText: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  fundNotFound: { alignItems: 'center', padding: 24 },
  fundNotFoundText: { fontSize: 14, color: GREY4 },

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
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  amountInput: {
    flex: 1, fontSize: 28, fontWeight: '700', color: DARK,
    borderBottomWidth: 1.5, borderColor: PURPLE,
    paddingVertical: 4, padding: 0,
  },
  amountUnit: { fontSize: 18, fontWeight: '400', color: GREY4 },
  amountDisplay: { fontSize: 13, color: GREY5 },
  minAmountRow: { flexDirection: 'row' },
  minAmountText: { fontSize: 12, color: GREY4 },
  minAmountBold: { fontSize: 12, fontWeight: '600', color: PURPLE },
  noteInput: {
    height: 48, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16,
    fontSize: 16, color: DARK,
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  charCount: { fontSize: 12, color: '#a5a5a5', textAlign: 'right' },

  // ── Confirm button
  confirmBtn: {
    height: 52, borderRadius: 100,
    backgroundColor: DARK,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: DARK, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 6 },
    }),
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  // ── Info box
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: GREEN_BG, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  infoIcon: { fontSize: 16, lineHeight: 22 },
  infoText: { flex: 1, fontSize: 13, color: GREEN_TEXT, lineHeight: 20 },

  // ── Home indicator
  homeBar: { height: 32, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8 },
  homeIndicator: { width: 134, height: 5, borderRadius: 100, backgroundColor: DARK },
});
