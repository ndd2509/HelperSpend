import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions } from '../../apis/apis';
import type { Transaction } from '../../apis/types';
import { BaseContainer } from 'react-native-shared-components';
import ExpenseAnalysis from './components/ExpenseAnalysis';
import IncomeAnalysis from './components/IncomeAnalysis';
import ContactAnalysis from './components/ContactAnalysis';
import FinancialAnalysis from './components/FinancialAnalysis';

type TabType = 'current' | 'month' | 'quarter' | 'year' | 'custom';

type ReportType =
  | 'balance'
  | 'income-expense'
  | 'expense-analysis'
  | 'income-analysis'
  | 'debt-tracking'
  | 'contact'
  | 'transfer-event'
  | 'financial-analysis';

const REPORT_TYPES = [
  { id: 'balance', label: 'Tài chính hiện tại' },
  { id: 'income-expense', label: 'Tình hình thu chi' },
  { id: 'expense-analysis', label: 'Phân tích chi tiêu' },
  { id: 'income-analysis', label: 'Phân tích thu' },
  // { id: 'debt-tracking', label: 'Theo dõi vay nợ' },
  { id: 'contact', label: 'Đối tượng thu/chi' },
  // { id: 'transfer-event', label: 'Chuyển đi/Sự kiện' },
  { id: 'financial-analysis', label: 'Phân tích tài chính' },
];

