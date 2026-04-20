import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService, { EKeyAsyncStorage } from '../services/AuthService';
import NotificationService from '../services/NotificationService';
import { updateDeviceToken } from '../apis/apis';

interface User {
  id: string;
  phone: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (
    accessToken: string,
    refreshToken: string,
    user: User,
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const accessToken = await AuthService.shared.getCredentials(
        EKeyAsyncStorage.ACCESS_TOKEN,
      );
      const userInfo = await AuthService.shared.getCredentials(
        EKeyAsyncStorage.INFO_USER,
      );

      if (accessToken && userInfo) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userInfo));
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (
    accessToken: string,
    refreshToken: string,
    userData: User,
  ) => {
    try {
      // Save tokens and user info
      await AuthService.shared.setCredentials(
        EKeyAsyncStorage.ACCESS_TOKEN,
        accessToken,
      );
      await AuthService.shared.setCredentials(
        EKeyAsyncStorage.REFRESH_TOKEN,
        refreshToken,
      );
      await AuthService.shared.setCredentials(
        EKeyAsyncStorage.INFO_USER,
        JSON.stringify(userData),
      );
      await AuthService.shared.setCredentials(
        EKeyAsyncStorage.SECTION_KEY,
        JSON.stringify({ accessToken, refreshToken }),
      );

      setIsAuthenticated(true);
      setUser(userData);

      // Initialize notifications and get FCM token
      // Wait a bit for Firebase to initialize, then retry if needed
      try {
        // Try to get token with retries
        let fcmToken = null;
        let retries = 3;

        while (!fcmToken && retries > 0) {
          fcmToken = await NotificationService.getToken();
          if (!fcmToken) {
            console.log(`Waiting for Firebase... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            retries--;
          }
        }

        if (fcmToken) {
          // Send token to server
          await updateDeviceToken(fcmToken);
          console.log('FCM token sent to server');
        } else {
          console.warn('Could not get FCM token after retries');
        }

        // Setup notification listeners
        console.log('🔧 Setting up notification listeners...');
        NotificationService.setupNotificationListeners(notification => {
          console.log('📱 Received notification:', notification);
          console.log('📱 Notification data:', notification?.data);
          console.log('📱 Notification type:', notification?.data?.type);

          // Handle navigation based on notification type
          if (notification?.data?.type === 'deposit_approved') {
            console.log('✅ Deposit approved notification detected!');

            // Import navigation at runtime to avoid circular dependency
            import('../navigation/navigationRef')
              .then(({ navigate }) => {
                console.log('📍 Navigation module loaded, calling navigate...');

                // Navigate to DepositSuccess screen with deposit details
                navigate('home', {
                  screen: 'DepositSuccess',
                  params: {
                    amount: notification.data.amount,
                    requestId: notification.data.requestId,
                  },
                });
              })
              .catch(err => {
                console.error('❌ Error importing navigation:', err);
              });
          } else {
            console.log(
              '⚠️ Not a deposit_approved notification, type:',
              notification?.data?.type,
            );
          }
        });
      } catch (notifError) {
        console.error('Error setting up notifications:', notifError);
        // Don't fail login if notification setup fails
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Delete FCM token
      try {
        await NotificationService.deleteToken();
      } catch (notifError) {
        console.error('Error deleting FCM token:', notifError);
        // Continue with logout even if token deletion fails
      }

      // Clear all credentials
      await AuthService.shared.removeCredentials(EKeyAsyncStorage.ACCESS_TOKEN);
      await AuthService.shared.removeCredentials(
        EKeyAsyncStorage.REFRESH_TOKEN,
      );
      await AuthService.shared.removeCredentials(EKeyAsyncStorage.INFO_USER);
      await AuthService.shared.removeCredentials(EKeyAsyncStorage.SECTION_KEY);

      // Clear legacy generic bank info key to prevent leaking to next user
      try {
        await AsyncStorage.removeItem('@helperSpend/bankInfo');
      } catch {}

      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
