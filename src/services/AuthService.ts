import AsyncStorage from '@react-native-async-storage/async-storage';

export enum EKeyAsyncStorage {
  SECTION_KEY = 'SECTION_KEY',
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  INFO_USER = 'INFO_USER',
  UPLOADED_IMAGES = 'UPLOADED_IMAGES',
}

class AuthService {
  getCredentials(key: EKeyAsyncStorage): Promise<string | null> {
    return AsyncStorage.getItem(key.toString());
  }

  setCredentials(key: EKeyAsyncStorage, payload: string): Promise<void> {
    return AsyncStorage.setItem(key.toString(), payload);
  }

  removeCredentials(key: EKeyAsyncStorage): Promise<void> {
    return AsyncStorage.removeItem(key.toString());
  }

  static shared = new AuthService();
}

export default AuthService;
