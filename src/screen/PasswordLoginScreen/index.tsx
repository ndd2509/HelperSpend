import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardAnimation } from 'react-native-keyboard-controller';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { requestLogin } from '../../apis/apis';
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
  navigation: NativeStackNavigationProp<RootStackParamList, 'PasswordLogin'>;
  route: RouteProp<RootStackParamList, 'PasswordLogin'>;
};

const ACCENT = '#8662F8';

const formatDisplayPhone = (p: string) => {
  if (p.length <= 4) return p;
  if (p.length <= 7) return `${p.slice(0, 4)} ${p.slice(4)}`;
  return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7, 10)}`;
};

const PasswordLoginScreen = ({ navigation, route }: Props) => {
  const { phone } = route.params;
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const refPasswordInput = useRef<TextInput>(null);
  const { login } = useAuth();
  const { bottom } = useSafeAreaInsets();
  const { height, progress } = useKeyboardAnimation();

  const slideUp = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_HEIGHT * 0.04],
  });

  const handleLogin = async () => {
    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    Keyboard.dismiss();

    try {
      const response = await requestLogin(phone, password);
      if (response.data?.success) {
        const { accessToken, refreshToken, user } = response.data.data;
        await login(accessToken, refreshToken, user);
      } else {
        setErrorMessage(response.data?.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      setErrorMessage(
        error?.response?.data?.message ||
          error?.message ||
          'Có lỗi xảy ra, vui lòng thử lại',
      );
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const isReady = password.length >= 6;

  return (
    <View style={styles.container}>
      <HeaderLogin
        isBack
        onPressBack={() => navigation.goBack()}
        onCloseKeyboard={() => Keyboard.dismiss()}
      />

      {/* ── Content block slides up when keyboard opens ── */}
      <Animated.View
        style={[
          styles.content,
          { transform: [{ translateY: slideUp }] },
        ]}>

        {/* Avatar circle */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {phone.slice(-2, -1)}
          </Text>
        </View>

        {/* Greeting */}
        <Text style={styles.title}>Xin chào!</Text>
        <Text style={styles.phone}>{formatDisplayPhone(phone)}</Text>

        {/* Input card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Mật khẩu</Text>
          <View
            style={[
              styles.inputRow,
              errorMessage ? styles.inputRowError : null,
            ]}>
            <TextInput
              ref={refPasswordInput}
              style={styles.input}
              placeholder="Nhập mật khẩu của bạn"
              placeholderTextColor="#C4C4C4"
              value={password}
              onChangeText={text => {
                setPassword(text);
                setErrorMessage(null);
              }}
              secureTextEntry={!showPassword}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              cursorColor={ACCENT}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(v => !v)}
              style={styles.eyeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.eyeIcon}>
                {showPassword ? '🙈' : '👁'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {errorMessage && (
            <View style={styles.errorRow}>
              <SvgXml xml={Icon.ic_error} style={styles.errorIcon} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* ── Button floats above keyboard ── */}
      <Animated.View
        style={[
          styles.footer,
          {
            transform: [{ translateY: height }],
            paddingBottom: bottom + 16,
          },
        ]}>
        <TouchableOpacity
          style={[styles.btn, !isReady && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={!isReady || loading}
          activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default PasswordLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // ── Content ──
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 24,
  },

  // Avatar
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ACCENT + '18',
    borderWidth: 2,
    borderColor: ACCENT + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: ACCENT,
  },

  // Title
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  phone: {
    fontSize: 15,
    color: '#888',
    fontWeight: '400',
    marginBottom: 32,
  },

  // Input card
  card: {
    width: '100%',
    backgroundColor: '#F8F7FF',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.07,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
    }),
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDE9FD',
    paddingHorizontal: 16,
    height: 52,
  },
  inputRowError: {
    borderColor: '#F43F5E',
  },
  input: {
    flex: 1,
    fontSize: 17,
    color: '#1A1A2E',
    fontWeight: '500',
    textAlignVertical: 'center',
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
  },
  eyeIcon: {
    fontSize: 18,
  },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  errorIcon: {
    alignSelf: 'center',
  },
  errorText: {
    fontSize: 13,
    color: '#F43F5E',
    fontWeight: '500',
    flex: 1,
  },

  // ── Footer button ──
  footer: {
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  btn: {
    backgroundColor: ACCENT,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 8 },
    }),
  },
  btnDisabled: {
    backgroundColor: '#D1C4F7',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
