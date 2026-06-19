import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const ACCOUNT_TYPES = [
  { id: 'cash', label: 'Tiền mặt', icon: '💰' },
  { id: 'bank', label: 'Ngân hàng', icon: '🏦' },
  { id: 'card', label: 'Thẻ tín dụng', icon: '💳' },
];

export const EditAccountScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const account = route.params?.account;

  const [accountName, setAccountName] = useState(account?.name || '');
  const [initialBalance, setInitialBalance] = useState(
    account?.balance?.toString() || '0',
  );
  const [selectedType, setSelectedType] = useState(account?.type || 'cash');
  const [currency, setCurrency] = useState(account?.currency || 'VND');
  const [note, setNote] = useState(account?.note || '');
  const [excludeFromReports, setExcludeFromReports] = useState(
    account?.excludeFromReports || false,
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!accountName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên tài khoản');
      return;
    }

    try {
      setLoading(true);
      const { updateAccount } = await import('../../apis/apis');

      await updateAccount(account.id, {
        name: accountName,
        balance: parseInt(initialBalance, 10),
        type: selectedType,
        currency,
        note,
        excludeFromReports,
        icon: getSelectedTypeIcon(),
      });

      Alert.alert('Thành công', 'Đã cập nhật tài khoản', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Update account error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật tài khoản. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa tài khoản',
      'Bạn có chắc chắn muốn xóa tài khoản này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteAccount } = await import('../../apis/apis');
              await deleteAccount(account.id);
              Alert.alert('Thành công', 'Đã xóa tài khoản', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xóa tài khoản');
            }
          },
        },
      ],
    );
  };

  const formatNumber = (text: string) => {
    const number = text.replace(/[^0-9]/g, '');
    if (!number || number === '0') return '0';
    const numericValue = parseInt(number, 10).toString();
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleBalanceChange = (text: string) => {
    const cleaned = text.replace(/[^0-9,]/g, '').replace(/,/g, '');
    if (!cleaned) {
      setInitialBalance('0');
      return;
    }
    const numericValue = parseInt(cleaned, 10).toString();
    setInitialBalance(numericValue);
  };

  const getSelectedTypeIcon = () => {
    const type = ACCOUNT_TYPES.find(t => t.id === selectedType);
    return type?.icon || '💰';
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sửa tài khoản</Text>
        <TouchableOpacity
          style={styles.saveIconBtn}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={[styles.saveIcon, loading && { opacity: 0.5 }]}>
            ✓
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Initial Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Số dư ban đầu</Text>
          <View style={styles.balanceInputRow}>
            <TextInput
              style={styles.balanceInput}
              value={formatNumber(initialBalance)}
              onChangeText={handleBalanceChange}
              keyboardType="numeric"
              textAlign="center"
            />
            <Text style={styles.balanceCurrency}>₫</Text>
          </View>
        </View>

        {/* Account Name */}
        <View style={styles.fieldRow}>
          <View style={styles.fieldIcon}>
            <Text style={styles.fieldIconText}>{getSelectedTypeIcon()}</Text>
          </View>
          <TextInput
            style={styles.fieldInput}
            placeholder="Tên tài khoản"
            placeholderTextColor="#999"
            value={accountName}
            onChangeText={setAccountName}
          />
        </View>

        {/* Account Type */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => {
            // TODO: Open type selector modal
          }}
        >
          <View style={[styles.fieldIcon, styles.iconBlue]}>
            <Text style={styles.fieldIconText}>💰</Text>
          </View>
          <Text style={styles.fieldText}>
            {ACCOUNT_TYPES.find(t => t.id === selectedType)?.label ||
              'Tiền mặt'}
          </Text>
          <Text style={styles.fieldArrow}>›</Text>
        </TouchableOpacity>

        {/* Currency */}
        <TouchableOpacity
          style={styles.fieldRow}
          onPress={() => {
            // TODO: Open currency selector
          }}
        >
          <View style={[styles.fieldIcon, styles.iconCard]}>
            <Text style={styles.fieldIconText}>💳</Text>
          </View>
          <Text style={styles.fieldText}>{currency}</Text>
          <Text style={styles.fieldArrow}>›</Text>
        </TouchableOpacity>

        {/* Note */}
        <View style={styles.fieldRow}>
          <View style={[styles.fieldIcon, styles.iconNote]}>
            <Text style={styles.fieldIconText}>📝</Text>
          </View>
          <TextInput
            style={styles.fieldInput}
            placeholder="Diễn giải"
            placeholderTextColor="#999"
            value={note}
            onChangeText={setNote}
          />
        </View>

        {/* Exclude from Reports */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleLeft}>
            <Text style={styles.toggleTitle}>Không tính vào báo cáo</Text>
            <Text style={styles.toggleSubtitle}>
              Ghi chép trên tài khoản này sẽ không được thống kê vào TẤT CẢ báo
              cáo (trừ báo cáo theo đối vay nợ)
            </Text>
          </View>
          <Switch
            value={excludeFromReports}
            onValueChange={setExcludeFromReports}
            trackColor={{ false: '#E5E5E5', true: '#4CAF50' }}
            thumbColor="#fff"
          />
        </View>

        {/* Delete Button */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Xóa</Text>
        </TouchableOpacity>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Lưu lại</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  saveIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveIcon: {
    fontSize: 24,
    color: '#4A90E2',
  },
  content: {
    flex: 1,
  },
  balanceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 12,
  },
  balanceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceInput: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4A90E2',
    minWidth: 100,
  },
  balanceCurrency: {
    fontSize: 24,
    color: '#4A90E2',
    marginLeft: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFE4B5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBlue: {
    backgroundColor: '#E3F2FD',
  },
  iconCard: {
    backgroundColor: '#F3E5F5',
  },
  iconNote: {
    backgroundColor: '#FFF3E0',
  },
  fieldIconText: {
    fontSize: 18,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  fieldText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  fieldArrow: {
    fontSize: 20,
    color: '#CCC',
  },
  toggleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
  },
  toggleLeft: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#FF3B30',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF3B30',
  },
  saveBtn: {
    backgroundColor: '#00BCD4',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
