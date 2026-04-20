import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
  StatusBar,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { checkWalletForTransfer } from '../../apis/apis';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ScannedResult {
  value: string;
  type: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
const ScanScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation<any>();

  const { hasPermission, requestPermission } = useCameraPermission();
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [result, setResult] = useState<ScannedResult | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Wallet check state
  const [walletChecking, setWalletChecking] = useState(true);
  const [canTransfer, setCanTransfer] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const device = useCameraDevice('back');

  // ── Request permission on mount ──
  useEffect(() => {
    const check = async () => {
      if (!hasPermission) {
        await requestPermission();
      }
      setPermissionChecked(true);
    };
    check();
  }, [hasPermission, requestPermission]);

  // ── Check wallet balance on focus ──
  useEffect(() => {
    if (isFocused) {
      setResult(null);
      checkWallet();
    } else {
      setIsActive(false);
    }
  }, [isFocused]);

  const checkWallet = async () => {
    setWalletChecking(true);
    try {
      const res = await checkWalletForTransfer();
      if (res.success && res.data) {
        setCanTransfer(res.data.canTransfer);
        setWalletBalance(res.data.walletBalance);
        setIsActive(res.data.canTransfer);
      } else {
        setCanTransfer(false);
        setIsActive(false);
      }
    } catch {
      // Nếu lỗi API, vẫn cho scan (không block user vì lỗi mạng)
      setCanTransfer(true);
      setIsActive(true);
    } finally {
      setWalletChecking(false);
    }
  };

  // ── QR scanned ──
  const handleCodeScanned = useCallback((codes: any[]) => {
    const code = codes[0];
    if (!code?.value || result) { return; }
    setIsActive(false);
    setResult({ value: code.value, type: code.type });
    navigation.navigate('Transfer', { qrValue: code.value });
  }, [result, navigation]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'code-128', 'code-39'],
    onCodeScanned: handleCodeScanned,
  });

  const handleScanAgain = () => {
    setResult(null);
    setIsActive(true);
  };

  const handleOpenLink = () => {
    if (!result) { return; }
    if (result.value.startsWith('http://') || result.value.startsWith('https://')) {
      Linking.openURL(result.value).catch(() =>
        Alert.alert('Lỗi', 'Không thể mở liên kết này'),
      );
    } else {
      Alert.alert('Nội dung QR', result.value, [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Sao chép', onPress: () => {} },
      ]);
    }
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('vi-VN').format(n) + ' ₫';

  // ─── Permission denied ───────────────────────────────────────────────────
  if (permissionChecked && !hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.permEmoji}>📷</Text>
        <Text style={styles.permTitle}>Camera chưa được cấp quyền</Text>
        <Text style={styles.permSub}>
          Vui lòng cấp quyền truy cập camera để quét mã QR
        </Text>
        <TouchableOpacity style={styles.permBtn} onPress={openSettings}>
          <Text style={styles.permBtnText}>Mở Cài đặt</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── No back camera ──────────────────────────────────────────────────────
  if (permissionChecked && hasPermission && !device) {
    return (
      <View style={styles.center}>
        <Text style={styles.permEmoji}>📵</Text>
        <Text style={styles.permTitle}>Không tìm thấy camera</Text>
      </View>
    );
  }

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (!permissionChecked || !device) {
    return <View style={styles.bg} />;
  }

  // ─── Wallet empty — Block QR scan ────────────────────────────────────────
  if (!walletChecking && !canTransfer) {
    return (
      <View style={styles.center}>
        <Text style={styles.permEmoji}>💰</Text>
        <Text style={styles.permTitle}>Ví chưa có tiền</Text>
        <Text style={styles.permSub}>
          Bạn cần có tiền trong ví để chuyển khoản.{'\n'}
          Vui lòng yêu cầu admin nạp tiền hoặc nhận chuyển khoản từ người khác.
        </Text>
        <Text style={styles.walletBalanceText}>
          Số dư ví: {formatCurrency(walletBalance)}
        </Text>
        <TouchableOpacity
          style={styles.permBtn}
          onPress={() => navigation.navigate('wallet')}
        >
          <Text style={styles.permBtnText}>Đến trang Ví</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Checking wallet ─────────────────────────────────────────────────────
  if (walletChecking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#5C6BC0" />
        <Text style={[styles.permSub, { marginTop: 16 }]}>Đang kiểm tra số dư ví...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera */}
      <Camera
        style={StyleSheet.absoluteFillObject}
        device={device}
        isActive={isActive && isFocused}
        codeScanner={codeScanner}
        torch={torchOn ? 'on' : 'off'}
      />

      {/* Dark overlay with scan frame cutout */}
      <View style={styles.overlay} pointerEvents="none">
        {/* Top mask */}
        <View style={styles.maskTop} />
        <View style={styles.maskRow}>
          {/* Left mask */}
          <View style={styles.maskSide} />
          {/* Scan frame */}
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {/* Scan line animation placeholder */}
            <View style={styles.scanLine} />
          </View>
          {/* Right mask */}
          <View style={styles.maskSide} />
        </View>
        {/* Bottom mask */}
        <View style={styles.maskBottom} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quét mã QR</Text>
        <Text style={styles.headerSub}>Đưa mã QR vào khung để quét</Text>
        <View style={styles.walletBadge}>
          <Text style={styles.walletBadgeText}>
            Ví: {formatCurrency(walletBalance)}
          </Text>
        </View>
      </View>

      {/* Torch button */}
      <TouchableOpacity
        style={[styles.torchBtn, torchOn && styles.torchBtnOn]}
        onPress={() => setTorchOn(v => !v)}
      >
        <Text style={styles.torchIcon}>{torchOn ? '🔦' : '🔦'}</Text>
        <Text style={styles.torchLabel}>{torchOn ? 'Tắt đèn' : 'Bật đèn'}</Text>
      </TouchableOpacity>

      {/* ── Result sheet ─────────────────────────────────────────────────── */}
      {result && (
        <View style={styles.resultSheet}>
          <View style={styles.resultHandle} />

          <View style={styles.resultIconRow}>
            <View style={styles.resultIconBg}>
              <Text style={styles.resultIconEmoji}>✅</Text>
            </View>
          </View>

          <Text style={styles.resultLabel}>Quét thành công</Text>
          <Text style={styles.resultType}>{result.type.toUpperCase()}</Text>
          <Text style={styles.resultValue} numberOfLines={4}>
            {result.value}
          </Text>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={styles.resultBtnSecondary}
              onPress={handleScanAgain}
            >
              <Text style={styles.resultBtnSecondaryText}>Quét lại</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resultBtnPrimary}
              onPress={handleOpenLink}
            >
              <Text style={styles.resultBtnPrimaryText}>Mở</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default ScanScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const FRAME = 240;
const CORNER = 22;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  // ── Permission
  permEmoji: { fontSize: 52, marginBottom: 16 },
  permTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  permSub: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  permBtn: {
    backgroundColor: '#5C6BC0',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  permBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  walletBalanceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
    marginTop: 12,
    marginBottom: 20,
  },

  // ── Header
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 4,
  },
  walletBadge: {
    marginTop: 8,
    backgroundColor: 'rgba(92,107,192,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  walletBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // ── Overlay masks
  overlay: { ...StyleSheet.absoluteFillObject },
  maskTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  maskRow: {
    height: FRAME,
    flexDirection: 'row',
  },
  maskSide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  maskBottom: {
    flex: 1.6,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // ── Scan frame
  frame: {
    width: FRAME,
    height: FRAME,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#fff',
  },
  cornerTL: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: 4,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: 'rgba(92,107,192,0.8)',
    borderRadius: 1,
  },

  // ── Torch
  torchBtn: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  torchBtnOn: {
    backgroundColor: 'rgba(255,220,80,0.25)',
    borderColor: 'rgba(255,220,80,0.6)',
  },
  torchIcon: { fontSize: 18 },
  torchLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },

  // ── Result sheet
  resultSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
  },
  resultHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  resultIconRow: { alignItems: 'center', marginBottom: 12 },
  resultIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconEmoji: { fontSize: 26 },
  resultLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 4,
  },
  resultType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C6BC0',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 12,
  },
  resultValue: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    lineHeight: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
  },
  resultBtnSecondary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  resultBtnPrimary: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#5C6BC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
