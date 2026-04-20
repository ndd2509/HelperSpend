import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { BaseContainer } from 'react-native-shared-components';
import { useAuth } from '../../contexts/AuthContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getDashboardSummary, getTransactions } from '../../apis/apis';
import type { DashboardSummary, Transaction } from '../../apis/types';

// ─── Period filter ────────────────────────────────────────────────────────────
type PeriodKey = 'today' | 'week' | 'month' | 'quarter' | 'year';

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: 'Tuần này' },
  { key: 'month', label: 'Tháng này' },
  { key: 'quarter', label: 'Quý này' },
  { key: 'year', label: 'Năm nay' },
];

const toISO = (d: Date) => d.toISOString().slice(0, 10);

const getDateRange = (
  period: PeriodKey,
): { startDate: string; endDate: string } => {
  const now = new Date();
  const end = toISO(now);
  switch (period) {
    case 'today':
      return { startDate: end, endDate: end };
    case 'week': {
      const start = new Date(now);
      start.setDate(
        now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1),
      );
      return { startDate: toISO(start), endDate: end };
    }
    case 'month':
      return {
        startDate: toISO(new Date(now.getFullYear(), now.getMonth(), 1)),
        endDate: end,
      };
    case 'quarter': {
      const q = Math.floor(now.getMonth() / 3);
      return {
        startDate: toISO(new Date(now.getFullYear(), q * 3, 1)),
        endDate: end,
      };
    }
    case 'year':
    default:
      return {
        startDate: toISO(new Date(now.getFullYear(), 0, 1)),
        endDate: end,
      };
  }
};

const calcStats = (txs: Transaction[]) => {
  let income = 0;
  let expense = 0;
  txs.forEach(tx => {
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  });
  return { income, expense };
};

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  string,
  { icon: string; bg: string; color: string }
> = {
  'Ăn uống': { icon: '🍜', bg: '#FFF3E0', color: '#FF9800' },
  'Di chuyển': { icon: '🚗', bg: '#E3F2FD', color: '#2196F3' },
  'Mua sắm': { icon: '🛍️', bg: '#FCE4EC', color: '#E91E63' },
  'Giải trí': { icon: '🎮', bg: '#F3E5F5', color: '#9C27B0' },
  'Sức khỏe': { icon: '🏥', bg: '#E8F5E9', color: '#4CAF50' },
  'Giáo dục': { icon: '📚', bg: '#E0F7FA', color: '#00BCD4' },
  'Hóa đơn': { icon: '🧾', bg: '#FFF8E1', color: '#FFC107' },
  'Tiết kiệm': { icon: '💰', bg: '#E8F5E9', color: '#4CAF50' },
  Lương: { icon: '💼', bg: '#E8F5E9', color: '#43A047' },
  Thưởng: { icon: '🎁', bg: '#F3E5F5', color: '#7B1FA2' },
  'Đầu tư': { icon: '📈', bg: '#E3F2FD', color: '#1565C0' },
  default: { icon: '💳', bg: '#ECEFF1', color: '#607D8B' },
};

const getCategoryConfig = (category: string, type: 'expense' | 'income') => {
  const config = CATEGORY_CONFIG[category];
  if (config) return config;
  if (type === 'income') return { icon: '💰', bg: '#E8F5E9', color: '#43A047' };
  return CATEGORY_CONFIG.default;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);

// ─── Donut chart helper ───────────────────────────────────────────────────────
const DONUT_COLORS = [
  '#FFB300',
  '#F44336',
  '#4CAF50',
  '#2196F3',
  '#9C27B0',
  '#00BCD4',
  '#FF5722',
  '#607D8B',
  '#E91E63',
  '#8BC34A',
];

interface DonutSlice {
  category: string;
  percentage: number;
  color: string;
}

const buildDonutSlices = (
  transactions: Array<{ type: string; category: string; amount: number }>,
): DonutSlice[] => {
  const expenseMap: Record<string, number> = {};
  let total = 0;
  transactions.forEach(tx => {
    if (tx.type === 'expense') {
      expenseMap[tx.category] = (expenseMap[tx.category] || 0) + tx.amount;
      total += tx.amount;
    }
  });
  if (total === 0) return [];
  return Object.entries(expenseMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount], i) => ({
      category,
      percentage: (amount / total) * 100,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }));
};

