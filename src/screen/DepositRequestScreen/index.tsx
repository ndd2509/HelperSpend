import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { BaseContainer } from 'react-native-shared-components';
import { useFocusEffect } from '@react-navigation/native';
import { createDepositRequest, getMyDepositRequests } from '../../apis/apis';
import type { DepositRequest } from '../../apis/types';

export const DepositRequestScreen = ({ navigation }: any) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const response = await getMyDepositRequests();
      if (response.success) {
        setRequests(response.data);
      }
    } catch (error) {
      console.error('Load requests error:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests]),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số tiền hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const response = await createDepositRequest(
        Number(amount),
        description || 'Yêu cầu nạp tiền',
      );

      if (response.success) {
        Alert.alert(
          'Thành công',
          'Đã tạo yêu cầu nạp tiền. Vui lòng đợi admin xác nhận.',
        );
        setAmount('');
        setDescription('');
        await loadRequests();
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể tạo yêu cầu');
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'approved':
        return '#34C759';
      case 'rejected':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Đang chờ';
      case 'approved':
        return 'Đã xác nhận';
      case 'rejected':
        return 'Đã từ chối';
      default:
        return status;
    }
  };

  const renderRequest = ({ item }: { item: DepositRequest }) => (
    <View
      style={[
        styles.requestItem,
        { borderLeftColor: getStatusColor(item.status) },
      ]}
    >
      <View style={styles.requestHeader}>
        <Text style={styles.requestAmount}>
          +
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
          }).format(item.amount)}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.requestDescription}>{item.description}</Text>
      <Text style={styles.requestDate}>
        {new Date(item.createdAt).toLocaleString('vi-VN')}
      </Text>
      {item.processedAt && (
        <Text style={styles.processedDate}>
          Xử lý: {new Date(item.processedAt).toLocaleString('vi-VN')}
        </Text>
      )}
    </View>
  );

  return (
    <BaseContainer
      title="Nạp tiền"
      leftIcon="arrow-back"
      onLeftPress={() => navigation.goBack()}
    >
      <View style={styles.container}>
        {/* Create Request Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Tạo yêu cầu nạp tiền</Text>

          <Text style={styles.label}>Số tiền (VND)</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập số tiền"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            editable={!loading}
          />

          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nhập mô tả (tùy chọn)"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Gửi yêu cầu</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.note}>
            ℹ️ Yêu cầu sẽ được admin xác nhận trong thời gian sớm nhất
          </Text>
        </View>

        {/* Requests History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Lịch sử yêu cầu</Text>
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={item => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Chưa có yêu cầu nào</Text>
              </View>
            }
          />
        </View>
      </View>
    </BaseContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  historySection: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  requestItem: {
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    backgroundColor: '#f9f9f9',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: '#999',
  },
  processedDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
  },
});

export default DepositRequestScreen;
