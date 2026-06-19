import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../apis/apis';

export const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const hasChanged = name.trim() !== (user?.name || '').trim();

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống');
      return;
    }
    if (name.trim().length > 50) {
      Alert.alert('Lỗi', 'Tên không được quá 50 ký tự');
      return;
    }
    if (!hasChanged) {
      navigation.goBack();
      return;
    }
    try {
      setLoading(true);
      const res = await updateProfile({ name: name.trim() });
      if (res.success) {
        if (res.data?.user) {
          updateUser(res.data.user);
        }
        Alert.alert('Thành công', 'Cập nhật thông tin thành công', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể cập nhật thông tin');
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Cập nhật thất bại, vui lòng thử lại';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {/* Avatar preview */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {name.trim()
                ? name
                    .trim()
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : '?'}
            </Text>
          </View>
          <Text style={styles.avatarHint}>Tên hiển thị trong ứng dụng</Text>
        </View>

        {/* Form card */}
        <View style={styles.card}>
          {/* Tên */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Họ và tên</Text>
            <TextInput
              style={[
                styles.input,
                name.trim().length > 0 && name.trim().length <= 50
                  ? styles.inputValid
                  : name.length > 0
                  ? styles.inputInvalid
                  : null,
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#C7C7CC"
              maxLength={51}
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <Text
              style={[
                styles.counter,
                name.length > 50 ? styles.counterOver : null,
              ]}>
              {name.length}/50
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Số điện thoại — read only */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Số điện thoại</Text>
            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyIcon}>📱</Text>
              <Text style={styles.readOnlyValue}>{user?.phone}</Text>
              <View style={styles.lockedBadge}>
                <Text style={styles.lockedText}>🔒 Không thể đổi</Text>
              </View>
            </View>
            <Text style={styles.phoneHint}>
              Số điện thoại được dùng để đăng nhập, không thể thay đổi.
            </Text>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!hasChanged || loading || name.trim().length === 0 || name.length > 50) &&
              styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={loading || name.trim().length === 0 || name.length > 50}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>
              {hasChanged ? 'Lưu thay đổi' : 'Không có thay đổi'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F5F5' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  avatarWrap: { alignItems: 'center', marginTop: 8, marginBottom: 24 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00A8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  avatarHint: { fontSize: 13, color: '#888' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 24,
  },
  fieldGroup: { paddingVertical: 14 },
  fieldLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  inputValid: { borderColor: '#34C759' },
  inputInvalid: { borderColor: '#FF3B30' },
  counter: { fontSize: 12, color: '#AAA', textAlign: 'right', marginTop: 4 },
  counterOver: { color: '#FF3B30' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#F0F0F0' },

  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 8,
  },
  readOnlyIcon: { fontSize: 16 },
  readOnlyValue: { flex: 1, fontSize: 16, color: '#555' },
  lockedBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockedText: { fontSize: 11, color: '#888' },
  phoneHint: { fontSize: 12, color: '#AAA', marginTop: 6 },

  saveBtn: {
    backgroundColor: '#00A8E8',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#00A8E8',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: '#888', fontSize: 15 },
});