const ReportDetailScreen = ({ navigation, route }: any) => {
  const initialReport = route?.params?.initialReport || 'income-expense';
  const [selectedTab, setSelectedTab] = useState<TabType>('current');
  const [selectedReport, setSelectedReport] =
    useState<ReportType>(initialReport);
  const [showReportPicker, setShowReportPicker] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const AI_REPORTS = [
    'expense-analysis',
    'income-analysis',
    'contact',
    'financial-analysis',
  ];

  const loadTransactions = async () => {
    try {
      const response = await getTransactions({});
      if (response.success && response.data) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, []),
  );

  const calculatePeriodData = (startDate: Date, endDate: Date) => {
    const periodTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= startDate && txDate <= endDate;
    });

    const income = periodTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expense = periodTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return { income, expense, total: income - expense };
  };

  const getToday = () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const todayTransactions = transactions.filter(tx => {
      // Compare date strings directly to avoid timezone issues
      return tx.date === todayStr;
    });

    const income = todayTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expense = todayTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return { income, expense, total: income - expense };
  };

  const getThisWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.getFullYear(), now.getMonth(), diff);
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      diff + 6,
      23,
      59,
      59,
    );
    return calculatePeriodData(start, end);
  };

  const getThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return calculatePeriodData(start, end);
  };

  const getThisQuarter = () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), quarter * 3, 1);
    const end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59);
    return calculatePeriodData(start, end);
  };

  const getThisYear = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    return calculatePeriodData(start, end);
  };

  const today = getToday();
  const thisWeek = getThisWeek();
  const thisMonth = getThisMonth();
  const thisQuarter = getThisQuarter();
  const thisYear = getThisYear();

  const getTotalBalance = () => {
    const totalIncome = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalExpense = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return { totalCo: totalIncome - totalExpense, totalNo: 0 };
  };
  const balance = getTotalBalance();

  // Calculate monthly data for the year
  const getMonthlyData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthlyData = [];

    for (let month = 0; month < 12; month++) {
      const monthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date + 'T00:00:00');
        return (
          txDate.getFullYear() === currentYear && txDate.getMonth() === month
        );
      });

      const income = monthTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const expense = monthTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      monthlyData.push({
        month: month + 1,
        income,
        expense,
        total: income - expense,
      });
    }

    return monthlyData;
  };

  // Calculate quarterly data
  const getQuarterlyData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const quarterlyData = [];

    for (let quarter = 0; quarter < 4; quarter++) {
      const startMonth = quarter * 3;
      const endMonth = startMonth + 2;

      const quarterTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.date + 'T00:00:00');
        const txMonth = txDate.getMonth();
        return (
          txDate.getFullYear() === currentYear &&
          txMonth >= startMonth &&
          txMonth <= endMonth
        );
      });

      const income = quarterTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const expense = quarterTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0);

      quarterlyData.push({
        quarter: quarter + 1,
        income,
        expense,
        total: income - expense,
      });
    }

    return quarterlyData;
  };

  // Calculate yearly data
  const getYearlyData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();

    const yearTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date + 'T00:00:00');
      return txDate.getFullYear() === currentYear;
    });

    const income = yearTransactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const expense = yearTransactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0);

    return [{ year: currentYear, income, expense, total: income - expense }];
  };

  const monthlyData = getMonthlyData();
  const quarterlyData = getQuarterlyData();
  const yearlyData = getYearlyData();

  const selectedReportLabel =
    REPORT_TYPES.find(r => r.id === selectedReport)?.label || '';

  return (
    <BaseContainer edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportSelector}
          onPress={() => setShowReportPicker(true)}
        >
          <Text style={styles.reportSelectorText}>{selectedReportLabel}</Text>
          <Text style={styles.dropdownIcon}>▼</Text>
        </TouchableOpacity>
      </View>

      {selectedReport === 'income-expense' && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'current' && styles.tabActive]}
            onPress={() => setSelectedTab('current')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'current' && styles.tabTextActive,
              ]}
            >
              Hiện tại
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'month' && styles.tabActive]}
            onPress={() => setSelectedTab('month')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'month' && styles.tabTextActive,
              ]}
            >
              Tháng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'quarter' && styles.tabActive]}
            onPress={() => setSelectedTab('quarter')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'quarter' && styles.tabTextActive,
              ]}
            >
              Quý
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'year' && styles.tabActive]}
            onPress={() => setSelectedTab('year')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'year' && styles.tabTextActive,
              ]}
            >
              Năm
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'custom' && styles.tabActive]}
            onPress={() => setSelectedTab('custom')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'custom' && styles.tabTextActive,
              ]}
            >
              Tùy chọn
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.dateFilter}>
        <Text style={styles.dateFilterIcon}>📅</Text>
        <Text style={styles.dateFilterText}>
          Năm {new Date().getFullYear()}
        </Text>
        <TouchableOpacity>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {selectedReport === 'balance' && (
          <View style={styles.balanceSection}>
            <View style={styles.balanceSummaryRow}>
              <Text style={styles.balanceSummaryLabel}>
                Tài chính hiện tại (1) - (2)
              </Text>
              <Text style={styles.balanceSummaryValue}>
                {balance.totalCo.toLocaleString('vi-VN')} đ
              </Text>
            </View>
            <View style={styles.balanceCards}>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceCardLabel}>Tổng có (1)</Text>
                <Text style={styles.balanceCardValue}>
                  {balance.totalCo.toLocaleString('vi-VN')} đ
                </Text>
              </View>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceCardLabel}>Tổng nợ (2)</Text>
                <Text style={styles.balanceCardValue}>0 đ</Text>
              </View>
            </View>
            <Text style={styles.balanceSectionTitle}>Tổng có (1)</Text>
            <TouchableOpacity style={styles.balanceItem}>
              <View style={styles.balanceItemLeft}>
                <View style={styles.balanceItemIcon}>
                  <Text style={styles.balanceItemIconText}>$</Text>
                </View>
                <Text style={styles.balanceItemName}>Tiền mặt</Text>
              </View>
              <View style={styles.balanceItemRight}>
                <Text style={styles.balanceItemValue}>
                  {balance.totalCo.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.balanceItemArrow}>›</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.balanceSectionTitle}>Tổng nợ (2)</Text>
          </View>
        )}

        {selectedReport === 'income-expense' && selectedTab === 'month' && (
          <View style={styles.chartSection}>
            <Text style={styles.yAxisLabel}>Triệu</Text>
            <View style={styles.chartContainer}>
              <View style={styles.yAxis}>
                <Text style={styles.yAxisTick}>12</Text>
                <Text style={styles.yAxisTick}>10</Text>
                <Text style={styles.yAxisTick}>8</Text>
                <Text style={styles.yAxisTick}>6</Text>
                <Text style={styles.yAxisTick}>4</Text>
                <Text style={styles.yAxisTick}>2</Text>
                <Text style={styles.yAxisTick}>0</Text>
              </View>
              <View style={styles.chart}>
                {monthlyData.map((data, index) => {
                  const maxAmount = Math.max(
                    ...monthlyData.map(m => m.income + m.expense),
                    1,
                  );
                  const totalValue = data.income + data.expense;
                  const totalBarHeight =
                    maxAmount > 0 ? (totalValue / maxAmount) * 150 : 0;
                  const hasData = data.income > 0 || data.expense > 0;
                  return (
                    <View key={index} style={styles.chartBar}>
                      {hasData && (
                        <View
                          style={[
                            styles.barStacked,
                            { height: totalBarHeight },
                          ]}
                        >
                          <View
                            style={[styles.barExpense, { flex: data.expense }]}
                          />
                          <View
                            style={[styles.barIncome, { flex: data.income }]}
                          />
                        </View>
                      )}
                      <Text style={styles.barLabel}>{data.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: '#34C759' }]}
                />
                <Text style={styles.legendText}>Thu</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: '#FF3B30' }]}
                />
                <Text style={styles.legendText}>Chi</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>
                Tháng {new Date().getMonth() + 1}
              </Text>
              <Text style={styles.summaryCardIncome}>
                {thisMonth.income.toLocaleString('vi-VN')} đ
              </Text>
              <Text style={styles.summaryCardExpense}>
                {thisMonth.expense.toLocaleString('vi-VN')} đ
              </Text>
              <Text style={styles.summaryCardTotal}>
                {thisMonth.total.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>
        )}

        {selectedReport === 'income-expense' && selectedTab === 'quarter' && (
          <View style={styles.chartSection}>
            <Text style={styles.yAxisLabel}>Triệu</Text>
            <View style={styles.chartContainer}>
              <View style={styles.yAxis}>
                <Text style={styles.yAxisTick}>12</Text>
                <Text style={styles.yAxisTick}>10</Text>
                <Text style={styles.yAxisTick}>8</Text>
                <Text style={styles.yAxisTick}>6</Text>
                <Text style={styles.yAxisTick}>4</Text>
                <Text style={styles.yAxisTick}>2</Text>
                <Text style={styles.yAxisTick}>0</Text>
              </View>
              <View style={styles.chart}>
                {quarterlyData.map((data, index) => {
                  const maxAmount = Math.max(
                    ...quarterlyData.map(q => Math.max(q.income, q.expense)),
                    1,
                  );
                  const incomeHeight = (data.income / maxAmount) * 150;
                  const expenseHeight = (data.expense / maxAmount) * 150;
                  const hasData = data.income > 0 || data.expense > 0;
                  return (
                    <View key={index} style={styles.chartBar}>
                      {hasData && (
                        <View style={styles.barGroup}>
                          <View
                            style={[
                              styles.barSingle,
                              styles.barIncome,
                              { height: incomeHeight },
                            ]}
                          />
                          <View
                            style={[
                              styles.barSingle,
                              styles.barExpense,
                              { height: expenseHeight },
                            ]}
                          />
                        </View>
                      )}
                      <Text style={styles.barLabel}>
                        Quý {['I', 'II', 'III', 'IV'][index]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: '#34C759' }]}
                />
                <Text style={styles.legendText}>Thu</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: '#FF3B30' }]}
                />
                <Text style={styles.legendText}>Chi</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>
                Quý {Math.floor(new Date().getMonth() / 3) + 1}
              </Text>
              <Text style={styles.summaryCardIncome}>
                {thisQuarter.income.toLocaleString('vi-VN')} đ
              </Text>
              <Text style={styles.summaryCardExpense}>
                {thisQuarter.expense.toLocaleString('vi-VN')} đ
              </Text>
              <Text style={styles.summaryCardTotal}>
                {thisQuarter.total.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>
        )}

        {selectedReport === 'income-expense' && selectedTab === 'year' && (
          <View style={styles.chartSection}>
            <Text style={styles.yAxisLabel}>Triệu</Text>
            <View style={styles.chartContainer}>
              <View style={styles.yAxis}>
                <Text style={styles.yAxisTick}>12</Text>
                <Text style={styles.yAxisTick}>10</Text>
                <Text style={styles.yAxisTick}>8</Text>
                <Text style={styles.yAxisTick}>6</Text>
                <Text style={styles.yAxisTick}>4</Text>
                <Text style={styles.yAxisTick}>2</Text>
                <Text style={styles.yAxisTick}>0</Text>
              </View>
              <View style={styles.chart}>
                {yearlyData.map((data, index) => {
                  const maxAmount = Math.max(data.income, data.expense, 1);
                  const incomeHeight = (data.income / maxAmount) * 150;
                  const expenseHeight = (data.expense / maxAmount) * 150;
                  const hasData = data.income > 0 || data.expense > 0;
                  return (
                    <View key={index} style={styles.chartBar}>
                      {hasData && (
                        <View style={styles.barGroup}>
                          <View
                            style={[
                              styles.barSingle,
                              styles.barIncome,
                              { height: incomeHeight },
                            ]}
                          />
                          <View
                            style={[
                              styles.barSingle,
                              styles.barExpense,
                              { height: expenseHeight },
                            ]}
                          />
                        </View>
                      )}
                      <Text style={styles.barLabel}>{data.year}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: '#34C759' }]}
                />
                <Text style={styles.legendText}>Thu</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: '#FF3B30' }]}
                />
                <Text style={styles.legendText}>Chi</Text>
              </View>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>
                {yearlyData[0]?.year || new Date().getFullYear()}
              </Text>
              <Text style={styles.summaryCardIncome}>
                {thisYear.income.toLocaleString('vi-VN')} đ
              </Text>
              <Text style={styles.summaryCardExpense}>
                {thisYear.expense.toLocaleString('vi-VN')} đ
              </Text>
              <Text style={styles.summaryCardTotal}>
                {thisYear.total.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>
        )}

        {selectedReport === 'income-expense' && selectedTab === 'current' && (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Hôm nay</Text>
              <View style={styles.summaryValues}>
                <Text style={styles.incomeText}>
                  {today.income.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.expenseText}>
                  {today.expense.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.totalText}>
                  {today.total.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tuần này</Text>
              <View style={styles.summaryValues}>
                <Text style={styles.incomeText}>
                  {thisWeek.income.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.expenseText}>
                  {thisWeek.expense.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.totalText}>
                  {thisWeek.total.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tháng này</Text>
              <View style={styles.summaryValues}>
                <Text style={styles.incomeText}>
                  {thisMonth.income.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.expenseText}>
                  {thisMonth.expense.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.totalText}>
                  {thisMonth.total.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Quý này</Text>
              <View style={styles.summaryValues}>
                <Text style={styles.incomeText}>
                  {thisQuarter.income.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.expenseText}>
                  {thisQuarter.expense.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.totalText}>
                  {thisQuarter.total.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Năm này</Text>
              <View style={styles.summaryValues}>
                <Text style={styles.incomeText}>
                  {thisYear.income.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.expenseText}>
                  {thisYear.expense.toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.totalText}>
                  {thisYear.total.toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── AI ANALYSIS COMPONENTS ────────────────── */}
        {selectedReport === 'expense-analysis' && <ExpenseAnalysis />}
        {selectedReport === 'income-analysis' && <IncomeAnalysis />}
        {selectedReport === 'contact' && <ContactAnalysis />}
        {selectedReport === 'financial-analysis' && <FinancialAnalysis />}
      </ScrollView>

      <Modal
        visible={showReportPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReportPicker(false)}
        >
          <View style={styles.pickerContainer}>
            {REPORT_TYPES.map(report => (
              <TouchableOpacity
                key={report.id}
                style={styles.pickerItem}
                onPress={() => {
                  setSelectedReport(report.id as ReportType);
                  setShowReportPicker(false);
                }}
              >
                <Text style={styles.pickerItemText}>{report.label}</Text>
                {selectedReport === report.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </BaseContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F4F8',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#000000',
  },
  reportSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 16,
    borderWidth: 1,
    borderColor: '#00A8E8',
  },
  reportSelectorText: {
    fontSize: 16,
    color: '#00A8E8',
    fontWeight: '500',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#00A8E8',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8F4F8',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00A8E8',
  },
  tabText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#00A8E8',
    fontWeight: '600',
  },
  dateFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  dateFilterIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  dateFilterText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
  },
  settingsIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  summaryRow: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 8,
  },
  summaryValues: {
    alignItems: 'flex-end',
  },
  incomeText: {
    fontSize: 14,
    color: '#34C759',
    marginBottom: 4,
  },
  expenseText: {
    fontSize: 14,
    color: '#FF3B30',
    marginBottom: 4,
  },
  totalText: {
    fontSize: 14,
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '80%',
    maxHeight: '70%',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#000000',
  },
  checkmark: {
    fontSize: 18,
    color: '#00A8E8',
  },
  chartSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  yAxisLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 8,
    marginLeft: 4,
  },
  chartContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  yAxis: {
    width: 30,
    height: 200,
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  yAxisTick: {
    fontSize: 10,
    color: '#8E8E93',
    textAlign: 'right',
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 200,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 4,
  },
  barStack: {
    width: 25,
    flexDirection: 'column-reverse',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barStacked: {
    width: 18,
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barSingle: {
    width: 30,
    borderRadius: 4,
  },
  barIncome: {
    backgroundColor: '#34C759',
  },
  barExpense: {
    backgroundColor: '#FF3B30',
  },
  barEmptyMonth: {
    width: 25,
    height: 120,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
  },
  barEmpty: {
    width: 39,
    height: 120,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
  },
  barLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 6,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 13,
    color: '#000000',
  },
  summaryCard: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#00A8E8',
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  summaryCardIncome: {
    fontSize: 15,
    color: '#34C759',
    marginBottom: 6,
  },
  summaryCardExpense: {
    fontSize: 15,
    color: '#FF3B30',
    marginBottom: 6,
  },
  summaryCardTotal: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  balanceSection: {
    backgroundColor: '#F0F4F8',
    flex: 1,
  },
  balanceSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 1,
  },
  balanceSummaryLabel: {
    fontSize: 14,
    color: '#555555',
  },
  balanceSummaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00A8E8',
  },
  balanceCards: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  balanceCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  balanceCardLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  balanceCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  balanceSectionTitle: {
    fontSize: 13,
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F4F8',
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  balanceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#00A8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceItemIconText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  balanceItemName: {
    fontSize: 15,
    color: '#000000',
  },
  balanceItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceItemValue: {
    fontSize: 15,
    color: '#000000',
  },
  balanceItemArrow: {
    fontSize: 20,
    color: '#C7C7CC',
  },
});

export default ReportDetailScreen;
