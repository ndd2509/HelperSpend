import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Keyboard,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation } from 'react-native-keyboard-controller';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { requestRegister } from '../../apis/apis';
import { useAuth } from '../../contexts/AuthContext';
import HeaderLogin from '../../components/HeaderLogin';
import { SvgXml } from 'react-native-svg';
import { Icon } from '../../assets/svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

type RootStackParamList = {
  Login: undefined;
  PasswordLogin: { phone: string };
  Register: { phone: string };
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
  route: RouteProp<RootStackParamList, 'Register'>;
};

const RegisterScreen = ({ navigation, route }: Props) => {
  const { phone } = route.params;
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();
  const { bottom } = useSafeAreaInsets();
  const { height, progress } = useKeyboardAnimation();
  const refPasswordInput = useRef<TextInput>(null);

  const paddingInput = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_HEIGHT * 0.05],
  });

  const formatDisplayPhone = (p: string) => {
    if (p.length <= 4) return p;
    if (p.length <= 7) return `${p.slice(0, 4)} ${p.slice(4)}`;
    return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7, 10)}`;
  };

  // ── Password rules ─────────────────────────────────────────────────────────
  const passwordRules = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  };
  const allRulesPass = passwordRules.length && passwordRules.uppercase && passwordRules.special;

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return null;
    const passed = [
      pwd.length >= 8,
      /[A-Z]/.test(pwd),
      /[^A-Za-z0-9]/.test(pwd),
    ].filter(Boolean).length;
    if (passed === 0 || pwd.length < 4) return { label: 'Quá yếu',   color: '#FF3B30', pct: 15  };
    if (passed === 1)                   return { label: 'Yếu',        color: '#FF9500', pct: 35  };
    if (passed === 2)                   return { label: 'Trung bình', color: '#FFD700', pct: 65  };
                                        return { label: 'Mạnh',       color: '#34C759', pct: 100 };
  };
  const strength = getPasswordStrength(password);

  const isFormValid = name.trim().length >= 2 && Boolean(allRulesPass);

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên');
      return;
    }
    if (name.trim().length < 2) {
      setErrorMessage('Tên phải có ít nhất 2 ký tự');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMessage('Mật khẩu phải có ít nhất 1 chữ hoa');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setErrorMessage('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$...)');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    Keyboard.dismiss();

    try {
      const response = await requestRegister(phone, password, name.trim());

      if (response.data?.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        // Dùng login() từ useAuth — tự động điều hướng sang Tabs
        await login(accessToken, refreshToken, user);
      } else {
        setErrorMessage(response.data?.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Có lỗi xảy ra, vui lòng thử lại';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderLogin
        isBack
        onPressBack={() => navigation.goBack()}
        onCloseKeyboard={() => Keyboard.dismiss()}
      />

      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        {/* Title */}
        <View style={styles.viewTitle}>
          <Text style={styles.txtTitle}>Tạo tài khoản</Text>
          <Text style={styles.txtSubtitle}>
            Đăng ký cho số {formatDisplayPhone(phone)}
          </Text>
        </View>

        {/* Inputs */}
        <Animated.View
          style={[
            styles.inputContainer,
            { transform: [{ translateY: paddingInput }] },
          ]}>

          {/* Tên */}
          <View style={[styles.inputView, { marginBottom: 24 }]}>
            <View style={styles.flexContainerInput}>
              <TextInput
                style={styles.inputStyle}
                placeholder="Họ và tên"
                placeholderTextColor="#A5A5A5"
                value={name}
                onChangeText={text => {
                  setName(text);
                  setErrorMessage(null);
                }}
                autoFocus
                returnKeyType="next"
                onSubmitEditing={() => refPasswordInput.current?.focus()}
                cursorColor="#8662F8"
              />
            </View>
          </View>

          {/* Mật khẩu */}
          <View style={styles.inputView}>
            <View style={styles.flexContainerInput}>
              <TextInput
                ref={refPasswordInput}
                style={styles.inputStyle}
                placeholder="Mật khẩu (ít nhất 8 ký tự)"
                placeholderTextColor="#A5A5A5"
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  setErrorMessage(null);
                }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                cursorColor="#8662F8"
              />
            </View>
            <TouchableOpacity
              style={styles.togglePassword}
              onPress={() => setShowPassword(v => !v)}>
              <Text style={styles.toggleText}>
                {showPassword ? 'Ẩn' : 'Hiện'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Strength bar */}
          {strength && (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthBar}>
                <View
                  style={[styles.strengthFill, { width: `${strength.pct}%` as any, backgroundColor: strength.color }]}
                />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}

          {/* Rule checklist */}
          {password.length > 0 && (
            <View style={styles.rulesWrap}>
              <Text style={[styles.ruleItem, passwordRules.length    ? styles.rulePass : {}]}>
                {passwordRules.length    ? '✅' : '○'} Ít nhất 8 ký tự
              </Text>
              <Text style={[styles.ruleItem, passwordRules.uppercase ? styles.rulePass : {}]}>
                {passwordRules.uppercase ? '✅' : '○'} Có ít nhất 1 chữ hoa
              </Text>
              <Text style={[styles.ruleItem, passwordRules.special   ? styles.rulePass : {}]}>
                {passwordRules.special   ? '✅' : '○'} Có ít nhất 1 ký tự đặc biệt (!@#...)
              </Text>
            </View>
          )}

          {/* Error */}
          {errorMessage && (
            <View style={styles.containerErrMsg}>
              <SvgXml xml={Icon.ic_error} style={styles.iconStyle} />
              <Text style={styles.errTxtInput}>{errorMessage}</Text>
            </View>
          )}
        </Animated.View>

        {/* Button */}
        <Animated.View
          style={{
            transform: [{ translateY: height }],
            paddingBottom: bottom,
          }}>
          <TouchableOpacity
            onPress={handleRegister}
            style={[
              styles.btnRegister,
              { backgroundColor: isFormValid ? '#252525' : '#A5A5A5' },
            ]}
            disabled={!isFormValid || loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.txtBtnRegister}>Đăng ký</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  viewTitle: {
    alignItems: 'center',
    paddingTop: 20,
  },
  txtTitle: {
    color: '#252525',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  txtSubtitle: {
    color: '#666',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 8,
  },
  inputContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    width: '100%',
  },
  inputView: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
  },
  flexContainerInput: { flex: 1 },
  inputStyle: {
    color: '#252525',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  togglePassword: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  toggleText: {
    color: '#8662F8',
    fontSize: 14,
    fontWeight: '600',
  },
  containerErrMsg: {
    flexDirection: 'row',
    marginTop: 12,
  },
  iconStyle: {
    alignSelf: 'center',
  },
  errTxtInput: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    marginLeft: 4,
    color: '#C02344',
  },
  btnRegister: {
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 100,
  },
  strengthWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  strengthBar: { flex: 1, height: 4, backgroundColor: '#F0F0F0', borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '600', width: 70 },
  rulesWrap: { marginTop: 10, gap: 4 },
  ruleItem: { fontSize: 12, color: '#AAAAAA' },
  rulePass: { color: '#34C759', fontWeight: '600' as const },
  txtBtnRegister: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
});
