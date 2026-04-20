import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { BaseContainer } from 'react-native-shared-components';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getTransactions } from '../../apis/apis';
import type { Transaction } from '../../apis/types';

type FilterType = 'all' | 'income' | 'expense';

interface FilterOption {
  value: FilterType;
  label: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'income', label: 'Thu' },
  { value: 'expense', label: 'Chi' },
];

export const TransactionsScreen = () => {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      const params = filterType === 'all' ? {} : { type: filterType };
      const response = await getTransactions(params);

      if (response.success && response.data) {
        setTransactions(response.data);
      } else {
        setError('Không thể tải dữ liệu');
      }
    } catch (err: any) {
      console.error('Load transactions error:', err);
      setError(err.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [filterType]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadTransactions(true);
  };

  const handleFilterSelect = (type: FilterType) => {
    setFilterType(type);
    setModalVisible(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getFilterLabel = () => {
    return (
      FILTER_OPTIONS.find(opt => opt.value === filterType)?.label || 'Tất cả'
    );
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.categoryIcon,
            item.type === 'expense' ? styles.expenseIcon : styles.incomeIcon,
          ]}
        >
          <Text style={styles.categoryIconText}>{item.category.charAt(0)}</Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionCategory}>{item.category}</Text>
          <Text style={styles.transactionDescription}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            item.type === 'expense'
              ? styles.expenseAmount
              : styles.incomeAmount,
          ]}
        >
          {item.type === 'income' ? '+' : '-'}
          {formatCurrency(item.amount)}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(item.date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📋</Text>
      <Text style={styles.emptyStateText}>
        {filterType === 'all'
          ? 'Chưa có giao dịch nào'
          : filterType === 'income'
          ? 'Chưa có giao dịch thu'
          : 'Chưa có giao dịch chi'}
      </Text>
    </View>
  );

  if (loading && transactions.length === 0) {
    return (
      <BaseContainer style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giao dịch</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </BaseContainer>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <BaseContainer style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giao dịch</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadTransactions()}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </BaseContainer>
    );
  }

  return (
    <BaseContainer
      title="Danh sách giao dịch"
      isHeader
      style={styles.container}
      left={
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
      }
      right={
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.filterButtonText}>{getFilterLabel()}</Text>
          <Text style={styles.filterIcon}>▼</Text>
        </TouchableOpacity>
      }
    >
      {/* Header */}
      {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Giao dịch</Text>
       
      </View> */}

      {/* Transactions List */}
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Filter Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Lọc giao dịch</Text>
            {FILTER_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.filterOption}
                onPress={() => handleFilterSelect(option.value)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    filterType === option.value &&
                      styles.filterOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
                {filterType === option.value && (
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
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    fontSize: 28,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerRight: {
    width: 60,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginRight: 4,
  },
  filterIcon: {
    fontSize: 10,
    color: '#fff',
  },
  listContent: {
    padding: 20,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  separator: {
    height: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  expenseIcon: {
    backgroundColor: '#FFE5E5',
  },
  incomeIcon: {
    backgroundColor: '#E5F7E5',
  },
  categoryIconText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  transactionDescription: {
    fontSize: 14,
    color: '#666',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  expenseAmount: {
    color: '#FF3B30',
  },
  incomeAmount: {
    color: '#34C759',
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#000',
  },
  filterOptionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
