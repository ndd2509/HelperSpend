import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BaseContainer } from 'react-native-shared-components';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getWalletBalance, syncFromWallet } from '../../apis/apis';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('vi-VN').format(n) + ' đ';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

interface WalletData {
  totalDeposited: number;
  receivedTransfers: number;
  sentTransfers: number;
  walletBalance: number;
  pendingSync: number;
  syncedTotal: number;
  canSync: boolean;
  deposits: any[];
  syncHistory: any[];
  transferHistory: any[];
}

// ─── Component ────────────────────────────────────────────────────────────────
export const WalletScreen = () => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<'deposit' | 'sync' | 'transfer'>('deposit');
  const autoSyncTriggered = useRef(false);

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const res = await getWalletBalance();
      if (res.success && res.data) {
        setData(res.data);
        // Reset auto-sync flag khi load data mới
        autoSyncTriggered.current = false;
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
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  // Auto-sync khi có khoản chờ đồng bộ
  useEffect(() => {
    if (data?.canSync && !syncing && !autoSyncTriggered.current) {
      autoSyncTriggered.current = true;
      handleAutoSync();
    }
  }, [data?.canSync]);

  const handleAutoSync = async () => {
    if (!data?.canSync) return;
    try {
      setSyncing(true);
      const res = await syncFromWallet({
        category: 'Đồng bộ từ ví',
        description: `Đồng bộ ví — ${new Date().toLocaleDateString('vi-VN')}`,
      });
      if (res.success) {
        // Reload data sau khi sync thành công
        loadData();
      }
    } catch {
      // silent - không hiện alert
    } finally {
      setSyncing(false);
    }
  };

  if (loading && !data) {
    return (
      <BaseContainer style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5C6BC0" />
        </View>
      </BaseContainer>
    );
  }

  const totalDeposited = data?.totalDeposited ?? 0;
  const pendingSync = data?.pendingSync ?? 0;
  const pendingIncome = (data as any)?.pendingIncome ?? 0;
  const pendingExpense = (data as any)?.pendingExpense ?? 0;
  const syncedTotal = data?.syncedTotal ?? 0;
  const canSync = data?.canSync ?? false;
  const walletBalance = data?.walletBalance ?? 0;
  const receivedTransfers = data?.receivedTransfers ?? 0;
  const sentTransfers = data?.sentTransfers ?? 0;
  const syncedPct = totalDeposited > 0 ? (syncedTotal / totalDeposited) * 100 : 0;

  return (
    <BaseContainer style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.circleA} />
          <View style={styles.circleB} />

          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerTitle}>Ví của tôi</Text>
              <Text style={styles.headerSub}>Tiền nạp từ admin</Text>
            </View>
            <TouchableOpacity
              style={styles.depositHeaderBtn}
              onPress={() => navigation.navigate('DepositRequest')}
            >
              <Text style={styles.depositHeaderBtnIcon}>+</Text>
              <Text style={styles.depositHeaderBtnText}>Nạp tiền</Text>
            </TouchableOpacity>
          </View>

        {/* Balance card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLbl}>Số dư ví hiện tại</Text>
            <Text style={styles.balanceAmt}>{formatCurrency(walletBalance)}</Text>

            <View style={styles.walletDetailRow}>
              <View style={styles.walletDetailItem}>
                <Text style={styles.walletDetailLbl}>Đã nạp</Text>
                <Text style={[styles.walletDetailVal, { color: '#4CAF50' }]}>
                  +{formatCurrency(totalDeposited)}
                </Text>
              </View>
              <View style={styles.walletDetailItem}>
                <Text style={styles.walletDetailLbl}>Đã nhận</Text>
                <Text style={[styles.walletDetailVal, { color: '#4CAF50' }]}>
                  +{formatCurrency(receivedTransfers)}
                </Text>
              </View>
              <View style={styles.walletDetailItem}>
                <Text style={styles.walletDetailLbl}>Đã chuyển</Text>
                <Text style={[styles.walletDetailVal, { color: '#FF5252' }]}>
                  -{formatCurrency(sentTransfers)}
                </Text>
              </View>
            </View>

            {/* Progress bar: đã đồng bộ / tổng */}
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(syncedPct, 100)}%` },
                ]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLbl}>
                Đã sync: {formatCurrency(syncedTotal)}
              </Text>
              <Text style={styles.progressLbl}>
                Chờ sync: {formatCurrency(pendingSync)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── PENDING SYNC CARD ────────────────────────────────────────── */}
        <View style={[styles.pendingCard, !canSync && styles.pendingCardEmpty]}>
          <View style={styles.pendingLeft}>
            <Text style={styles.pendingLbl}>Đồng bộ tự động</Text>
            <Text style={[styles.pendingAmt, !canSync && styles.pendingAmtZero, pendingSync < 0 && { color: '#F44336' }]}>
              {pendingSync >= 0 ? '+' : '-'}{formatCurrency(Math.abs(pendingSync))}
            </Text>
            {canSync && (pendingIncome > 0 || pendingExpense > 0) && (
              <Text style={styles.pendingHint}>
                Thu: +{formatCurrency(pendingIncome)} · Chi: -{formatCurrency(pendingExpense)}
              </Text>
            )}
            <Text style={styles.pendingHint}>
              {syncing
                ? 'Đang đồng bộ...'
                : canSync
                  ? 'Sẽ tự động đồng bộ'
                  : 'Đã đồng bộ tất cả'}
            </Text>
          </View>
          {syncing && (
            <ActivityIndicator size="small" color="#5C6BC0" style={{ marginRight: 8 }} />
          )}
        </View>

        {/* ── ACTION ROW ──────────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('DepositRequest')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.actionIcon}>💳</Text>
            </View>
            <Text style={styles.actionLabel}>Nạp tiền</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('TransferMoney')}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#EDE7F6' }]}>
              <Text style={styles.actionIcon}>💸</Text>
            </View>
            <Text style={styles.actionLabel}>Chuyển tiền</Text>
          </TouchableOpacity>
        </View>

        {/* ── TABS ────────────────────────────────────────────────────── */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'deposit' && styles.tabActive]}
            onPress={() => setActiveTab('deposit')}
          >
            <Text style={[styles.tabText, activeTab === 'deposit' && styles.tabTextActive]}>
              Nạp ({data?.deposits.length ?? 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'transfer' && styles.tabActive]}
            onPress={() => setActiveTab('transfer')}
          >
            <Text style={[styles.tabText, activeTab === 'transfer' && styles.tabTextActive]}>
              Chuyển ({data?.transferHistory?.length ?? 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sync' && styles.tabActive]}
            onPress={() => setActiveTab('sync')}
          >
            <Text style={[styles.tabText, activeTab === 'sync' && styles.tabTextActive]}>
              Đồng bộ ({data?.syncHistory.length ?? 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── LIST ────────────────────────────────────────────────────── */}
        <View style={styles.listCard}>
          {activeTab === 'deposit' ? (
            data?.deposits.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>💳</Text>
                <Text style={styles.emptyText}>Chưa có lịch sử nạp tiền</Text>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => navigation.navigate('DepositRequest')}
                >
                  <Text style={styles.emptyActionText}>Nạp tiền ngay →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              data?.deposits.map((d, i) => (
                <View
                  key={d.id}
                  style={[
                    styles.listItem,
                    i < data.deposits.length - 1 && styles.listItemBorder,
                  ]}
                >
                  <View style={[
                    styles.listIconWrap,
                    d.synced ? styles.listIconSynced : styles.listIconPending,
                  ]}>
                    <Text style={styles.listIcon}>{d.synced ? '✅' : '⏳'}</Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{d.description || 'Nạp tiền'}</Text>
                    <Text style={styles.listDate}>
                      {formatDate(d.date)} · {d.synced ? 'Đã đồng bộ' : 'Chờ đồng bộ'}
                    </Text>
                  </View>
                  <Text style={styles.listAmountIn}>+{formatCurrency(d.amount)}</Text>
                </View>
              ))
            )
          ) : activeTab === 'transfer' ? (
            (data?.transferHistory?.length ?? 0) === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>💸</Text>
                <Text style={styles.emptyText}>Chưa có giao dịch chuyển khoản</Text>
              </View>
            ) : (
              data?.transferHistory?.map((t, i) => {
                const isReceived = t.type === 'income';
                return (
                  <View
                    key={t.id}
                    style={[
                      styles.listItem,
                      i < (data?.transferHistory?.length ?? 0) - 1 && styles.listItemBorder,
                    ]}
                  >
                    <View style={[
                      styles.listIconWrap,
                      isReceived ? styles.listIconSynced : styles.listIconTransferOut,
                    ]}>
                      <Text style={styles.listIcon}>{isReceived ? '⬇️' : '⬆️'}</Text>
                    </View>
                    <View style={styles.listInfo}>
                      <Text style={styles.listTitle}>
                        {t.description || (isReceived ? 'Nhận chuyển khoản' : 'Chuyển tiền')}
                      </Text>
                      <Text style={styles.listDate}>
                        {formatDate(t.date)} · {isReceived ? 'Nhận' : 'Gửi'}
                      </Text>
                    </View>
                    <Text style={isReceived ? styles.listAmountIn : styles.listAmountOut}>
                      {isReceived ? '+' : '-'}{formatCurrency(t.amount)}
                    </Text>
                  </View>
                );
              })
            )
          ) : data?.syncHistory.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>⇄</Text>
              <Text style={styles.emptyText}>Chưa đồng bộ lần nào</Text>
            </View>
          ) : (
            data?.syncHistory.map((s, i) => (
              <View
                key={s.id}
                style={[
                  styles.listItem,
                  i < data.syncHistory.length - 1 && styles.listItemBorder,
                ]}
              >
                <View style={[styles.listIconWrap, styles.listIconSync]}>
                  <Text style={styles.listIcon}>⇄</Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{s.category || 'Đồng bộ từ ví'}</Text>
                  <Text style={styles.listDate}>{formatDate(s.date)}</Text>
                </View>
                <Text style={styles.listAmountSync}>+{formatCurrency(s.amount)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </BaseContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  scroll: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Header
  header: {
    backgroundColor: '#5C6BC0',
    paddingTop: 12,
    paddingBottom: 56,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  circleA: {
    position: 'absolute', top: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circleB: {
    position: 'absolute', bottom: -30, left: -20,
    width: 130, height: 130, borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  depositHeaderBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4,
  },
  depositHeaderBtnIcon: { fontSize: 20, color: '#fff', fontWeight: '300', lineHeight: 22 },
  depositHeaderBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },

  // ── Balance card
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 18,
  },
  balanceLbl: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  balanceAmt: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 12 },
  walletDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 10,
  },
  walletDetailItem: { alignItems: 'center', flex: 1 },
  walletDetailLbl: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  walletDetailVal: { fontSize: 12, fontWeight: '700', color: '#fff' },
  progressTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressLbl: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },

  // ── Pending card
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: -28,
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 18,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#5C6BC0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  pendingCardEmpty: { opacity: 0.7 },
  pendingLeft: { flex: 1 },
  pendingLbl: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 4 },
  pendingAmt: { fontSize: 26, fontWeight: '800', color: '#5C6BC0', marginBottom: 4 },
  pendingAmtZero: { color: '#BBBBBB' },
  pendingHint: { fontSize: 12, color: '#999', lineHeight: 16 },
  syncBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#5C6BC0',
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#5C6BC0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  syncBtnDisabled: { backgroundColor: '#DDDDDD' },
  syncBtnText: {
    fontSize: 11, fontWeight: '700', color: '#fff',
    textAlign: 'center', lineHeight: 16,
  },

  // ── Action Row
  actionRow: {
    flexDirection: 'row', gap: 12,
    marginTop: 14, marginHorizontal: 16,
  },
  actionBtn: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },
  actionIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: '#333' },

  // ── Tabs
  tabs: {
    flexDirection: 'row', marginTop: 16, marginHorizontal: 16,
    backgroundColor: '#EBEBF0', borderRadius: 12, padding: 3,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#5C6BC0' },

  // ── List
  listCard: {
    backgroundColor: '#fff', marginTop: 12, marginHorizontal: 16,
    borderRadius: 16, overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  listItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  listIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  listIconPending: { backgroundColor: '#FFF3E0' },
  listIconSynced: { backgroundColor: '#E8F5E9' },
  listIconSync: { backgroundColor: '#EDE7F6' },
  listIconTransferOut: { backgroundColor: '#FFEBEE' },
  listIcon: { fontSize: 20 },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 3 },
  listDate: { fontSize: 12, color: '#888' },
  listAmountIn: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
  listAmountOut: { fontSize: 14, fontWeight: '700', color: '#FF5252' },
  listAmountSync: { fontSize: 14, fontWeight: '700', color: '#5C6BC0' },
  emptyBox: { alignItems: 'center', paddingVertical: 36 },
  emptyEmoji: { fontSize: 36, marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#AAAAAA', fontWeight: '500' },
  emptyAction: {
    marginTop: 12, paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: '#EDE7F6', borderRadius: 20,
  },
  emptyActionText: { fontSize: 13, color: '#5C6BC0', fontWeight: '700' },

  // ── Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#DDD', alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#222', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#666', marginBottom: 4 },
  modalAmount: {
    fontSize: 32, fontWeight: '800', color: '#5C6BC0', marginBottom: 20,
  },
  modalInfoBox: {
    backgroundColor: '#F5F6FA', borderRadius: 14, padding: 16, marginBottom: 20,
  },
  modalInfoText: { fontSize: 13, color: '#555', lineHeight: 18 },
  modalSyncBtn: {
    backgroundColor: '#5C6BC0', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#5C6BC0', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  modalSyncBtnDisabled: { opacity: 0.6 },
  modalSyncBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalCancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  modalCancelText: { fontSize: 15, color: '#888', fontWeight: '600' },
});
