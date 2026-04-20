import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { HomeStackNavigator } from './HomeStackNavigator';
import { ReportStackNavigator } from './ReportStackNavigator';
import { WalletStackNavigator } from './WalletStackNavigator';
import { ProfileScreen } from '../screen/ProfileScreen';
import { ScanStackNavigator } from './ScanStackNavigator';
import { tabbar } from './dataTabbar';
import MyTabBar from '../components/MyTabBar';

const Tab = createBottomTabNavigator();

const screenComponents: { [key: string]: React.FC<any> | undefined } = {
  home: HomeStackNavigator,
  wallet: WalletStackNavigator,
  scan: ScanStackNavigator,
  report: ReportStackNavigator,
  other: ProfileScreen,
};

const AIChatFAB = () => {
  const navigation = useNavigation<any>();
  const state = useNavigationState(s => s);

  // Hide on scan tab
  const currentTab = state?.routes?.[state.index]?.name;
  if (currentTab === 'scan') {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.fab}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('AIChat')}
    >
      <Text style={styles.fabIcon}>🤖</Text>
    </TouchableOpacity>
  );
};

export default function BottomTabsNavigator() {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        tabBar={props => <MyTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        {Object.entries(tabbar).map(([key, value]) => {
          const { title } = value;
          const Component = screenComponents[key];
          return (
            <Tab.Screen
              key={key}
              name={key}
              children={() => (Component ? <Component /> : null)}
              options={{
                title,
              }}
            />
          );
        })}
      </Tab.Navigator>
      <AIChatFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5856D6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5856D6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  fabIcon: {
    fontSize: 28,
  },
});
