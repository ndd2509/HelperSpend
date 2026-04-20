import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import {
  CommonActions,
  useNavigation,
  useRoute,
} from '@react-navigation/native';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    n,
  );

const TransferSuccessScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {
    recipientName = 'Người nhận',
    recipientPhone = '',
    amount = 0,
    note = '',
    transferId = '',
  } = route.params ?? {};

  // ── Animations ──
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Checkmark bounce in
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 80,
      useNativeDriver: true,
    }).start();

    // Content fade + slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, slideAnim]);

  const handleDone = () => {
    // Pop toàn bộ scan stack rồi chuyển sang tab home
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'ScanMain' }],
      }),
    );
    navigation.getParent()?.navigate('home');
  };

  const handleViewWallet = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'ScanMain' }],
      }),
    );
    navigation.getParent()?.navigate('wallet');
  };

  return (
    <View style={styles.container}>
      {/* ── Success icon ── */}
      <Animated.View
        style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}
      >
        <Text style={styles.checkIcon}>✓</Text>
      </Animated.View>

      {/* ── Title ── */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Text style={styles.title}>Chuyển tiền thành công!</Text>
        <Text style={styles.amountText}>{formatCurrency(amount)}</Text>
      </Animated.View>

      {/* ── Details card ── */}
      <Animated.View
        style={[
          styles.detailCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Người nhận</Text>
          <Text style={styles.detailValue}>{recipientName}</Text>
        </View>
        {recipientPhone ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Số điện thoại</Text>
            <Text style={styles.detailValue}>{recipientPhone}</Text>
          </View>
        ) : null}
        {note ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Nội dung</Text>
            <Text style={styles.detailValue}>{note}</Text>
          </View>
        ) : null}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Thời gian</Text>
          <Text style={styles.detailValue}>
            {new Date().toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {transferId ? (
          <View style={[styles.detailRow, styles.detailRowLast]}>
            <Text style={styles.detailLabel}>Mã GD</Text>
            <Text style={[styles.detailValue, styles.detailId]}>
              {transferId.slice(0, 20)}...
            </Text>
          </View>
        ) : null}
      </Animated.View>

      {/* ── Actions ── */}
      <Animated.View
        style={[
          styles.actionsWrap,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <TouchableOpacity style={styles.primaryBtn} onPress={handleDone}>
          <Text style={styles.primaryBtnText}>Về trang chủ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleViewWallet}
        >
          <Text style={styles.secondaryBtnText}>Xem ví</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default TransferSuccessScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // ── Checkmark
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  checkIcon: {
    fontSize: 44,
    color: '#fff',
    fontWeight: '700',
  },

  // ── Title
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#5C6BC0',
    textAlign: 'center',
    marginBottom: 28,
  },

  // ── Detail card
  detailCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1A1A2E',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  detailId: {
    fontSize: 11,
    color: '#aaa',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },

  // ── Buttons
  actionsWrap: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#5C6BC0',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#5C6BC0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: '#5C6BC0',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5C6BC0',
  },
});
