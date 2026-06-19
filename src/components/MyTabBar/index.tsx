import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SvgXml } from 'react-native-svg';
const scan = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V8M8 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V16M21 8V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H16M21 16V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H16" stroke="#8662F8" stroke-width="1.471" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3 12H3.01M7.5 12H7.51M16.5 12H16.51M12 12H12.01M21 12H21.01" stroke="white" stroke-width="1.96133" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
const wallet = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 9.5V7.2C20 6.0799 20 5.51984 19.782 5.09202C19.5903 4.7157 19.2843 4.40974 18.908 4.21799C18.4802 4 17.9201 4 16.8 4H5.2C4.0799 4 3.51984 4 3.09202 4.21799C2.7157 4.40973 2.40973 4.71569 2.21799 5.09202C2 5.51984 2 6.0799 2 7.2V16.8C2 17.9201 2 18.4802 2.21799 18.908C2.40973 19.2843 2.71569 19.5903 3.09202 19.782C3.51984 20 4.07989 20 5.2 20L16.8 20C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V14.5M15 12C15 11.5353 15 11.303 15.0384 11.1098C15.1962 10.3164 15.8164 9.69624 16.6098 9.53843C16.803 9.5 17.0353 9.5 17.5 9.5H19.5C19.9647 9.5 20.197 9.5 20.3902 9.53843C21.1836 9.69624 21.8038 10.3164 21.9616 11.1098C22 11.303 22 11.5353 22 12C22 12.4647 22 12.697 21.9616 12.8902C21.8038 13.6836 21.1836 14.3038 20.3902 14.4616C20.197 14.5 19.9647 14.5 19.5 14.5H17.5C17.0353 14.5 16.803 14.5 16.6098 14.4616C15.8164 14.3038 15.1962 13.6836 15.0384 12.8902C15 12.697 15 12.4647 15 12Z" stroke="#4F4F4F" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
const wallet_color = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 9.5V7.2C20 6.0799 20 5.51984 19.782 5.09202C19.5903 4.7157 19.2843 4.40974 18.908 4.21799C18.4802 4 17.9201 4 16.8 4H5.2C4.0799 4 3.51984 4 3.09202 4.21799C2.7157 4.40973 2.40973 4.71569 2.21799 5.09202C2 5.51984 2 6.0799 2 7.2V16.8C2 17.9201 2 18.4802 2.21799 18.908C2.40973 19.2843 2.71569 19.5903 3.09202 19.782C3.51984 20 4.07989 20 5.2 20L16.8 20C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V14.5M15 12C15 11.5353 15 11.303 15.0384 11.1098C15.1962 10.3164 15.8164 9.69624 16.6098 9.53843C16.803 9.5 17.0353 9.5 17.5 9.5H19.5C19.9647 9.5 20.197 9.5 20.3902 9.53843C21.1836 9.69624 21.8038 10.3164 21.9616 11.1098C22 11.303 22 11.5353 22 12C22 12.4647 22 12.697 21.9616 12.8902C21.8038 13.6836 21.1836 14.3038 20.3902 14.4616C20.197 14.5 19.9647 14.5 19.5 14.5H17.5C17.0353 14.5 16.803 14.5 16.6098 14.4616C15.8164 14.3038 15.1962 13.6836 15.0384 12.8902C15 12.697 15 12.4647 15 12Z" stroke="#8662F8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const ic_home = (
  color: string = '#4F4F4F',
) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 17H16M11.0177 2.764L4.23539 8.03912C3.78202 8.39175 3.55534 8.56806 3.39203 8.78886C3.24737 8.98444 3.1396 9.20478 3.07403 9.43905C3 9.70352 3 9.9907 3 10.5651V17.8C3 18.9201 3 19.4801 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4801 21 18.9201 21 17.8V10.5651C21 9.9907 21 9.70352 20.926 9.43905C20.8604 9.20478 20.7526 8.98444 20.608 8.78886C20.4447 8.56806 20.218 8.39175 19.7646 8.03913L12.9823 2.764C12.631 2.49075 12.4553 2.35412 12.2613 2.3016C12.0902 2.25526 11.9098 2.25526 11.7387 2.3016C11.5447 2.35412 11.369 2.49075 11.0177 2.764Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const ic_report = (
  color: string = '#4F4F4F',
) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.99993 13C4.99993 14.6484 5.66466 16.1415 6.74067 17.226C6.84445 17.3305 6.89633 17.3828 6.92696 17.4331C6.95619 17.4811 6.9732 17.5224 6.98625 17.5771C6.99993 17.6343 6.99993 17.6995 6.99993 17.8298V20.2C6.99993 20.48 6.99993 20.62 7.05443 20.727C7.10236 20.8211 7.17885 20.8976 7.27293 20.9455C7.37989 21 7.5199 21 7.79993 21H9.69993C9.97996 21 10.12 21 10.2269 20.9455C10.321 20.8976 10.3975 20.8211 10.4454 20.727C10.4999 20.62 10.4999 20.48 10.4999 20.2V19.8C10.4999 19.52 10.4999 19.38 10.5544 19.273C10.6024 19.1789 10.6789 19.1024 10.7729 19.0545C10.8799 19 11.0199 19 11.2999 19H12.6999C12.98 19 13.12 19 13.2269 19.0545C13.321 19.1024 13.3975 19.1789 13.4454 19.273C13.4999 19.38 13.4999 19.52 13.4999 19.8V20.2C13.4999 20.48 13.4999 20.62 13.5544 20.727C13.6024 20.8211 13.6789 20.8976 13.7729 20.9455C13.8799 21 14.0199 21 14.2999 21H16.2C16.48 21 16.62 21 16.727 20.9455C16.8211 20.8976 16.8976 20.8211 16.9455 20.727C17 20.62 17 20.48 17 20.2V19.2243C17 19.0223 17 18.9212 17.0288 18.8401C17.0563 18.7624 17.0911 18.708 17.15 18.6502C17.2114 18.59 17.3155 18.5417 17.5237 18.445C18.5059 17.989 19.344 17.2751 19.9511 16.3902C20.0579 16.2346 20.1112 16.1568 20.1683 16.1108C20.2228 16.0668 20.2717 16.0411 20.3387 16.021C20.4089 16 20.4922 16 20.6587 16H21.2C21.48 16 21.62 16 21.727 15.9455C21.8211 15.8976 21.8976 15.8211 21.9455 15.727C22 15.62 22 15.48 22 15.2V11.7857C22 11.5192 22 11.3859 21.9505 11.283C21.9013 11.181 21.819 11.0987 21.717 11.0495C21.6141 11 21.4808 11 21.2143 11C21.0213 11 20.9248 11 20.8471 10.9738C20.7633 10.9456 20.7045 10.908 20.6437 10.8438C20.5874 10.7842 20.5413 10.6846 20.4493 10.4855C20.1538 9.84622 19.7492 9.26777 19.2593 8.77404C19.1555 8.66945 19.1036 8.61716 19.073 8.56687C19.0437 8.51889 19.0267 8.47759 19.0137 8.42294C19 8.36567 19 8.30051 19 8.17018V7.06058C19 6.70053 19 6.52051 18.925 6.39951C18.8593 6.29351 18.7564 6.21588 18.6365 6.18184C18.4995 6.14299 18.3264 6.19245 17.9802 6.29136L15.6077 6.96922C15.5673 6.98074 15.5472 6.9865 15.5267 6.99054C15.5085 6.99414 15.4901 6.99671 15.4716 6.99826C15.4508 7 15.4298 7 15.3879 7H14.959M4.99993 13C4.99993 10.6959 6.29864 8.6952 8.20397 7.6899M4.99993 13H4C2.89543 13 2 12.1046 2 11C2 10.2597 2.4022 9.61337 3 9.26756M15 6.5C15 8.433 13.433 10 11.5 10C9.567 10 8 8.433 8 6.5C8 4.567 9.567 3 11.5 3C13.433 3 15 4.567 15 6.5Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const ic_profile = (
  color: string = '#4F4F4F',
) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.3163 19.4384C5.92462 18.0052 7.34492 17 9 17H15C16.6551 17 18.0754 18.0052 18.6837 19.4384M16 9.5C16 11.7091 14.2091 13.5 12 13.5C9.79086 13.5 8 11.7091 8 9.5C8 7.29086 9.79086 5.5 12 5.5C14.2091 5.5 16 7.29086 16 9.5ZM22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;
// ─── Tab icon map ──────────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  home: { active: ic_home('#8662f8'), inactive: ic_home() },
  wallet: { active: wallet_color, inactive: wallet },
  scan: { active: '', inactive: scan },
  report: { active: ic_report('#8662f8'), inactive: ic_report() },
  other: { active: ic_profile('#8662f8'), inactive: ic_profile() },
};

