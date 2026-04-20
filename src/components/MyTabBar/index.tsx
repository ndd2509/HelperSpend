import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';


// ─── Tab icon map ──────────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  home:   { active: '🏠', inactive: '🏡' },
  wallet: { active: '💛', inactive: '💛' },
  scan:   { active: '⬛', inactive: '⬜' },
  report: { active: '📊', inactive: '📈' },
  other:  { active: '☰', inactive: '≡' },
};

const TAB_LABELS: Record<string, string> = {
  home:   'Trang chủ',
  wallet: 'Ví',
  scan:   'Quét QR',
  report: 'Báo cáo',
  other:  'Khác',
};

export default function MyTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const handleAddPress = () => {
    // Nested navigation: navigate to 'home' tab and push 'AddTransaction' into its stack
    navigation.navigate('home', {
      screen: 'AddTransaction',
      params: { type: 'expense' },
    } as any);
  };


  const routes = state.routes;
  const midIndex = Math.floor(routes.length / 2);
  const leftRoutes = routes.slice(0, midIndex);
  const rightRoutes = routes.slice(midIndex);

  const renderTab = (route: typeof routes[0], index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const icons = TAB_ICONS[route.name];
    const label = TAB_LABELS[route.name] ?? route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const onLongPress = () => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tab}
      >
        {/* Active indicator dot */}
        <View style={[styles.activeBar, isFocused && styles.activeBarVisible]} />

        <Text style={styles.tabIcon}>
          {icons ? (isFocused ? icons.active : icons.inactive) : '⭕'}
        </Text>
        <Text style={[styles.label, isFocused ? styles.labelActive : styles.labelInactive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Left tabs */}
      <View style={styles.side}>
        {leftRoutes.map((route) => {
          const index = routes.indexOf(route);
          return renderTab(route, index);
        })}
      </View>

      {/* Center FAB */}
      <View style={styles.fabWrapper}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddPress}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Right tabs */}
      <View style={styles.side}>
        {rightRoutes.map((route) => {
          const index = routes.indexOf(route);
          return renderTab(route, index);
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 10 },
    }),
  },
  side: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  activeBar: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  activeBarVisible: {
    backgroundColor: '#5C6BC0',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  labelActive: {
    color: '#5C6BC0',
  },
  labelInactive: {
    color: '#AAAAAA',
  },

  // ── Center FAB
  fabWrapper: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
    // Lift the FAB above the tab bar
    marginTop: -28,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#5C6BC0',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#5C6BC0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 10,
      },
      android: { elevation: 12 },
    }),
  },
  fabIcon: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '300',
    lineHeight: 34,
    textAlign: 'center',
  },
});
