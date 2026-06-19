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
import { changePassword } from '../../apis/apis';

// ─── PasswordField phải được định nghĩa NGOÀI component chính ────────────────
// Nếu đặt bên trong, mỗi lần state thay đổi React tạo lại kiểu component mới
// → unmount/remount TextInput → mất focus sau mỗi ký tự gõ.
const PasswordField = ({
  label,
  value,
  onChangeText,
  show,
  onToggleShow,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder: string;
}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputRow}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        placeholder={placeholder}
        placeholderTextColor="#C7C7CC"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={styles.eyeBtn} onPress={onToggleShow}>
        <Text style={styles.eyeIcon}>{show ? '🙈' : '👁️'}</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────
export const ChangePasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Password rules ─────────────────────────────────────────────────────────
  const rules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return null;
    const passed = [
      pwd.length >= 8,
      /[A-Z]/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd),
    ].filter(Boolean).length;
    if (passed === 0 || pwd.length < 4)
      return { label: 'Quá yếu', color: '#FF3B30', pct: 15 };
    if (passed === 1) return { label: 'Yếu', color: '#FF9500', pct: 35 };
    if (passed === 2) return { label: 'Trung bình', color: '#FFD700', pct: 65 };
    return { label: 'Mạnh', color: '#34C759', pct: 100 };
  };

  const validateNewPassword = (): string | null => {
    if (newPassword.length < 8) return 'Mật khẩu mới phải có ít nhất 8 ký tự';
    if (!/[A-Z]/.test(newPassword))
      return 'Mật khẩu mới phải có ít nhất 1 chữ hoa';
    if (!/[^A-Za-z0-9]/.test(newPassword))
      return 'Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt (!@#$...)';
    return null;
  };

  const strength = getPasswordStrength(newPassword);

  const isFormValid =
    currentPassword.length > 0 &&
    rules.length &&
    rules.uppercase &&
    rules.special &&
    confirmPassword === newPassword &&
    confirmPassword.length > 0;

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    const pwdError = validateNewPassword();
    if (pwdError) {
      Alert.alert('Mật khẩu không hợp lệ', pwdError);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Lỗi', 'Xác nhận mật khẩu không khớp');
      return;
    }
    try {
      setLoading(true);
      const res = await changePassword({ currentPassword, newPassword });
      if (res.success) {
        Alert.alert('Thành công', 'Đổi mật khẩu thành công!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể đổi mật khẩu');
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        'Đổi mật khẩu thất bại, vui lòng thử lại';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon header */}
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🔒</Text>
        </View>
        <Text style={styles.title}>Đổi mật khẩu</Text>
        <Text style={styles.subtitle}>
          Ít nhất 8 ký tự · 1 chữ hoa · 1 ký tự đặc biệt
        </Text>

        {/* Fields */}
        <View style={styles.card}>
          <PasswordField
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            show={showCurrent}
            onToggleShow={() => setShowCurrent(s => !s)}
            placeholder="Nhập mật khẩu hiện tại"
          />

          <View style={styles.divider} />

          <PasswordField
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={setNewPassword}
            show={showNew}
            onToggleShow={() => setShowNew(s => !s)}
            placeholder="Nhập mật khẩu mới"
          />

          {/* Strength bar */}
          {strength && (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    {
                      width: `${strength.pct}%` as any,
                      backgroundColor: strength.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          {/* Rule checklist */}
          {newPassword.length > 0 && (
            <View style={styles.rulesWrap}>
              <Text
                style={[styles.ruleItem, rules.length ? styles.rulePass : {}]}
              >
                {rules.length ? '✅' : '○'} Ít nhất 8 ký tự
              </Text>
              <Text
                style={[
                  styles.ruleItem,
                  rules.uppercase ? styles.rulePass : {},
                ]}
              >
                {rules.uppercase ? '✅' : '○'} Có ít nhất 1 chữ hoa
              </Text>
              <Text
                style={[styles.ruleItem, rules.special ? styles.rulePass : {}]}
              >
                {rules.special ? '✅' : '○'} Có ít nhất 1 ký tự đặc biệt
                (!@#...)
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <PasswordField
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            show={showConfirm}
            onToggleShow={() => setShowConfirm(s => !s)}
            placeholder="Nhập lại mật khẩu mới"
          />

          {confirmPassword.length > 0 && confirmPassword !== newPassword && (
            <Text style={styles.mismatch}>⚠️ Mật khẩu xác nhận chưa khớp</Text>
          )}
          {confirmPassword.length > 0 && confirmPassword === newPassword && (
            <Text style={styles.match}>✅ Mật khẩu khớp</Text>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Yêu cầu mật khẩu:</Text>
          <Text style={styles.tip}>• Tối thiểu 8 ký tự</Text>
          <Text style={styles.tip}>• Ít nhất 1 chữ hoa (A–Z)</Text>
          <Text style={styles.tip}>
            • Ít nhất 1 ký tự đặc biệt (!@#$%^&*...)
          </Text>
          <Text style={styles.tip}>• Không dùng thông tin cá nhân</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!isFormValid || loading) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Đổi mật khẩu</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
        >
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

  iconWrap: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  icon: { fontSize: 36 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 16,
  },
  fieldGroup: { paddingVertical: 12 },
  fieldLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 46,
    fontSize: 16,
    color: '#1A1A1A',
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#F0F0F0' },

  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 60 },

  mismatch: { fontSize: 12, color: '#FF3B30', marginTop: 6 },
  match: { fontSize: 12, color: '#34C759', marginTop: 6 },

  rulesWrap: { marginTop: 10, gap: 4 },
  ruleItem: { fontSize: 12, color: '#AAAAAA' },
  rulePass: { color: '#34C759', fontWeight: '600' as const },

  tipsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 6,
  },
  tip: { fontSize: 13, color: '#3B82F6', marginBottom: 3 },

  submitBtn: {
    backgroundColor: '#FF9500',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF9500',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: '#888', fontSize: 15 },
});