const TAB_LABELS: Record<string, string> = {
  home: 'Trang chủ',
  wallet: 'Ví',
  scan: 'Quét QR',
  report: 'Báo cáo',
  other: 'Cá nhân',
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
  // const leftRoutes = routes.slice(0, midIndex);
  // const rightRoutes = routes.slice(midIndex);

  const renderTab = (route: (typeof routes)[0], index: number) => {
    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const icons = TAB_ICONS[route.name];
    const label = TAB_LABELS[route.name] ?? route.name;

    const onPress = () => {
      if (route.name === 'scan') {
        navigation.getParent()?.navigate('ScanMain');
        return;
      }

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
        // accessibilityLabel={options.tabBarAccessibilityLabel}
        onPress={onPress}
        onLongPress={onLongPress}
        style={styles.tab}
      >
        {/* Active indicator dot */}
        <View
          style={[styles.activeBar, isFocused && styles.activeBarVisible]}
        />

        {/* <Text style={styles.tabIcon}>
          {icons ? (isFocused ? icons.active : icons.inactive) : '⭕'}
        </Text> */}
        <SvgXml
          xml={icons?.[isFocused ? 'active' : 'inactive']}
          width={24}
          height={24}
        />
        <Text
          style={[
            styles.label,
            isFocused ? styles.labelActive : styles.labelInactive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Left tabs */}
      {/* <View style={styles.side}>
        {leftRoutes.map(route => {
          const index = routes.indexOf(route);
          return renderTab(route, index);
        })}
      </View> */}

      {/* Center FAB */}
      {/* <View style={styles.fabWrapper}>
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddPress}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View> */}

      {/* Right tabs */}
      <View style={styles.side}>
        {routes.map(route => {
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    // alignItems: 'center',
    // justifyContent: 'center',
    // paddingVertical: 4,
    // position: 'relative',
  },
  activeBar: {
    // position: 'absolute',
    // top: -8,
    // width: 28,
    // height: 3,
    // borderRadius: 2,
    // backgroundColor: 'transparent',
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
