import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReportScreen from '../screen/ReportScreen';
import ReportDetailScreen from '../screen/ReportDetailScreen';
import BalanceDetailScreen from '../screen/BalanceDetailScreen';
import AIAnalysisScreen from '../screen/AIAnalysisScreen';

const Stack = createNativeStackNavigator();

export const ReportStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ReportMain" component={ReportScreen} />
      <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
      <Stack.Screen name="BalanceDetailScreen" component={BalanceDetailScreen} />
      <Stack.Screen name="AIAnalysis" component={AIAnalysisScreen} />
    </Stack.Navigator>
  );
};
