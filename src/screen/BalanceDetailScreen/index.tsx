import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';

const REPORT_TYPES = [
  { id: 'balance', label: 'Tài chính hiện tại' },
  { id: 'income-expense', label: 'Tình hình thu chi' },
  { id: 'expense-analysis', label: 'Phân tích chi tiêu' },
  { id: 'income-analysis', label: 'Phân tích thu' },
  { id: 'debt-tracking', label: 'Theo dõi vay nợ' },
  { id: 'contact', label: 'Đối tượng thu/chi' },
  { id: 'transfer-event', label: 'Chuyển đi/Sự kiện' },
  { id: 'financial-analysis', label: 'Phân tích tài chính' },
];

const BalanceDetailScreen = ({ navigation, route }: any) => {
  const { totalCo = 0, totalNo = 0 } = route.params || {};
  const [showPicker, setShowPicker] = useState(false);
  const netBalance = totalCo - totalNo;

  const handleReportSelect = (id: string) => {
    setShowPicker(false);
    if (id === 'income-expense') {
      navigation.replace('ReportDetail', { initialReport: 'income-expense' });
    } else if (id !== 'balance') {
      navigation.replace('ReportDetail', { initialReport: id });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.dropdownText}>Tài chính hiện tại</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tài chính hiện tại (1) - (2)</Text>
          <Text style={styles.summaryValue}>
            {netBalance.toLocaleString('vi-VN')} đ
          </Text>
        </View>

        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Tổng có (1)</Text>
            <Text style={styles.cardValue}>
              {totalCo.toLocaleString('vi-VN')} đ
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Tổng nợ (2)</Text>
            <Text style={styles.cardValue}>
              {totalNo.toLocaleString('vi-VN')} đ
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tổng có (1)</Text>
        <View style={styles.item}>
          <View style={styles.itemLeft}>
            <View style={styles.itemIcon}>
              <Text style={styles.itemIconText}>$</Text>
            </View>
            <Text style={styles.itemName}>Tiền mặt</Text>
          </View>
          <View style={styles.itemRight}>
            <Text style={styles.itemValue}>
              {totalCo.toLocaleString('vi-VN')} đ
            </Text>
            <Text style={styles.itemArrow}>›</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tổng nợ (2)</Text>
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.modalContent}>
            {REPORT_TYPES.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.modalItem}
                onPress={() => handleReportSelect(item.id)}
              >
                <Text style={styles.modalItemText}>{item.label}</Text>
                {item.id === 'balance' && (
                  <Text style={styles.modalCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFF4F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: '#D6EAF5',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  backIcon: {
    fontSize: 22,
    color: '#000000',
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#000000',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#555555',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  cards: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
  },
  cardLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  sectionTitle: {
    fontSize: 13,
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF4F8',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemArrow: {
    fontSize: 20,
    color: '#C7C7CC',
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#00A8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIconText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  itemName: {
    fontSize: 15,
    color: '#000000',
  },
  itemValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    marginTop: 100,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalItemText: {
    fontSize: 16,
    color: '#000000',
  },
  modalCheck: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default BalanceDetailScreen;
