import React, { useState, useRef, useEffect } from 'react';
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
  Platform,
  Dimensions,
  StatusBar,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestCheckPhone } from '../../apis/apis';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../contexts/AuthContext';
import HeaderLogin from '../../components/HeaderLogin';
import { SvgXml } from 'react-native-svg';
import { Icon } from '../../assets/svg';
import { useKeyboardAnimation } from 'react-native-keyboard-controller';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type RootStackParamList = {
  Login: undefined;
  PasswordLogin: { phone: string };
  Register: { phone: string };
};

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};
const regexPhoneNumber =
  /^(0|(\+?84))((3[2-9])|(5[25689])|(7[06-9])|([89][0-9]))\d{7}$/;

export const LoginScreen = ({ navigation }: LoginScreenProps) => {
  const [rawPhoneNumber, setRawPhoneNumber] = useState<any>('');
  const refInput = useRef<TextInput>(null);

  const [loading, setLoading] = useState(false);
  const { height, progress } = useKeyboardAnimation();
  const paddingInput = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_HEIGHT * 0.1],
  });
  const { login } = useAuth();
  const [isValid, setIsValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const refPhoneInput = useRef<TextInput>(null);
  const refPasswordInput = useRef<TextInput>(null);
  const { top, bottom } = useSafeAreaInsets();
  const [inputKey, setInputKey] = useState(0);

  // Keyboard animation
  const keyboardOffset = useRef(new Animated.Value(0)).current;

  const handlePhoneChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('84')) {
      cleaned = '0' + cleaned.slice(2);
    }
    if (cleaned.length > 0 && cleaned[0] !== '0') {
      cleaned = '0' + cleaned;
    }
    if (cleaned.length > 10) {
      cleaned = cleaned.slice(0, 10);
    }
    const displayValue = isInputFocused ? cleaned : formatPhoneNumber(cleaned);
    setRawPhoneNumber(displayValue);
    validatePhone(cleaned);
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    return regexPhoneNumber.test(phoneNumber);
  };

  // Phone formatting (same as InputPhoneScreenNew)
  const validatePhone = (phoneStr: string) => {
    const cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.length === 0) {
      setErrorMessage(null);
      setIsValid(false);
      return false;
    }
    if (cleaned.length < 10) {
      setIsValid(false);
      return false;
    }
    const isValidPhone = validatePhoneNumber(cleaned);
    if (!isValidPhone) {
      setErrorMessage('Số điện thoại không hợp lệ. Vui lòng thử lại');
      setIsValid(false);
      return false;
    }
    setErrorMessage(null);
    setIsValid(true);
    return true;
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 4) {
      return cleaned;
    }
    if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    }
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(
      7,
      10,
    )}`;
  };

  const handleContinue = async () => {
    const cleanPhone = rawPhoneNumber.replace(/\D/g, '');
    if (!validatePhone(cleanPhone)) return;

    setLoading(true);
    Keyboard.dismiss();
    try {
      const response = await requestCheckPhone(cleanPhone);
      console.log('response', response);
      if (response.data?.success) {
        const { exists } = response.data.data;
        if (exists) {
          navigation.navigate('PasswordLogin', { phone: cleanPhone });
        } else {
          navigation.navigate('Register', { phone: cleanPhone });
        }
      } else {
        Alert.alert('Lỗi', response.data?.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Có lỗi xảy ra, vui lòng thử lại';
      Alert.alert('Lỗi', msg);
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    const cleaned = rawPhoneNumber.replace(/\D/g, '');
    setRawPhoneNumber(cleaned);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
    const cleaned = rawPhoneNumber.replace(/\D/g, '');
    setRawPhoneNumber(formatPhoneNumber(cleaned));
    if (cleaned.length === 0) {
      setErrorMessage(null);
      setIsValid(false);
      return;
    }
    if (cleaned.length < 10) {
      setErrorMessage('Số điện thoại không hợp lệ. Vui lòng thử lại');
      setIsValid(false);
      return;
    }
    const isValidPhone = validatePhoneNumber(cleaned);
    if (!isValidPhone) {
      setErrorMessage('Số điện thoại không hợp lệ. Vui lòng thử lại');
      setIsValid(false);
      return;
    }
    setErrorMessage(null);
    setIsValid(true);
  };

  const clearPhoneNumber = () => {
    setRawPhoneNumber('');
    setIsValid(false);
    setErrorMessage(null);
  };

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback
        style={styles.container}
        onPress={() => Keyboard.dismiss()}
      >
        <View style={[styles.container, {}]}>
          <HeaderLogin onCloseKeyboard={() => Keyboard.dismiss()} />

          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View style={styles.viewPhone}>
              <Text style={styles.txtPhone}>Nhập số điện thoại của bạn</Text>
            </View>

            <Animated.View
              style={[
                styles.inputContainer,
                {
                  transform: [{ translateY: paddingInput }],
                },
              ]}
            >
              <View style={styles.inputView}>
                <View style={[styles.flexImage]}>
                  <SvgXml xml={Icon.ic_flag} style={styles.flag} />
                </View>
                <View style={styles.flexContainerInput}>
                  <TextInput
                    key={inputKey}
                    ref={refInput}
                    placeholderTextColor={'#A5A5A5'}
                    style={[styles.inputStyle]}
                    placeholder="xxxx xxx xxx"
                    value={rawPhoneNumber}
                    maxLength={isInputFocused ? 10 : 12}
                    onChangeText={handlePhoneChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    keyboardType="phone-pad"
                    cursorColor={'#8662F8'}
                  />
                </View>
                <View style={styles.flexBtnClear}>
                  {rawPhoneNumber.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={clearPhoneNumber}
                    >
                      <SvgXml xml={Icon.ic_clear} style={styles.iconStyle} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {errorMessage && (
                <View style={styles.containerErrMsg}>
                  <SvgXml xml={Icon.ic_error} style={styles.iconStyle} />
                  <Text style={[styles.errTxtInput]}>{errorMessage}</Text>
                </View>
              )}
            </Animated.View>

            <Animated.View
              style={{
                transform: [{ translateY: height }],
                paddingBottom: bottom,
              }}
            >
              <View style={styles.txtContainer}>
                <Text style={styles.txtContinue}>
                  Bằng việc chọn Tiếp tục, Quý khách xác nhận đã đọc và đồng ý
                  với <Text style={styles.color}>Điều khoản sử dụng</Text> và{' '}
                  <Text style={styles.color}>
                    Chính sách bảo vệ & xử lý dữ liệu
                  </Text>{' '}
                  của HelperSpend
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleContinue}
                style={[
                  styles.btnLogin,
                  {
                    backgroundColor: !isValid ? '#A5A5A5' : '#252525',
                  },
                ]}
                disabled={!isValid || loading}
              >
                {loading ? (
                  <ActivityIndicator color={'#fff'} />
                ) : (
                  <Text style={styles.txtBtnLogin}>Tiếp tục</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  flexImage: {
    flex: 1.5,
    alignContent: 'center',
  },
  flexContainerInput: {
    flex: 8,
    paddingLeft: 12,
  },
  inputView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerErrMsg: {
    flexDirection: 'row',
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  iconStyle: {
    alignSelf: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    color: '#444',
  },
  viewPhone: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 20,
  },
  txtPhone: {
    color: '#252525',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  txtContainer: {
    marginHorizontal: 20,
    paddingTop: 16,
  },
  txtContinue: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 18,
    color: '#252525',
  },
  color: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    color: '#8662F8',
  },
  body: {
    // flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    // ...space_squish({ horizontal: 16, vertical: 20 }),
    // ...stylesBorder({
    //   color: Colors.purple_brand_color_2,
    //   type: 'top',
    //   w: 1,
    // }),
  },
  txt: {
    color: '#252525',
    // ...styleTypography({
    //   fontFamily: Fonts.regular,
    //   s: 24,
    //   w: '400',
    //   lh: 32,
    // }),
    fontSize: 24,
    fontWeight: '400',
    lineHeight: 32,
  },
  inputLabel: {
    color: '#252525',
    // ...styleTypography({
    //   fontFamily: Fonts.regular,
    //   s: 32,
    //   w: '400',
    //   lh: 18,
    // }),
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 18,
  },
  contentPolicy: {
    textAlign: 'center',
    color: '#252525',
    // ...styleTypography({
    //   fontFamily: Fonts.regular,
    //   s: 14,
    //   w: '400',
    //   lh: 18,
    // }),
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleModalContent: {
    width: SCREEN_WIDTH - 32,
    alignSelf: 'center',
  },
  icCloseModal: { width: 24, height: 24 },
  btnLogin: {
    marginHorizontal: 20,
    // ...space_squish({ vertical: 12, horizontal: 20 }),
    // ...space({ px: 10, type: 'top' }),
    // ...stylesBorder({
    //   radius: 100,
    // }),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  inputContainer: {
    paddingVertical: 67,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
  },
  txtBtnLogin: {
    // ...styleTypography({
    //   s: 16,
    //   w: '600',
    //   lh: 24,
    //   fontFamily: Fonts.MonaSans_600,
    // }),
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
  },
  ic_close_modal: { width: 24, height: 24 },
  btnModal: {
    flex: 1,
    backgroundColor: '#8662F8',
    borderRadius: 16,
  },
  errTxtInput: {
    // ...styleTypography({
    //   s: 14,
    //   fontFamily: Fonts.MonaSans_400,
    //   lh: 21,
    //   w: '400',
    // }),
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 21,
    marginLeft: 4,
    color: '#C02344',
  },
  flexBtnClear: {
    flex: 1,
  },
  inputStyle: {
    // ...styleTypography({
    //   w: '500',
    //   lh: 45,
    //   s: 32,
    //   fontFamily: Fonts.MonaSans_600,
    // }),
    color: '#252525',
    fontSize: 32,
    fontWeight: '500',
    lineHeight: 45,
  },
  flag: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  styleView: {
    width: 2,
    height: 30,
    backgroundColor: '#8662F8',
    alignSelf: 'center',
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  //HeaderLogin
  containerHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  imageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: 200,
    zIndex: -1,
  },
  btnBack: {
    alignSelf: 'flex-start',
    marginVertical: 10,
  },
  imgLogo: {
    width: 132,
    height: 35,
    alignSelf: 'flex-start',
    marginVertical: 10,
  },
  buttonSupport: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 5.5,
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: '#ccc',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
    marginLeft: 'auto',
  },
});
