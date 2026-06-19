import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

const DARK = '#252525';
const GREY4 = '#8e8e8e';
const GREY5 = '#4f4f4f';
const PURPLE = '#8662f8';
const YELLOW_BG = '#fff9eb';
const BORDER = '#d1d1d1';

const formatAmountDisplay = (v: string) => {
  const num = parseInt(v.replace(/\D/g, ''), 10);
  if (isNaN(num)) return '0';
  return num.toLocaleString('vi-VN');
};

const GradientBackground = () => (
  <Svg
    style={StyleSheet.absoluteFillObject}
    width="100%"
    height="100%"
    preserveAspectRatio="none"
  >
    <Defs>
      <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#d7d4ff" stopOpacity="1" />
        <Stop offset="1" stopColor="#ffffff" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Rect x="0" y="0" width="100%" height="100%" fill="url(#bgGrad)" />
  </Svg>
);

const QrGroupFundScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { fundId, fundName, ownerName, accountNumber } = route.params ?? {};

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAmount, setModalAmount] = useState('');
  const [modalNote, setModalNote] = useState('');

  const buildQrValue = (a: string, n: string) => {
    const base = `helperSpend://group-fund/${fundId ?? 'unknown'}`;
    const params: string[] = [];
    if (a) params.push(`amount=${a}`);
    if (n) params.push(`note=${encodeURIComponent(n)}`);
    return params.length ? `${base}?${params.join('&')}` : base;
  };

  const qrValue = buildQrValue(amount, note);

  const openModal = () => {
    setModalAmount(amount);
    setModalNote(note);
    setShowModal(true);
  };

  const handleSave = () => {
    if (modalAmount && parseInt(modalAmount, 10) < 50000) {
      Alert.alert('Lỗi', 'Số tiền tối thiểu là 50.000đ');
      return;
    }
    setAmount(modalAmount);
    setNote(modalNote);
    setShowModal(false);
  };

  const handleDownload = () => Alert.alert('Tải mã', 'Tính năng sắp ra mắt');
  const handleShare = () => Alert.alert('Chia sẻ', 'Tính năng sắp ra mắt');
  const handleCopyAccount = () => Alert.alert('Đã sao chép', accountNumber ?? '');

  const hasContent = amount || note;

  return (
    <View style={styles.root}>
      <GradientBackground />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerSub}>Quét mã để góp vào</Text>
          <Text style={styles.headerFund} numberOfLines={1}>{fundName ?? 'Quỹ nhóm'}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      {/* ── Scrollable content ───────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── QR Card ────────────────────────────────────────────────── */}
        <View style={styles.qrCard}>
          {/* Bank info */}
          <View style={styles.bankRow}>
            <Text style={styles.bankLogoText}>🏦 MB</Text>
          </View>
          <Text style={styles.ownerName}>{fundName}</Text>
          <View style={styles.accountRow}>
            {/* <Text style={styles.accountNumber}>{accountNumber ?? 'MBB99132513687280'}</Text> */}
            <TouchableOpacity onPress={handleCopyAccount} style={styles.copyBtn}>
              <Text style={styles.copyIcon}>⧉</Text>
            </TouchableOpacity>
          </View>

          {/* Logos */}
          <View style={styles.logosRow}>
            <View style={styles.logoPill}>
              <Text style={styles.logoText}>napas</Text>
            </View>
            <View style={[styles.logoPill, styles.logoPillVietqr]}>
              <Text style={[styles.logoText, styles.logoTextVietqr]}>VietQR</Text>
            </View>
          </View>

          {/* QR Code */}
          <View style={styles.qrWrap}>
            <QRCode
              value={qrValue}
              size={180}
              color={DARK}
              backgroundColor="white"
              ecl="M"
            />
          </View>

          {/* Fund name */}
          <Text style={styles.qrFundName}>{fundName ?? 'Quỹ nhóm'}</Text>

          {/* Note/amount pill */}
          {hasContent ? (
            <TouchableOpacity style={styles.contentPill} onPress={openModal} activeOpacity={0.8}>
              <Text style={styles.contentPillIcon}>✎</Text>
              <Text style={styles.contentPillText} numberOfLines={1}>
                {amount ? `${formatAmountDisplay(amount)}đ` : ''}
                {amount && note ? '  •  ' : ''}
                {note ?? ''}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.addContentPill} onPress={openModal} activeOpacity={0.8}>
              <Text style={styles.addContentIcon}>✎</Text>
              <Text style={styles.addContentText}>Thêm nội dung</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Warning box ──────────────────────────────────────────────── */}
        <View style={styles.warnBox}>
          <Text style={styles.warnIcon}>⚠️</Text>
          <Text style={styles.warnText}>
            Số tiền tối thiểu mỗi giao dịch chuyển vào quỹ là{' '}
            <Text style={styles.warnBold}>50.000đ</Text>
          </Text>
        </View>
      </ScrollView>

      {/* ── Bottom buttons ───────────────────────────────────────────── */}
      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.downloadBtn} onPress={handleDownload} activeOpacity={0.85}>
          <Text style={styles.downloadIcon}>⬇</Text>
          <Text style={styles.downloadText}>Tải mã</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.shareIcon}>⤴</Text>
          <Text style={styles.shareText}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>

      {/* ── Home indicator ───────────────────────────────────────────── */}
      <View style={styles.homeBar}>
        <View style={styles.homeIndicator} />
      </View>

      {/* ── Modal: Thêm nội dung ─────────────────────────────────────── */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKAV}
          >
            <View style={styles.modalSheet}>
              {/* Modal header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Thêm nội dung</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowModal(false)}
                >
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Amount section */}
              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Nhập số tiền</Text>
                <View style={styles.amountInputRow}>
                  <TextInput
                    style={styles.amountInput}
                    value={modalAmount}
                    onChangeText={v => setModalAmount(v.replace(/\D/g, ''))}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={DARK}
                    textAlign="center"
                  />
                  <Text style={styles.amountUnit}>đ</Text>
                </View>
                <Text style={styles.amountMin}>Tối thiểu 50.000đ</Text>
              </View>

              {/* Note field */}
              <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>Lời nhắn</Text>
                <View style={styles.noteInputWrap}>
                  <TextInput
                    style={styles.noteInput}
                    value={modalNote}
                    onChangeText={v => v.length <= 50 && setModalNote(v)}
                    placeholder="Nhập lời nhắn"
                    placeholderTextColor="#a5a5a5"
                    maxLength={50}
                  />
                </View>
                <Text style={styles.noteCount}>{modalNote.length}/50</Text>
              </View>

              {/* Save button */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
                <Text style={styles.saveIcon}>✓</Text>
                <Text style={styles.saveText}>Lưu</Text>
                <Text style={styles.saveArrow}>›</Text>
              </TouchableOpacity>

              {/* Home indicator */}
              <View style={styles.homeBar}>
                <View style={styles.homeIndicator} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

export default QrGroupFundScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#d7d4ff' },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    height: Platform.OS === 'ios' ? 99 : 68,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 30, color: DARK, lineHeight: 34 },
  headerTitle: { flex: 1, alignItems: 'center' },
  headerSub: { fontSize: 14, fontWeight: '400', color: DARK, lineHeight: 21 },
  headerFund: { fontSize: 16, fontWeight: '600', color: DARK, lineHeight: 24 },

  // ── Scroll
  scroll: { paddingHorizontal: 32, paddingTop: 8, paddingBottom: 24, gap: 16, alignItems: 'center' },

  // ── QR Card
  qrCard: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 24,
    paddingHorizontal: 24, paddingVertical: 16,
    gap: 11,
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  bankRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bankLogoText: { fontSize: 18, fontWeight: '700', color: '#003087' },
  ownerName: { fontSize: 14, fontWeight: '700', color: DARK, letterSpacing: 0.5 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  accountNumber: { fontSize: 13, fontWeight: '400', color: GREY5 },
  copyBtn: { padding: 4 },
  copyIcon: { fontSize: 16, color: GREY4 },
  logosRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  logoPill: {
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: '#e8f0fe',
  },
  logoPillVietqr: { backgroundColor: '#fff3e0' },
  logoText: { fontSize: 11, fontWeight: '700', color: '#1a73e8', letterSpacing: 0.5 },
  logoTextVietqr: { color: '#e65100' },
  qrWrap: {
    padding: 9,
    backgroundColor: '#fff',
    borderRadius: 4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  qrFundName: { fontSize: 14, fontWeight: '400', color: GREY5, lineHeight: 21 },
  addContentPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 40, paddingHorizontal: 12, paddingVertical: 8,
  },
  addContentIcon: { fontSize: 14, color: DARK },
  addContentText: { fontSize: 14, fontWeight: '600', color: DARK },
  contentPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 40, paddingHorizontal: 12, paddingVertical: 8,
    maxWidth: 240,
  },
  contentPillIcon: { fontSize: 14, color: DARK },
  contentPillText: { fontSize: 14, fontWeight: '600', color: DARK, flexShrink: 1 },

  // ── Warning
  warnBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: YELLOW_BG,
    borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    width: '100%',
  },
  warnIcon: { fontSize: 18, lineHeight: 22 },
  warnText: { flex: 1, fontSize: 14, fontWeight: '400', color: DARK, lineHeight: 21 },
  warnBold: { fontWeight: '600' },

  // ── Bottom buttons
  bottomRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 32, paddingBottom: 8,
  },
  downloadBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 48, borderRadius: 100,
    backgroundColor: DARK,
  },
  downloadIcon: { fontSize: 18, color: '#fff' },
  downloadText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  shareBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 48, borderRadius: 100,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  shareIcon: { fontSize: 18, color: DARK },
  shareText: { fontSize: 16, fontWeight: '600', color: DARK },

  // ── Home indicator
  homeBar: { height: 32, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8 },
  homeIndicator: { width: 134, height: 5, borderRadius: 100, backgroundColor: DARK },

  // ── Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalKAV: { justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 4,
    overflow: 'hidden',
  },
  modalHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: DARK, textAlign: 'center', flex: 1 },
  modalCloseBtn: {
    position: 'absolute', right: 16,
    width: 32, height: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  modalCloseIcon: { fontSize: 16, color: DARK },

  // ── Amount section
  amountSection: {
    alignItems: 'center', paddingHorizontal: 16,
    paddingBottom: 0, gap: 2,
  },
  amountLabel: { fontSize: 14, fontWeight: '400', color: GREY5, lineHeight: 21 },
  amountInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  amountInput: {
    fontSize: 40, fontWeight: '700', color: DARK,
    minWidth: 60, textAlign: 'center',
    padding: 0,
  },
  amountUnit: { fontSize: 20, fontWeight: '400', color: '#d1d0d3', lineHeight: 32, marginBottom: 4 },
  amountMin: { fontSize: 14, fontWeight: '500', color: PURPLE, lineHeight: 21 },

  // ── Note section
  noteSection: { paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  noteLabel: { fontSize: 14, fontWeight: '400', color: DARK, lineHeight: 21 },
  noteInputWrap: {
    height: 48, borderRadius: 16,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  noteInput: { fontSize: 16, fontWeight: '400', color: DARK, padding: 0 },
  noteCount: { fontSize: 12, fontWeight: '400', color: '#a5a5a5', textAlign: 'right' },

  // ── Save button
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 48, borderRadius: 100,
    backgroundColor: DARK,
    marginHorizontal: 16, marginTop: 16,
  },
  saveIcon: { fontSize: 16, color: '#fff', fontWeight: '700' },
  saveText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  saveArrow: { fontSize: 20, color: '#fff' },
});
