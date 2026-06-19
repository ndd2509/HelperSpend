import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BaseContainer } from 'react-native-shared-components';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LENDERS_STORAGE_KEY = '@lenders_list';

interface Lender {
  id: string;
  name: string;
  createdAt: string;
}

export const LenderPickerScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const onSelect = route.params?.onSelect;

  const [searchText, setSearchText] = useState('');
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [filteredLenders, setFilteredLenders] = useState<Lender[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadLenders();
  }, []);

  useEffect(() => {
    if (searchText.trim()) {
      const filtered = lenders.filter(l =>
        l.name.toLowerCase().includes(searchText.toLowerCase()),
      );
      setFilteredLenders(filtered);
    } else {
      setFilteredLenders(lenders);
    }
  }, [searchText, lenders]);

  const loadLenders = async () => {
    try {
      const stored = await AsyncStorage.getItem(LENDERS_STORAGE_KEY);
      if (stored) {
        const parsed: Lender[] = JSON.parse(stored);
        setLenders(parsed);
        setFilteredLenders(parsed);
      }
    } catch (error) {
      console.error('Load lenders error:', error);
    }
  };

  const saveLenders = async (newLenders: Lender[]) => {
    try {
      await AsyncStorage.setItem(
        LENDERS_STORAGE_KEY,
        JSON.stringify(newLenders),
      );
    } catch (error) {
      console.error('Save lenders error:', error);
    }
  };

  const handleSelectOrCreate = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên người cho vay');
      return;
    }

    // Check if lender already exists
    const existing = lenders.find(
      l => l.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (existing) {
      // Select existing
      onSelect?.(existing.name);
      navigation.goBack();
    } else {
      // Create new lender
      const newLender: Lender = {
        id: Date.now().toString(),
        name: trimmedName,
        createdAt: new Date().toISOString(),
      };
      const updatedLenders = [newLender, ...lenders];
      setLenders(updatedLenders);
      saveLenders(updatedLenders);
      onSelect?.(newLender.name);
      navigation.goBack();
    }
  };

  const handleSelectLender = (lender: Lender) => {
    onSelect?.(lender.name);
    navigation.goBack();
  };

  const handleConfirm = () => {
    if (searchText.trim()) {
      handleSelectOrCreate(searchText);
    } else {
      Alert.alert('Lỗi', 'Vui lòng nhập hoặc chọn người cho vay');
    }
  };

  const handleEditLender = (lender: Lender) => {
    setEditingId(lender.id);
    setEditText(lender.name);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống');
      return;
    }
    const updatedLenders = lenders.map(l =>
      l.id === editingId ? { ...l, name: editText.trim() } : l,
    );
    setLenders(updatedLenders);
    saveLenders(updatedLenders);
    setEditingId(null);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleDeleteLender = (lender: Lender) => {
    Alert.alert('Xóa người cho vay', `Bạn có chắc muốn xóa "${lender.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          const updatedLenders = lenders.filter(l => l.id !== lender.id);
          setLenders(updatedLenders);
          saveLenders(updatedLenders);
        },
      },
    ]);
  };

  const handleLongPress = (lender: Lender) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Hủy', 'Sửa', 'Xóa'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            handleEditLender(lender);
          } else if (buttonIndex === 2) {
            handleDeleteLender(lender);
          }
        },
      );
    } else {
      Alert.alert('Tùy chọn', `Chọn thao tác cho "${lender.name}"`, [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Sửa', onPress: () => handleEditLender(lender) },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => handleDeleteLender(lender),
        },
      ]);
    }
  };

  return (
    <BaseContainer style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Người cho vay</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={handleConfirm}>
          <Text style={[styles.headerBtnText, styles.confirmBtn]}>✓</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Chọn hoặc nhập mới đối tượng"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleConfirm}
        />
      </View>

      {/* Lenders List */}
      <FlatList
        data={filteredLenders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {searchText.trim() ? (
              <View style={styles.createNewHint}>
                <Text style={styles.emptyText}>
                  Nhấn ✓ để tạo "{searchText.trim()}"
                </Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>
                Chưa có người cho vay nào.{'\n'}Nhập tên để tạo mới.
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const isEditing = editingId === item.id;

          if (isEditing) {
            return (
              <View style={styles.editingItem}>
                <TextInput
                  style={styles.editInput}
                  value={editText}
                  onChangeText={setEditText}
                  autoFocus
                  selectTextOnFocus
                />
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={[styles.editBtn, styles.cancelBtn]}
                    onPress={handleCancelEdit}
                  >
                    <Text style={styles.cancelBtnText}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.editBtn, styles.saveBtn]}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.saveBtnText}>Lưu</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          return (
            <View style={styles.lenderItemContainer}>
              <TouchableOpacity
                style={styles.lenderItem}
                onPress={() => handleSelectLender(item)}
              >
                <View style={styles.lenderAvatar}>
                  <Text style={styles.lenderAvatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.lenderName}>{item.name}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionBtn}
                onPress={() => handleLongPress(item)}
              >
                <Text style={styles.optionBtnText}>⋮</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </BaseContainer>
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: {
    fontSize: 22,
    color: '#333',
  },
  confirmBtn: {
    color: '#00BCD4',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
  },
  listContent: {
    paddingVertical: 8,
  },
  lenderItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lenderItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  optionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  optionBtnText: {
    fontSize: 24,
    color: '#999',
    fontWeight: '600',
  },
  lenderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00BCD4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lenderAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  lenderName: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  createNewHint: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  editingItem: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  editInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#00BCD4',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F5F7FA',
  },
  cancelBtnText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#00BCD4',
  },
  saveBtnText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
});
