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
import { requestLogin } from '../../apis/apis';
import { useAuth } from '../../contexts/AuthContext';
import HeaderLogin from '../../components/HeaderLogin';
import { SvgXml } from 'react-native-svg';
import { Icon } from '../../assets/svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RootStackParamList = {
  Login: undefined;
  PasswordLogin: { phone: string };
  Register: { phone: string };
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PasswordLogin'>;
  route: RouteProp<RootStackParamList, 'PasswordLogin'>;
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

  const paddingInput = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_HEIGHT * 0.05],
  });

  const formatDisplayPhone = (p: string) => {
    if (p.length <= 4) return p;
    if (p.length <= 7) return `${p.slice(0, 4)} ${p.slice(4)}`;
    return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7, 10)}`;
  };

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
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Có lỗi xảy ra, vui lòng thử lại';
      setErrorMessage(msg);
    } finally {
      setTimeout(() => setLoading(false), 300);
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
        <View style={styles.viewTitle}>
          <Text style={styles.txtTitle}>Nhập mật khẩu</Text>
          <Text style={styles.txtSubtitle}>
            Đăng nhập cho số {formatDisplayPhone(phone)}
          </Text>
        </View>

        <Animated.View
          style={[
            styles.inputContainer,
            { transform: [{ translateY: paddingInput }] },
          ]}
        >
          <View style={styles.inputView}>
            <View style={styles.flexContainerInput}>
              <TextInput
                ref={refPasswordInput}
                placeholderTextColor={'#A5A5A5'}
                style={styles.inputStyle}
                placeholder="Mật khẩu"
                value={password}
                onChangeText={text => {
                  setPassword(text);
                  setErrorMessage(null);
                }}
                secureTextEntry={!showPassword}
                autoFocus
                cursorColor={'#8662F8'}
              />
            </View>
            <TouchableOpacity
              style={styles.togglePassword}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.toggleText}>
                {showPassword ? 'Ẩn' : 'Hiện'}
              </Text>
            </TouchableOpacity>
          </View>

          {errorMessage && (
            <View style={styles.containerErrMsg}>
              <SvgXml xml={Icon.ic_error} style={styles.iconStyle} />
              <Text style={styles.errTxtInput}>{errorMessage}</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY: height }],
            paddingBottom: bottom,
          }}
        >
          <TouchableOpacity
            onPress={handleLogin}
            style={[
              styles.btnLogin,
              {
                backgroundColor:
                  password.length >= 6 ? '#252525' : '#A5A5A5',
              },
            ]}
            disabled={password.length < 6 || loading}
          >
            {loading ? (
              <ActivityIndicator color={'#fff'} />
            ) : (
              <Text style={styles.txtBtnLogin}>Đăng nhập</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default PasswordLoginScreen;

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
  flexContainerInput: {
    flex: 1,
  },
  inputStyle: {
    color: '#252525',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 28,
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
    marginTop: 8,
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
  btnLogin: {
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 100,
  },
  txtBtnLogin: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
});
