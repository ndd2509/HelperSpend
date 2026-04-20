import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

class NotificationService {
  private static instance: NotificationService;
  private fcmToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true; // Android < 13 doesn't need runtime permission
      } else {
        // iOS
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Create Android notification channel
   * Note: Firebase Messaging automatically creates a default channel
   * This method is here for future custom channel configuration
   */
  async createNotificationChannel(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // Firebase Messaging automatically creates default channel
        // Custom channel creation would go here if needed
        console.log('Using Firebase default notification channel');
      }
    } catch (error) {
      console.error('Error with notification channel:', error);
    }
  }

  /**
   * Get FCM device token
   */
  async getToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission denied');
        return null;
      }
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
      }
      const token = await messaging().getToken();
      this.fcmToken = token;
      console.log('FCM Token:', token);

      // iOS: cho phép hiển thị notification khi app foreground
      if (Platform.OS === 'ios') {
        await messaging().setAutoInitEnabled(true);
      }

      return token;
    } catch (error: any) {
      console.error('Error getting FCM token:', error);
      // Check if it's a Firebase not initialized error
      if (
        error.message?.includes('Firebase') ||
        error.message?.includes('default app')
      ) {
        console.log('Firebase not initialized yet');
      }
      return null;
    }
  }

  /**
   * Setup notification listeners
   */
  setupNotificationListeners(
    onNotification?: (notification: any) => void,
  ): () => void {
    try {
      // Handle foreground notifications
      const unsubscribeForeground = messaging().onMessage(
        async remoteMessage => {
          console.log('Foreground notification:', remoteMessage);
          onNotification?.(remoteMessage);

          // Hiển thị Alert khi nhận notification foreground
          const title = remoteMessage.notification?.title || 'Thông báo';
          const body = remoteMessage.notification?.body || '';
          Alert.alert(title, body);
        },
      );

      // Handle background/quit state notification tap
      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification opened app from background:', remoteMessage);
        onNotification?.(remoteMessage);
      });

      // Check if app was opened from a notification (quit state)
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log(
              'Notification opened app from quit state:',
              remoteMessage,
            );
            onNotification?.(remoteMessage);
          }
        });

      // Handle token refresh
      const unsubscribeTokenRefresh = messaging().onTokenRefresh(token => {
        console.log('FCM Token refreshed:', token);
        this.fcmToken = token;
        // You should send the new token to your server here
      });

      // Return cleanup function
      return () => {
        unsubscribeForeground();
        unsubscribeTokenRefresh();
      };
    } catch (error) {
      console.error('Error setting up notification listeners:', error);
      return () => {}; // Return empty cleanup function on error
    }
  }

  /**
   * Get current token (cached)
   */
  getCurrentToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Delete token (on logout)
   */
  async deleteToken(): Promise<void> {
    try {
      await messaging().deleteToken();
      this.fcmToken = null;
      console.log('FCM token deleted');
    } catch (error) {
      console.error('Error deleting FCM token:', error);
    }
  }
}

export default NotificationService.getInstance();
