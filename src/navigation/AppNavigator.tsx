import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from './MainNavigator';
import { AuthProvider } from '../contexts/AuthContext';
import { navigationRef } from './navigationRef';
import { KeyboardProvider } from 'react-native-keyboard-controller';

export const AppNavigator = () => {
  //test
  return (
    <KeyboardProvider>
      <AuthProvider>
        <NavigationContainer ref={navigationRef}>
          <MainNavigator />
        </NavigationContainer>
      </AuthProvider>
    </KeyboardProvider>
  );
};
