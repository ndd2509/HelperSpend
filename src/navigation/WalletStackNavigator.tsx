import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WalletScreen } from '../screen/WalletScreen';
import { DepositRequestScreen } from '../screen/DepositRequestScreen';

const Stack = createNativeStackNavigator();

export const WalletStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletMain" component={WalletScreen} />
      <Stack.Screen name="DepositRequest" component={DepositRequestScreen} />
    </Stack.Navigator>
  );
};
