// Loan Transaction UI Component
// Renders loan-specific fields when type === 'loan'

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
} from 'react-native';

interface LoanFieldsProps {
  lender: string;
  setLender: (value: string) => void;
  dueDate: Date | null;
  setShowDueDatePicker: (show: boolean) => void;
  location: string;
  setLocation: (value: string) => void;
  imageUri: string | null;
  setShowImagePicker: (show: boolean) => void;
  note: string;
  setNote: (value: string) => void;
  date: Date;
  userName: string;
  selectedCategory: { id: string; name: string; icon: string } | null;
  onCategoryPress: () => void;
  selectedAccount: any;
  onAccountPress: () => void;
  navigation: any; // For navigating to LenderPickerScreen
}

export const LoanFields: React.FC<LoanFieldsProps> = ({
  lender,
  setLender,
  dueDate,
  setShowDueDatePicker,
  location,
  setLocation,
  imageUri,
  setShowImagePicker,
  note,
  setNote,
  date,
  userName,
  selectedCategory,
  onCategoryPress,
  selectedAccount,
  onAccountPress,
  navigation,
}) => {
  const formatDate = (d: Date) =>
    d.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.loanSection}>
      {/* Category - Borrowing */}
      <TouchableOpacity style={styles.loanField} onPress={onCategoryPress}>
        <View style={styles.loanFieldIcon}>
          <Text style={styles.loanFieldIconText}>
            {selectedCategory?.icon || '🧺'}
          </Text>
        </View>
        <Text style={styles.loanFieldText}>
          {selectedCategory?.name || 'Chọn danh mục'}
        </Text>
        <Text style={styles.loanFieldArrow}>›</Text>
      </TouchableOpacity>

      {/* Người cho vay - Navigate to LenderPickerScreen */}
      <TouchableOpacity
        style={styles.loanField}
        onPress={() => {
          navigation.navigate('LenderPicker', {
            onSelect: (selectedName: string) => setLender(selectedName),
          });
        }}
      >
        <View style={styles.loanFieldIcon}>
          <Text style={styles.loanFieldIconText}>
            {lender ? lender.charAt(0).toUpperCase() : '+'}
          </Text>
        </View>
        <Text style={[styles.loanFieldText, !lender && styles.placeholder]}>
          {lender || 'Người cho vay'}
        </Text>
        <Text style={styles.loanFieldArrow}>›</Text>
      </TouchableOpacity>

      {/* Account Selector - NEW */}
      <TouchableOpacity style={styles.loanField} onPress={onAccountPress}>
        <View style={[styles.loanFieldIcon, styles.accountIcon]}>
          <Text style={styles.accountIconText}>
            {selectedAccount?.icon || '💰'}
          </Text>
        </View>
        <Text style={styles.loanFieldText}>
          {selectedAccount?.name || 'Chọn tài khoản'}
        </Text>
        <Text style={styles.loanFieldArrow}>›</Text>
      </TouchableOpacity>

      {/* Date & Time */}
      <View style={styles.loanField}>
        <View style={styles.loanFieldIcon}>
          <Text style={styles.loanFieldIconText}>📅</Text>
        </View>
        <Text style={styles.loanFieldLabel}>Hôm nay - {formatDate(date)}</Text>
        <Text style={styles.loanFieldTime}>{formatTime(date)}</Text>
      </View>

      {/* Diễn giải (Note) */}
      <View style={styles.loanField}>
        <View style={styles.loanFieldIcon}>
          <Text style={styles.loanFieldIconText}>📝</Text>
        </View>
        <TextInput
          style={styles.loanFieldInput}
          placeholder="Diễn giải"
          placeholderTextColor="#999"
          value={note}
          onChangeText={setNote}
        />
      </View>

      {/* Ngày trả nợ */}
      {/* <TouchableOpacity
        style={styles.loanField}
        onPress={() => setShowDueDatePicker(true)}
      >
        <View style={styles.loanFieldIcon}>
          <Text style={styles.loanFieldIconText}>📆</Text>
        </View>
        <Text style={[styles.loanFieldLabel, !dueDate && styles.placeholder]}>
          {dueDate ? formatDate(dueDate) : 'Ngày trả nợ'}
        </Text>
      </TouchableOpacity> */}

      {/* Địa điểm */}
      {/* <View style={styles.loanField}>
        <View style={styles.loanFieldIcon}>
          <Text style={styles.loanFieldIconText}>📍</Text>
        </View>
        <TextInput
          style={styles.loanFieldInput}
          placeholder="Địa điểm"
          placeholderTextColor="#999"
          value={location}
          onChangeText={setLocation}
        />
      </View> */}

      {/* Image Upload */}
      <View style={styles.imageSection}>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
        )}
        <View style={styles.imageButtons}>
          <TouchableOpacity
            style={styles.imageBtn}
            onPress={() => setShowImagePicker(true)}
          >
            <Text style={styles.imageBtnIcon}>🖼️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.imageBtn}
            onPress={() => setShowImagePicker(true)}
          >
            <Text style={styles.imageBtnIcon}>📷</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ẩn chi tiết toggle */}
      <TouchableOpacity style={styles.detailToggle}>
        <Text style={styles.detailToggleText}>Ẩn chi tiết</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  loanSection: {
    marginTop: 16,
    gap: 12,
  },
  loanField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  loanFieldIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanFieldIconText: {
    fontSize: 18,
  },
  accountIcon: {
    backgroundColor: '#00BCD4',
  },
  accountIconText: {
    fontSize: 16,
  },
  loanFieldInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  loanFieldText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  loanFieldLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  loanFieldTime: {
    fontSize: 14,
    color: '#666',
  },
  loanFieldArrow: {
    fontSize: 18,
    color: '#CCC',
  },
  placeholder: {
    color: '#999',
  },
  imageSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F0F4F8',
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  imageBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBtnIcon: {
    fontSize: 24,
  },
  detailToggle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailToggleText: {
    fontSize: 14,
    color: '#00BCD4',
    fontWeight: '500',
  },
});
