import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WalletScreen } from '../screen/WalletScreen';
import { DepositRequestScreen } from '../screen/DepositRequestScreen';
import { SharedFundIntroScreen } from '../screen/SharedFundIntroScreen';
import CreateGroupFundScreen from '../screen/CreateGroupFundScreen';
import GroupFundDetailScreen from '../screen/GroupFundDetailScreen';
import GroupFundListScreen from '../screen/GroupFundListScreen';
import QrGroupFundScreen from '../screen/QrGroupFundScreen';
import QRPaymentScreen from '../screen/QRPaymentScreen';

const Stack = createNativeStackNavigator();

export const WalletStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="WalletMain" component={WalletScreen} />
      <Stack.Screen name="DepositRequest" component={DepositRequestScreen} />
      <Stack.Screen name="SharedFundIntro" component={SharedFundIntroScreen} />
      <Stack.Screen name="CreateGroupFund" component={CreateGroupFundScreen} />
      <Stack.Screen name="GroupFundDetail" component={GroupFundDetailScreen} />
      <Stack.Screen name="GroupFundList" component={GroupFundListScreen} />
      <Stack.Screen name="QrGroupFund" component={QrGroupFundScreen} />
      <Stack.Screen name="QRPayment" component={QRPaymentScreen} />
    </Stack.Navigator>
  );
};
