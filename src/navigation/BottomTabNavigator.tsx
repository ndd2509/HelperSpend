import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  useNavigation,
  useNavigationState,
  useRoute,
} from '@react-navigation/native';
import { HomeStackNavigator } from './HomeStackNavigator';
import { ReportStackNavigator } from './ReportStackNavigator';
import { WalletStackNavigator } from './WalletStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { ScanStackNavigator } from './ScanStackNavigator';
import { tabbar } from './dataTabbar';
import MyTabBar from '../components/MyTabBar';

const Tab = createBottomTabNavigator();

const screenComponents: { [key: string]: React.FC<any> | undefined } = {
  home: HomeStackNavigator,
  wallet: WalletStackNavigator,
  scan: ScanStackNavigator,
  report: ReportStackNavigator,
  other: ProfileStackNavigator,
};

const AIChatFAB = ({
  currentTabIndex,
  navigation: navProp,
}: {
  currentTabIndex: number;
  navigation: any;
}) => {
  const fallbackNav = useNavigation<any>();
  const navigation = navProp || fallbackNav;

  // Hide on scan tab (index 2)
  if (currentTabIndex === 2) {
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

const AddTransactionFAB = ({
  currentTabIndex,
  navigation: navProp,
}: {
  currentTabIndex: number;
  navigation: any;
}) => {
  const fallbackNav = useNavigation<any>();
  const navigation = navProp || fallbackNav;

  // Only show on home tab (index 0)
  if (currentTabIndex !== 0) {
    return null;
  }

  const handlePress = () => {
    // Navigate to AddTransaction in home stack
    navigation.navigate('home', {
      screen: 'AddTransaction',
      params: { type: 'expense' },
    });
  };

  return (
    <TouchableOpacity
      style={styles.addFab}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <Text style={styles.addFabIcon}>+</Text>
    </TouchableOpacity>
  );
};

// Wrapper component to handle tab state updates
const TabBarWrapper = ({ onTabChange, onNavigationReady, ...props }: any) => {
  React.useEffect(() => {
    onTabChange(props.state.index);
    onNavigationReady(props.navigation);
  }, [props.state.index, props.navigation, onTabChange, onNavigationReady]);

  return <MyTabBar {...props} />;
};

export default function BottomTabsNavigator() {
  const [currentTabIndex, setCurrentTabIndex] = React.useState(0);
  const [tabNavigation, setTabNavigation] = React.useState<any>(null);

  const handleTabChange = React.useCallback((index: number) => {
    setCurrentTabIndex(index);
  }, []);

  const handleNavigationReady = React.useCallback((nav: any) => {
    setTabNavigation(nav);
  }, []);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        tabBar={props => (
          <TabBarWrapper
            {...props}
            onTabChange={handleTabChange}
            onNavigationReady={handleNavigationReady}
          />
        )}
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
      {tabNavigation && (
        <>
          <AddTransactionFAB
            currentTabIndex={currentTabIndex}
            navigation={tabNavigation}
          />
          <AIChatFAB
            currentTabIndex={currentTabIndex}
            navigation={tabNavigation}
          />
        </>
      )}
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
    bottom: 80,
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
  addFab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 145 : 150,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  addFabIcon: {
    fontSize: 36,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 42,
  },
});
