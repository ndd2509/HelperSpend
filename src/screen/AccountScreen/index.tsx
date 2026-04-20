import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { BaseContainer } from 'react-native-shared-components';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardSummary } from '../../apis/apis';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' đ';

// ─── Component ────────────────────────────────────────────────────────────────
export const AccountScreen = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const now = new Date();

  const loadData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      const res = await getDashboardSummary(
        now.getMonth() + 1,
        now.getFullYear(),
      );
      if (res.success && res.data) {
        setBalance(res.data.balance);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleAccountMenu = () => {
    Alert.alert('Tài khoản', 'Chọn thao tác', [
      { text: 'Chỉnh sửa', onPress: () => {} },
      { text: 'Xem lịch sử', onPress: () => {} },
      { text: 'Hủy', style: 'cancel' },
    ]);
  };

  return (
    <BaseContainer style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {/* ── HEADER GRADIENT ──────────────────────────────────────────── */}
        <View style={styles.header}>
          {/* Decorative circles */}
          <View style={styles.circleTopRight} />
          <View style={styles.circleBottomLeft} />

          <Text style={styles.headerTitle}>Tài khoản của tôi</Text>

          {/* Balance card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Tổng tài sản</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>
                {hideBalance
                  ? '••••••• đ'
                  : formatCurrency(loading ? 0 : balance)}
              </Text>
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setHideBalance(h => !h)}
              >
                <Text style={styles.eyeIcon}>{hideBalance ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* + Add button */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() =>
                Alert.alert('Thêm tài khoản', 'Chức năng đang phát triển')
              }
            >
              <Text style={styles.addBtnIcon}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SPENDING ACCOUNTS ────────────────────────────────────────── */}
        <View style={styles.section}>
          {/* Section header */}
          <TouchableOpacity style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tài khoản chi tiêu (1)</Text>
            <Text style={styles.sectionChevron}>›</Text>
          </TouchableOpacity>

          {/* Account item */}
          <View style={styles.accountItem}>
            <View style={styles.accountIconWrap}>
              <Text style={styles.accountIcon}>💵</Text>
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>
                {user?.name || 'Tài khoản'}
              </Text>
              <Text style={styles.accountBalance}>
                {hideBalance ? '•••••' : formatCurrency(loading ? 0 : balance)}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.moreBtn}
              onPress={handleAccountMenu}
            >
              <Text style={styles.moreBtnIcon}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SAVING ACCOUNTS (placeholder) ─────────────────────────── */}
        <View style={[styles.section, styles.sectionMt]}>
          <TouchableOpacity style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tài khoản tiết kiệm (0)</Text>
            <Text style={styles.sectionChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.emptyAccount}>
            <Text style={styles.emptyAccountText}>
              Chưa có tài khoản tiết kiệm
            </Text>
          </View>
        </View>
      </ScrollView>
    </BaseContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  scroll: { flex: 1 },

  // ── Header
  header: {
    backgroundColor: '#4A90D9',
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 48,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  circleTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },

  // ── Balance card
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: { fontSize: 18 },
  addBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnIcon: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 26,
  },

  // ── Section
  section: {
    backgroundColor: '#fff',
    marginTop: -24,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  sectionMt: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
  },
  sectionChevron: {
    fontSize: 20,
    color: '#AAAAAA',
  },

  // ── Account item
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  accountIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#E3F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIcon: { fontSize: 22 },
  accountInfo: { flex: 1 },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 3,
  },
  accountBalance: {
    fontSize: 13,
    color: '#666',
  },
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtnIcon: {
    fontSize: 22,
    color: '#AAAAAA',
    fontWeight: '700',
  },

  // ── Empty
  emptyAccount: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyAccountText: {
    fontSize: 13,
    color: '#AAAAAA',
  },
});
