import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDashboardSummary, getTransactions } from '../../apis/apis';
import type { DashboardSummary, Transaction } from '../../apis/types';
import { BaseContainer } from 'react-native-shared-components';

const { width } = Dimensions.get('window');

const ReportScreen = ({ navigation }: any) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [selectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());

  const loadDashboard = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);

      // Load dashboard summary
      const response = await getDashboardSummary(
        selectedMonth + 1,
        selectedYear,
      );
      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError('Không thể tải dữ liệu');
      }

      // Load transactions for last 5 months
      const endDate = new Date(selectedYear, selectedMonth + 1, 0); // Last day of current month
      const startDate = new Date(selectedYear, selectedMonth - 4, 1); // First day of 5 months ago

      const txResponse = await getTransactions({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (txResponse.success && txResponse.data) {
        setTransactions(txResponse.data);
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

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard(true);
  };

  const totalBalance = data?.balance || 0;
  const totalIncome = data?.monthlyIncome || 0;
  const totalExpense = data?.monthlyExpenses || 0;
  const totalDebt = 0; // Sẽ tạo màn hình riêng cho nợ sau

  // Calculate monthly data for last 5 months
  const getLast5MonthsData = () => {
    const monthsData: { month: string; expense: number; income: number }[] = [];

    for (let i = 4; i >= 0; i--) {
      const targetDate = new Date(selectedYear, selectedMonth - i, 1);
      const monthNum = targetDate.getMonth();
      const yearNum = targetDate.getFullYear();

      // Filter transactions for this month
      const monthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return (
          txDate.getMonth() === monthNum && txDate.getFullYear() === yearNum
        );
      });

      // Calculate totals
      const expense = monthTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const income = monthTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      monthsData.push({
        month: (monthNum + 1).toString(),
        expense,
        income,
      });
    }

    return monthsData;
  };

  const monthsData = getLast5MonthsData();
  const expenseData = monthsData.map(m => m.expense || 0);
  const incomeData = monthsData.map(m => m.income || 0);
  const hasAnyData = monthsData.some(m => m.expense > 0 || m.income > 0);

  // Ensure minimum value for chart display
  const maxValue = Math.max(...expenseData, ...incomeData);
  const chartData = maxValue === 0 ? [0.1, 0.1, 0.1, 0.1, 0.1] : expenseData;

  const chartConfig = {
    labels: monthsData.map(m => m.month.toString()),
    datasets: [
      {
        data: chartData,
      },
    ],
  };

  const reportItems = [
    { id: 1, icon: '📊', title: 'Phân tích chi tiêu', color: '#007AFF', aiType: 'expense' },
    { id: 2, icon: '📈', title: 'Phân tích thu', color: '#34C759', aiType: 'income' },
    { id: 4, icon: '👥', title: 'Đối tượng thu/chi', color: '#AF52DE', aiType: 'category' },
    { id: 6, icon: '💰', title: 'Phân tích tài chính', color: '#5856D6', aiType: 'financial' },
  ];

  if (loading && !data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Báo cáo</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </View>
    );
  }

  return (
    <BaseContainer style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Báo cáo</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Tài chính hiện tại</Text>
            <Text style={styles.summaryAmount}>
              {totalBalance.toLocaleString('vi-VN')} đ
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <TouchableOpacity
              style={styles.summaryItem}
              onPress={() =>
                navigation.navigate('BalanceDetailScreen', {
                  totalCo: totalBalance,
                  totalNo: totalDebt,
                })
              }
            >
              <Text style={styles.summaryLabel}>Tổng có</Text>
              <View style={styles.summaryValueContainer}>
                <Text style={styles.summaryValue}>
                  {totalIncome.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.summaryArrow}>→</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.summaryDivider} />

            <TouchableOpacity
              style={styles.summaryItem}
              onPress={() =>
                navigation.navigate('BalanceDetailScreen', {
                  totalCo: totalBalance,
                  totalNo: totalDebt,
                })
              }
            >
              <Text style={styles.summaryLabel}>Tổng nợ</Text>
              <View style={styles.summaryValueContainer}>
                <Text style={styles.summaryValue}>
                  {totalDebt.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.summaryArrow}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Tình hình thu chi</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ReportDetail')}
            >
              <Text style={styles.chartLink}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.chartSubtitle}>5 tháng gần nhất</Text>

          <View style={styles.chartContainer}>
            <View style={styles.customChart}>
              {monthsData.map((month, index) => {
                const hasData = month.expense > 0 || month.income > 0;
                const maxAmount = Math.max(
                  ...monthsData.map(m => m.expense + m.income),
                );

                if (!hasData) {
                  // Show gray bar for months without data
                  return (
                    <View key={index} style={styles.barContainer}>
                      <View style={styles.barWrapper}>
                        <View style={[styles.bar, styles.barEmpty]} />
                      </View>
                      <Text style={styles.barLabel}>{month.month}</Text>
                    </View>
                  );
                }

                // Calculate heights for stacked bars based on actual amounts
                const expenseHeight =
                  maxAmount > 0 ? (month.expense / maxAmount) * 180 : 0;
                const incomeHeight =
                  maxAmount > 0 ? (month.income / maxAmount) * 180 : 0;
                const totalHeight = expenseHeight + incomeHeight;

                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <View style={[styles.bar, { height: totalHeight }]}>
                        {/* Red (expense) on bottom - render first due to column-reverse */}
                        {month.expense > 0 && (
                          <View
                            style={[
                              styles.barSegment,
                              styles.barExpense,
                              { height: expenseHeight },
                            ]}
                          />
                        )}
                        {/* Green (income) on top */}
                        {month.income > 0 && (
                          <View
                            style={[
                              styles.barSegment,
                              styles.barIncome,
                              { height: incomeHeight },
                            ]}
                          />
                        )}
                      </View>
                    </View>
                    <Text style={styles.barLabel}>{month.month}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.chartNote}>
              Chi tiêu tháng hiện tại bằng{' '}
              {totalExpense.toLocaleString('vi-VN')} đ, chưa có dữ liệu so sánh
            </Text>
          </View>
        </View>

        <View style={styles.reportGrid}>
          {reportItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.reportItem}
              activeOpacity={0.7}
              onPress={() => {
                if (item.aiType) {
                  navigation.navigate('AIAnalysis', { type: item.aiType });
                }
              }}
            >
              <View
                style={[styles.reportIcon, { backgroundColor: item.color }]}
              >
                <Text style={styles.reportIconText}>{item.icon}</Text>
                {item.aiType && (
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                  </View>
                )}
              </View>
              <Text style={styles.reportItemTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </BaseContainer>
  );
};

export default ReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
  },
  summaryCard: {
    backgroundColor: '#007AFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    marginBottom: 16,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.9,
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    marginBottom: 8,
    opacity: 0.9,
  },
  summaryValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    marginLeft: 8,
    opacity: 0.7,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  chartLink: {
    fontSize: 14,
    color: '#007AFF',
  },
  chartSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  customChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    width: '100%',
    height: 200,
    paddingHorizontal: 30,
    gap: 12,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 40,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'column-reverse',
    justifyContent: 'flex-start',
  },
  barSegment: {
    width: '100%',
  },
  barIncome: {
    backgroundColor: '#4CD964',
  },
  barExpense: {
    backgroundColor: '#FF3B30',
  },
  barEmpty: {
    height: 180,
    backgroundColor: '#E5E5EA',
  },
  barLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  chartNote: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
  },
  reportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  reportItem: {
    width: '50%',
    padding: 8,
  },
  reportIcon: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportIconText: {
    fontSize: 40,
  },
  reportItemTitle: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  aiBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#5856D6',
  },
});
