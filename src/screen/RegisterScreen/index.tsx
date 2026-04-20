import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { requestRegister } from '../../apis/apis';
import { useNavigation } from '@react-navigation/native';
import AuthService, { EKeyAsyncStorage } from '../../services/AuthService';

const RegisterScreen = ({}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleRegister = async () => {
    if (!phone || !password || !name) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const response = await requestRegister(phone, password, name);
      console.log('Login response:', response);

      if (response.data?.success) {
        await AuthService.shared.setCredentials(
          EKeyAsyncStorage.ACCESS_TOKEN,
          response.data.data.accessToken,
        );
        await AuthService.shared.setCredentials(
          EKeyAsyncStorage.REFRESH_TOKEN,
          response.data.data.refreshToken,
        );
        await AuthService.shared.setCredentials(
          EKeyAsyncStorage.INFO_USER,
          JSON.stringify(response.data.data.user),
        );
        Alert.alert('Thành công', response.data.message, [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Main'),
          },
        ]);
      } else {
        Alert.alert('Lỗi', response.data?.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Có lỗi xảy ra, vui lòng thử lại';
      Alert.alert('Lỗi đăng ký', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng ký</Text>

      <TextInput
        style={styles.input}
        placeholder="Họ và tên"
        value={name}
        onChangeText={setName}
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Số điện thoại"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Đăng ký</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
        <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});

export default RegisterScreen;
