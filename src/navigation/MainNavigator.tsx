import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { LoginScreen } from '../screen/LoginScreen';
import RegisterScreen from '../screen/RegisterScreen';
import PasswordLoginScreen from '../screen/PasswordLoginScreen';
import { useAuth } from '../contexts/AuthContext';
import BottomTabsNavigator from './BottomTabNavigator';
import AIChatScreen from '../screen/AIChatScreen';

export type MainStackParamList = {
  Tabs: undefined;
  Login: undefined;
  PasswordLogin: { phone: string };
  Register: { phone: string };
  AIChat: undefined;
};

const Main = createNativeStackNavigator<MainStackParamList>();

export default function MainNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Main.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Main.Screen name="Tabs" component={BottomTabsNavigator} />
          <Main.Screen
            name="AIChat"
            component={AIChatScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </>
      ) : (
        <>
          <Main.Screen name="Login" component={LoginScreen} />
          <Main.Screen name="PasswordLogin" component={PasswordLoginScreen} />
          <Main.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Main.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
