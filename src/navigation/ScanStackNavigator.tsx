import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ScanScreen from '../screen/ScanScreen';
import TransferScreen from '../screen/TransferScreen';
import TransferSuccessScreen from '../screen/TransferSuccessScreen';
import GroupFundContributeScreen from '../screen/GroupFundContributeScreen';
import GroupFundSpendScreen from '../screen/GroupFundSpendScreen';

const Stack = createNativeStackNavigator();

export const ScanStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScanMain" component={ScanScreen} />
      <Stack.Screen name="Transfer" component={TransferScreen} />
      <Stack.Screen
        name="TransferSuccess"
        component={TransferSuccessScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="GroupFundContribute" component={GroupFundContributeScreen} />
      <Stack.Screen name="GroupFundSpend" component={GroupFundSpendScreen} />
    </Stack.Navigator>
  );
};