// Simple SVG donut
const DonutChart = ({
  slices,
  size = 120,
}: {
  slices: DonutSlice[];
  size?: number;
}) => {
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const strokeWidth = size * 0.18;

  const polarToCartesian = (angle: number) => ({
    x: cx + r * Math.cos((angle - 90) * (Math.PI / 180)),
    y: cy + r * Math.sin((angle - 90) * (Math.PI / 180)),
  });

  let startAngle = 0;
  const paths = slices.map((slice, i) => {
    const sweep = (slice.percentage / 100) * 360;
    const endAngle = startAngle + sweep;
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle - 0.5);
    const largeArc = sweep > 180 ? 1 : 0;
    const d = `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
    startAngle = endAngle;
    return (
      <Path
        key={i}
        d={d}
        fill="none"
        stroke={slice.color}
        strokeWidth={strokeWidth}
      />
    );
  });

  return (
    <Svg width={size} height={size}>
      <G>
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#F0F0F0"
          strokeWidth={strokeWidth}
        />
        {paths}
      </G>
    </Svg>
  );
};

const MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
];

// ─── Component ────────────────────────────────────────────────────────────────
export const HomeScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hideBalance, setHideBalance] = useState(false);

  // Thu chi filter
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('year');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [filteredTxs, setFilteredTxs] = useState<Transaction[]>([]);
  const [thuChiLoading, setThuChiLoading] = useState(false);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const loadDashboard = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      const response = await getDashboardSummary(
        selectedMonth + 1,
        selectedYear,
      );
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError('Không thể tải dữ liệu');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth, selectedYear]),
  );

  // Load transactions for the selected period
  useEffect(() => {
    const fetchPeriod = async () => {
      setThuChiLoading(true);
      try {
        const { startDate, endDate } = getDateRange(selectedPeriod);
        const res = await getTransactions({ startDate, endDate });
        if (res.success && res.data) {
          // Sắp xếp mới nhất trước
          const sorted = [...res.data].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setFilteredTxs(sorted);
        } else {
          setFilteredTxs([]);
        }
      } catch {
        setFilteredTxs([]);
      } finally {
        setThuChiLoading(false);
      }
    };
    fetchPeriod();
  }, [selectedPeriod]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard(true);
  };

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    const isCurrentMonth =
      selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    if (isCurrentMonth) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const isCurrentMonth =
    selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  // ── Loading ──
  if (loading && !data) {
    return (
      <BaseContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C6BC0" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </BaseContainer>
    );
  }

  // ── Error ──
  if (error && !data) {
    return (
      <BaseContainer style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Không thể tải dữ liệu</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => loadDashboard()}
          >
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </BaseContainer>
    );
  }

  // savingsRate based on in-app tracking (income vs expenses)
  const savingsRate =
    data && data.monthlyIncome > 0
      ? ((data.monthlyIncome - data.monthlyExpenses) / data.monthlyIncome) * 100
      : 0;

  return (
    <BaseContainer style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#5C6BC0"
          />
        }
      >
        {/* ── HEADER CARD ────────────────────────────────────────────── */}
        <View style={styles.headerCard}>
          {/* Top row: greeting + avatar */}
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingSmall}>{getGreeting()} 👋</Text>
              <Text style={styles.greetingName}>
                {user?.name || 'Người dùng'}
              </Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Month selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity style={styles.monthArrow} onPress={prevMonth}>
              <Text style={styles.monthArrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTHS[selectedMonth]} {selectedYear}
            </Text>
            <TouchableOpacity
              style={[
                styles.monthArrow,
                isCurrentMonth && styles.monthArrowDisabled,
              ]}
              onPress={nextMonth}
              disabled={isCurrentMonth}
            >
              <Text
                style={[
                  styles.monthArrowText,
                  isCurrentMonth && styles.monthArrowTextDisabled,
                ]}
              >
                ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* Balance — Tổng số dư (thu nhập − chi tiêu) */}
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Tổng số dư</Text>
              <Text style={styles.balanceAmount}>
                {hideBalance ? '••••••••' : formatCurrency(data?.balance || 0)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setHideBalance(h => !h)}
            >
              <Text style={styles.eyeIcon}>{hideBalance ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── TRACKING CARDS ─────────────────────────────────────── */}
        <View style={styles.statsSection}>
          <Text style={styles.statsSectionLabel}>
            📊 Thu chi tháng {MONTHS[selectedMonth]}
          </Text>
          <View style={styles.statsRow}>
            {/* Manual income */}
            <View style={[styles.statCard, styles.incomeStatCard]}>
              <View style={styles.statIconWrap}>
                <Text style={styles.statIcon}>↓</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Thu nhập</Text>
                <Text style={[styles.statAmount, styles.incomeColor]}>
                  {formatCurrency(data?.monthlyIncome || 0)}
                </Text>
              </View>
            </View>

            {/* Expense */}
            <View style={[styles.statCard, styles.expenseStatCard]}>
              <View style={[styles.statIconWrap, styles.expenseIconWrap]}>
                <Text style={styles.statIcon}>↑</Text>
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>Chi tiêu</Text>
                <Text style={[styles.statAmount, styles.expenseColor]}>
                  {formatCurrency(data?.monthlyExpenses || 0)}
                </Text>
              </View>
            </View>
          </View>

          {/* Savings tip */}
          {data && data.monthlyIncome > 0 && (
            <View
              style={[
                styles.savingsTip,
                savingsRate >= 0 ? styles.savingsTipGood : styles.savingsTipBad,
              ]}
            >
              <Text style={styles.savingsTipText}>
                {savingsRate >= 0
                  ? `✅ Tiết kiệm được ${savingsRate.toFixed(
                      0,
                    )}% thu nhập ghi nhận`
                  : `⚠️ Chi vượt thu nhập ghi nhận ${Math.abs(
                      savingsRate,
                    ).toFixed(0)}%`}
              </Text>
            </View>
          )}
        </View>

        {/* ── QUICK ACTIONS ────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() =>
                navigation.navigate('AddTransaction', { type: 'expense' })
              }
            >
              <View
                style={[styles.actionIconWrap, { backgroundColor: '#FFE5E5' }]}
              >
                <Text style={styles.actionEmoji}>💸</Text>
              </View>
              <Text style={styles.actionLabel}>Thêm{'\n'}chi tiêu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() =>
                navigation.navigate('AddTransaction', { type: 'income' })
              }
            >
              <View
                style={[styles.actionIconWrap, { backgroundColor: '#E8F5E9' }]}
              >
                <Text style={styles.actionEmoji}>💵</Text>
              </View>
              <Text style={styles.actionLabel}>Thêm{'\n'}thu nhập</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('DepositRequest')}
            >
              <View
                style={[styles.actionIconWrap, { backgroundColor: '#E3F2FD' }]}
              >
                <Text style={styles.actionEmoji}>🏦</Text>
              </View>
              <Text style={styles.actionLabel}>Nạp{'\n'}tiền</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('report')}
            >
              <View
                style={[styles.actionIconWrap, { backgroundColor: '#F3E5F5' }]}
              >
                <Text style={styles.actionEmoji}>📊</Text>
              </View>
              <Text style={styles.actionLabel}>Báo{'\n'}cáo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => navigation.navigate('QRPayment')}
            >
              <View
                style={[styles.actionIconWrap, { backgroundColor: '#E8EAF6' }]}
              >
                <Text style={styles.actionEmoji}>📲</Text>
              </View>
              <Text style={styles.actionLabel}>Mã{'\n'}QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── BUDGET OVERVIEW ──────────────────────────────────────────── */}
        {data?.budgets && data.budgets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ngân sách</Text>
              <Text style={styles.sectionSub}>
                {data.budgets.filter(b => b.spent / b.limit > 0.8).length} danh
                mục sắp hết
              </Text>
            </View>
            <View style={styles.card}>
              {data.budgets.map((budget, index) => {
                const pct = Math.min((budget.spent / budget.limit) * 100, 100);
                const isOver = budget.spent > budget.limit;
                const isWarn = pct >= 80 && !isOver;
                const barColor = isOver
                  ? '#F44336'
                  : isWarn
                  ? '#FF9800'
                  : '#4CAF50';
                return (
                  <View
                    key={budget.id || index}
                    style={[
                      styles.budgetItem,
                      index < data.budgets.length - 1 &&
                        styles.budgetItemBorder,
                    ]}
                  >
                    <View style={styles.budgetTop}>
                      <Text style={styles.budgetCategory}>
                        {budget.category}
                      </Text>
                      <View style={styles.budgetAmountRow}>
                        <Text
                          style={[
                            styles.budgetSpent,
                            isOver && { color: '#F44336' },
                          ]}
                        >
                          {formatCurrency(budget.spent)}
                        </Text>
                        <Text style={styles.budgetLimit}>
                          {' '}
                          / {formatCurrency(budget.limit)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${pct}%`, backgroundColor: barColor },
                        ]}
                      />
                    </View>
                    <View style={styles.budgetBottom}>
                      <Text
                        style={[
                          styles.budgetPct,
                          isOver && { color: '#F44336' },
                          isWarn && { color: '#FF9800' },
                        ]}
                      >
                        {isOver
                          ? `⚠️ Vượt ${formatCurrency(
                              budget.spent - budget.limit,
                            )}`
                          : `Còn ${formatCurrency(
                              budget.limit - budget.spent,
                            )}`}
                      </Text>
                      <Text style={[styles.budgetPct, { color: barColor }]}>
                        {pct.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── TÌNH HÌNH THU CHI ─────────────────────────────────────────── */}
        <View style={styles.section}>
          {/* Header row: title + gear + dropdown */}
          <View style={styles.thuChiHeader}>
            <Text style={styles.thuChiTitle}>Tình hình thu chi</Text>
            <View style={styles.thuChiHeaderRight}>
              {/* Period dropdown trigger */}
              <TouchableOpacity
                style={styles.periodBtn}
                onPress={() => setShowPeriodDropdown(true)}
              >
                <Text style={styles.periodBtnText}>
                  {PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label}
                </Text>
                <Text style={styles.periodBtnChevron}>⌄</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dropdown modal */}
          <Modal
            visible={showPeriodDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowPeriodDropdown(false)}
          >
            <TouchableWithoutFeedback
              onPress={() => setShowPeriodDropdown(false)}
            >
              <View style={styles.dropdownOverlay}>
                <TouchableWithoutFeedback>
                  <View style={styles.dropdownMenu}>
                    {PERIOD_OPTIONS.map((opt, i) => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.dropdownItem,
                          i < PERIOD_OPTIONS.length - 1 &&
                            styles.dropdownItemBorder,
                          selectedPeriod === opt.key &&
                            styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setSelectedPeriod(opt.key);
                          setShowPeriodDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownItemText,
                            selectedPeriod === opt.key &&
                              styles.dropdownItemTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          {/* Content card */}
          {thuChiLoading ? (
            <View style={[styles.thuChiCard, styles.thuChiLoadingBox]}>
              <ActivityIndicator size="small" color="#5C6BC0" />
            </View>
          ) : (
            (() => {
              const { income, expense } = calcStats(filteredTxs);
              const maxVal = Math.max(income, expense, 1);
              const slices = buildDonutSlices(filteredTxs);
              const hasData = income > 0 || expense > 0;
              if (!hasData) {
                return (
                  <View style={[styles.thuChiCard, styles.emptyBox]}>
                    <Text style={styles.emptyEmoji}>📊</Text>
                    <Text style={styles.emptyText}>
                      Chưa có dữ liệu thu chi
                    </Text>
                  </View>
                );
              }
              return (
                <View style={styles.thuChiCard}>
                  {/* Bar + stats */}
                  <View style={styles.barChartRow}>
                    <View style={styles.barGroup}>
                      <View
                        style={[
                          styles.bar,
                          styles.barIncome,
                          { height: Math.max(8, 120 * (income / maxVal)) },
                        ]}
                      />
                    </View>
                    <View style={styles.barGroup}>
                      <View
                        style={[
                          styles.bar,
                          styles.barExpense,
                          { height: Math.max(8, 120 * (expense / maxVal)) },
                        ]}
                      />
                    </View>
                    <View style={styles.thuChiStats}>
                      <View style={styles.thuChiStatRow}>
                        <Text style={styles.thuChiStatLabel}>Thu</Text>
                        <Text
                          style={[styles.thuChiStatValue, { color: '#4CAF50' }]}
                        >
                          {formatCurrency(income)}
                        </Text>
                      </View>
                      <View style={styles.thuChiStatRow}>
                        <Text style={styles.thuChiStatLabel}>Chi</Text>
                        <Text
                          style={[styles.thuChiStatValue, { color: '#F44336' }]}
                        >
                          {formatCurrency(expense)}
                        </Text>
                      </View>
                      <View
                        style={[styles.thuChiStatRow, styles.thuChiDivider]}
                      >
                        <Text style={styles.thuChiStatLabel}>Chênh lệch</Text>
                        <Text
                          style={[
                            styles.thuChiStatValue,
                            styles.thuChiDiff,
                            { color: income >= expense ? '#222' : '#F44336' },
                          ]}
                        >
                          {formatCurrency(income - expense)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Donut + legend */}
                  {slices.length > 0 && (
                    <View style={styles.donutSection}>
                      <View style={styles.donutRow}>
                        <DonutChart slices={slices} size={130} />
                        <View style={styles.donutLegend}>
                          {slices.map((s, i) => (
                            <View key={i} style={styles.legendItem}>
                              <View
                                style={[
                                  styles.legendDot,
                                  { backgroundColor: s.color },
                                ]}
                              />
                              <Text
                                style={styles.legendCategory}
                                numberOfLines={1}
                              >
                                {s.category}
                              </Text>
                              <Text style={styles.legendPct}>
                                {s.percentage.toFixed(2)}%
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Lịch sử ghi chép button */}
                  <TouchableOpacity
                    style={styles.lichSuBtn}
                    onPress={() => navigation.navigate('Transactions')}
                  >
                    <Text style={styles.lichSuBtnText}>Lịch sử ghi chép</Text>
                  </TouchableOpacity>
                </View>
              );
            })()
          )}
        </View>

        {/* ── RECENT TRANSACTIONS ──────────────────────────────────────── */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Transactions')}
            >
              <Text style={styles.viewAll}>Xem tất cả ›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {data?.recentTransactions && data.recentTransactions.length > 0 ? (
              data.recentTransactions.map((tx, idx) => {
                const catConfig = getCategoryConfig(tx.category, tx.type);
                const isLast = idx === data.recentTransactions.length - 1;
                return (
                  <View
                    key={tx.id}
                    style={[styles.txItem, !isLast && styles.txItemBorder]}
                  >
                    {/* Icon */}
                    <View
                      style={[
                        styles.txIconWrap,
                        { backgroundColor: catConfig.bg },
                      ]}
                    >
                      <Text style={styles.txIcon}>{catConfig.icon}</Text>
                    </View>

                    {/* Info */}
                    <View style={styles.txInfo}>
                      <Text style={styles.txCategory}>{tx.category}</Text>
                      <Text style={styles.txDesc} numberOfLines={1}>
                          {tx.description || 'Đồng bộ từ ví'}
                        </Text>
                    </View>

                    {/* Amount + date */}
                    <View style={styles.txRight}>
                      <Text
                        style={[
                          styles.txAmount,
                          tx.type === 'income'
                            ? styles.incomeColor
                            : styles.expenseColor,
                        ]}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </Text>
                      <Text style={styles.txDate}>
                        {new Date(tx.date).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
                <Text style={styles.emptySub}>
                  Nhấn "Thêm chi tiêu" hoặc "Thêm thu nhập" để bắt đầu
                </Text>
              </View>
            )}
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
  scroll: {
    flex: 1,
  },

  // ── Loading / Error
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#888',
    marginTop: 8,
  },
  errorEmoji: { fontSize: 48 },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  errorSub: { fontSize: 14, color: '#888', textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#5C6BC0',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // ── Header Card
  headerCard: {
    backgroundColor: '#5C6BC0',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#5C6BC0',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingSmall: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginBottom: 2,
  },
  greetingName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Month selector
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 16,
    alignSelf: 'center',
    minWidth: 200,
  },
  monthArrow: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  monthArrowDisabled: { opacity: 0.3 },
  monthArrowText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
  },
  monthArrowTextDisabled: { color: 'rgba(255,255,255,0.4)' },
  monthLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },

  // Balance
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  eyeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: { fontSize: 18 },

  balanceLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  balanceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  balanceBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '600',
  },

  // Deposit badge inside header
  depositRow: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  depositLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Stats section wrapper
  statsSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  statsSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },

  // Savings tip
  savingsTip: {
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  savingsTipGood: { backgroundColor: '#E8F5E9' },
  savingsTipBad: { backgroundColor: '#FFF3E0' },
  savingsTipText: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    fontWeight: '500',
  },
  // ── Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  incomeStatCard: { borderTopWidth: 3, borderTopColor: '#4CAF50' },
  expenseStatCard: { borderTopWidth: 3, borderTopColor: '#F44336' },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseIconWrap: { backgroundColor: '#FFEBEE' },
  statIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  statInfo: { flex: 1 },
  statLabel: { fontSize: 11, color: '#888', marginBottom: 3 },
  statSubLabel: { fontSize: 10, color: '#bbb', marginTop: 2 },
  statAmount: { fontSize: 13, fontWeight: '700' },
  incomeColor: { color: '#4CAF50' },
  expenseColor: { color: '#F44336' },

  // ── Section
  section: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  lastSection: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  sectionSub: { fontSize: 12, color: '#F44336' },
  viewAll: {
    fontSize: 13,
    color: '#5C6BC0',
    fontWeight: '600',
  },

  // ── Card wrapper
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },

  // ── Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionEmoji: { fontSize: 22 },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#444',
    textAlign: 'center',
    lineHeight: 15,
  },

  // ── Budget
  budgetItem: {
    padding: 14,
  },
  budgetItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  budgetAmountRow: { flexDirection: 'row', alignItems: 'baseline' },
  budgetSpent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
  },
  budgetLimit: {
    fontSize: 12,
    color: '#999',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetPct: {
    fontSize: 11,
    color: '#999',
  },

  // ── Transactions
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  txItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIcon: { fontSize: 20 },
  txInfo: { flex: 1 },
  txCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    marginBottom: 2,
  },
  txDesc: { fontSize: 12, color: '#999' },
  txRight: { alignItems: 'flex-end' },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  txDate: { fontSize: 11, color: '#bbb' },

  // ── Empty
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 6,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // ── Thu chi header
  thuChiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  thuChiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  thuChiHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gearBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: { fontSize: 16 },
  periodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#5C6BC0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5C6BC0',
  },
  periodBtnChevron: {
    fontSize: 14,
    color: '#5C6BC0',
  },

  // ── Dropdown
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 200,
    paddingRight: 16,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 150,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemActive: {
    backgroundColor: '#F0F0FF',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
  },
  dropdownItemTextActive: {
    color: '#5C6BC0',
    fontWeight: '700',
  },

  // ── Tình hình thu chi
  thuChiLoadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lichSuBtn: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingVertical: 12,
    alignItems: 'center',
  },
  lichSuBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  thuChiCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  barChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  barGroup: {
    justifyContent: 'flex-end',
    width: 28,
  },
  bar: {
    width: 28,
    borderRadius: 6,
  },
  barIncome: { backgroundColor: '#4CAF50' },
  barExpense: { backgroundColor: '#F44336' },
  thuChiStats: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingLeft: 8,
    gap: 8,
  },
  thuChiStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thuChiDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
    marginTop: 2,
  },
  thuChiStatLabel: {
    fontSize: 13,
    color: '#999',
  },
  thuChiStatValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  thuChiDiff: {
    fontSize: 14,
  },
  donutSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 16,
  },
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  donutLegend: {
    flex: 1,
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendCategory: {
    flex: 1,
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  legendPct: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
});
