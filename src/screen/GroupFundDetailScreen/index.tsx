import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Share,
  FlatList,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { getGroupFundById } from '../../apis/apis';
import { useAuth } from '../../contexts/AuthContext';
import { SvgXml } from 'react-native-svg';
import { Images } from '../../assets/image/index';
const arrowLeftSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const addGroupFund = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 5V19M5 12H19" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const settingsSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.7273 14.7273C18.6063 15.0015 18.5702 15.3056 18.6236 15.6005C18.6771 15.8954 18.8177 16.1676 19.0273 16.3818L19.0818 16.4364C19.2509 16.6052 19.385 16.8057 19.4765 17.0265C19.568 17.2472 19.6151 17.4838 19.6151 17.7227C19.6151 17.9617 19.568 18.1983 19.4765 18.419C19.385 18.6397 19.2509 18.8402 19.0818 19.0091C18.913 19.1781 18.7124 19.3122 18.4917 19.4037C18.271 19.4952 18.0344 19.5423 17.7955 19.5423C17.5565 19.5423 17.3199 19.4952 17.0992 19.4037C16.8785 19.3122 16.678 19.1781 16.5091 19.0091L16.4545 18.9545C16.2403 18.745 15.9682 18.6044 15.6733 18.5509C15.3784 18.4974 15.0742 18.5335 14.8 18.6545C14.5311 18.7698 14.3018 18.9611 14.1403 19.205C13.9788 19.4489 13.8921 19.7347 13.8909 20.0273V20.1818C13.8909 20.6659 13.6987 21.1304 13.3564 21.4727C13.0141 21.815 12.5496 22.0073 12.0655 22.0073C11.5813 22.0073 11.1168 21.815 10.7745 21.4727C10.4322 21.1304 10.24 20.6659 10.24 20.1818V20.1C10.2312 19.7991 10.1358 19.5073 9.96477 19.2583C9.79371 19.0093 9.55404 18.8132 9.27273 18.6945C8.99853 18.5735 8.69437 18.5374 8.39947 18.5909C8.10456 18.6443 7.83244 18.785 7.61818 18.9945L7.56364 19.0491C7.39478 19.2181 7.19425 19.3522 6.97353 19.4437C6.7528 19.5352 6.51621 19.5823 6.27727 19.5823C6.03834 19.5823 5.80174 19.5352 5.58102 19.4437C5.36029 19.3522 5.15977 19.2181 4.99091 19.0491C4.82186 18.8802 4.68775 18.6797 4.59626 18.459C4.50476 18.2383 4.45766 18.0017 4.45766 17.7627C4.45766 17.5238 4.50476 17.2872 4.59626 17.0665C4.68775 16.8458 4.82186 16.6452 4.99091 16.4764L5.04545 16.4218C5.25503 16.2076 5.39562 15.9355 5.44908 15.6406C5.50255 15.3457 5.46647 15.0415 5.34545 14.7673C5.23022 14.4984 5.03887 14.2691 4.79497 14.1076C4.55107 13.9461 4.26526 13.8594 3.97273 13.8582H3.81818C3.33409 13.8582 2.86958 13.6659 2.52727 13.3236C2.18496 12.9813 1.99273 12.5168 1.99273 12.0327C1.99273 11.5486 2.18496 11.0841 2.52727 10.7418C2.86958 10.3995 3.33409 10.2073 3.81818 10.2073H3.9C4.2009 10.1985 4.49273 10.1031 4.74173 9.93204C4.99073 9.76099 5.18682 9.52132 5.30545 9.24C5.42647 8.96581 5.46255 8.66165 5.40908 8.36674C5.35562 8.07184 5.21503 7.79972 5.00545 7.58545L4.95091 7.53091C4.78186 7.36205 4.64775 7.16152 4.55626 6.9408C4.46476 6.72007 4.41766 6.48348 4.41766 6.24455C4.41766 6.00561 4.46476 5.76902 4.55626 5.54829C4.64775 5.32757 4.78186 5.12704 4.95091 4.95818C5.11977 4.78913 5.32029 4.65502 5.54102 4.56353C5.76174 4.47203 5.99834 4.42493 6.23727 4.42493C6.47621 4.42493 6.7128 4.47203 6.93353 4.56353C7.15425 4.65502 7.35478 4.78913 7.52364 4.95818L7.57818 5.01273C7.79244 5.2223 8.06456 5.36289 8.35947 5.41636C8.65437 5.46982 8.95853 5.43374 9.23273 5.31273H9.27273C9.54161 5.19749 9.77093 5.00615 9.93245 4.76224C10.094 4.51834 10.1807 4.23253 10.1818 3.94V3.78545C10.1818 3.30136 10.3741 2.83685 10.7164 2.49454C11.0587 2.15223 11.5232 1.96 12.0073 1.96C12.4914 1.96 12.9559 2.15223 13.2982 2.49454C13.6405 2.83685 13.8327 3.30136 13.8327 3.78545V3.86364C13.8338 4.15618 13.9205 4.44198 14.082 4.68589C14.2435 4.92979 14.4729 5.12113 14.7418 5.23636C15.016 5.35738 15.3201 5.39346 15.615 5.33999C15.9099 5.28653 16.1821 5.14594 16.3964 4.93636L16.4509 4.88182C16.6198 4.71277 16.8203 4.57866 17.041 4.48716C17.2617 4.39567 17.4983 4.34857 17.7373 4.34857C17.9762 4.34857 18.2128 4.39567 18.4335 4.48716C18.6543 4.57866 18.8548 4.71277 19.0236 4.88182C19.1927 5.05068 19.3268 5.25121 19.4183 5.47193C19.5098 5.69266 19.5569 5.92925 19.5569 6.16818C19.5569 6.40712 19.5098 6.64371 19.4183 6.86443C19.3268 7.08516 19.1927 7.28569 19.0236 7.45455L18.9691 7.50909C18.7595 7.72335 18.6189 7.99547 18.5655 8.29038C18.512 8.58528 18.5481 8.88944 18.6691 9.16364V9.20364C18.7843 9.47251 18.9757 9.70183 19.2196 9.86335C19.4635 10.0249 19.7493 10.1116 20.0418 10.1127H20.1964C20.6805 10.1127 21.145 10.305 21.4873 10.6473C21.8296 10.9896 22.0218 11.4541 22.0218 11.9382C22.0218 12.4223 21.8296 12.8868 21.4873 13.2291C21.145 13.5714 20.6805 13.7636 20.1964 13.7636H20.1182C19.8256 13.7648 19.5398 13.8515 19.2959 14.013C19.052 14.1745 18.8607 14.4038 18.7455 14.6727V14.7273Z" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const state_ment = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H15.2C16.8802 21 17.7202 21 18.362 20.673C18.9265 20.3854 19.3854 19.9265 19.673 19.362C20 18.7202 20 17.8802 20 16.2V13M13 17H7M15 13H7M20.1213 3.87868C21.2929 5.05025 21.2929 6.94975 20.1213 8.12132C18.9497 9.29289 17.0503 9.29289 15.8787 8.12132C14.7071 6.94975 14.7071 5.05025 15.8787 3.87868C17.0503 2.70711 18.9497 2.70711 20.1213 3.87868Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const DARK = '#252525';
const GREY4 = '#8e8e8e';
const GREY3 = '#d1d1d1';
const GREEN_BG = '#dff8f2';
const GREEN_TEXT = '#0e957e';
const BG = '#f7f5fa';
const HERO_HEIGHT = 269;

const BG_IMAGE_MAP: Record<string, any> = {
  bg1: 'https://static.toptop.vn/images/v1.0/group-fund/1.jpg',
  bg2: 'https://static.toptop.vn/images/v1.0/group-fund/2.jpg',
  bg3: 'https://static.toptop.vn/images/v1.0/group-fund/3.jpg',
  bg4: 'https://static.toptop.vn/images/v1.0/group-fund/4.jpg',
  bg5: 'https://static.toptop.vn/images/v1.0/group-fund/5.jpg',
};

/** Trả về source ảnh cho hero:
 * - Nếu emoji là URL (bắt đầu bằng http) → { uri } (network)
 * - Nếu là key bg1..bg5 → { uri } từ BG_IMAGE_MAP
 * - Không hợp lệ → null (hiện gradient)
 */
const getBgSource = (emoji?: string) => {
  if (!emoji) return null;
  if (
    emoji.startsWith('http://') ||
    emoji.startsWith('https://') ||
    emoji.startsWith('file://')
  ) {
    return { uri: emoji };
  }
  const mapped = BG_IMAGE_MAP[emoji];
  if (!mapped) return null;
  if (typeof mapped === 'string') return { uri: mapped };
  return mapped;
};

const formatAmount = (n: number) => n.toLocaleString('vi-VN');

const ACTION_BTNS = [
  { key: 'qr', icon: addGroupFund, label: 'QR góp quỹ' },
  { key: 'spend', icon: Images.scan_qr, type: 'image', label: 'Chi quỹ' },
  // { key: 'withdraw', icon: '⬇️', label: 'Rút quỹ' },
  { key: 'report', icon: state_ment, label: 'Sao kê' },
];

const GroupFundDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { fundId } = route.params ?? {};
  const { user } = useAuth();

  const [fund, setFund] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activityFilter, setActivityFilter] = useState<
    'all' | 'income' | 'expense'
  >('all');

  const loadFund = useCallback(async () => {
    if (!fundId) return;
    try {
      setLoading(true);
      const res = await getGroupFundById(fundId);
      if (res.success) setFund(res.data);
    } catch (e: any) {
      Alert.alert(
        'Lỗi',
        e?.response?.data?.message ?? 'Không tải được thông tin quỹ',
      );
    } finally {
      setLoading(false);
    }
  }, [fundId]);

  useFocusEffect(
    useCallback(() => {
      loadFund();
    }, [loadFund]),
  );

  const handleAction = (key: string) => {
    if (key === 'qr') {
      navigation.navigate('QrGroupFund', {
        fundId: fund?.id,
        fundName: fund?.name,
        ownerName: fund?.ownerName,
        accountNumber: fund?.accountNumber,
      });
      return;
    }
    if (key === 'spend') {
      if (!fund || fund.currentAmount <= 0) {
        Alert.alert(
          'Quỹ chưa có tiền',
          'Quỹ hiện không có số dư. Vui lòng thu thêm tiền vào quỹ trước khi chi.',
          [{ text: 'Đóng', style: 'cancel' }],
        );
        return;
      }
      navigation.navigate('ScanMain', {
        mode: 'fund_spend',
        fundId: fund.id,
        fundName: fund.name,
        fundAmount: fund.currentAmount,
      });
      return;
    }
    if (key === 'withdraw') {
      Alert.alert('Rút quỹ', 'Tính năng sắp ra mắt');
      return;
    }
    if (key === 'report') {
      if (!fund) return;
      const fundUrl = `http://172.11.56.12:3000/fund-group/${fund.id}`;
      Share.share({ url: fundUrl }, { dialogTitle: 'Chia sẻ quỹ nhóm' }).catch(
        () => {},
      );
      return;
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.navBar} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={() => navigation.popToTop()}
        >
          {/* <Text style={styles.navIconText}>‹</Text> */}
          <SvgXml xml={arrowLeftSvg} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={() =>
            navigation.navigate('GroupFundSettings', {
              fundId,
              fundName: fund?.name ?? '',
              fundEmoji: fund?.emoji ?? 'bg1',
              isOwner: fund?.ownerId === user?.id,
            })
          }
        >
          <SvgXml xml={settingsSvg} />
        </TouchableOpacity>
      </View>
      {/* ── Hero background (dynamic from fund.emoji) ───────────────── */}
      <View style={styles.hero}>
        {(() => {
          const src = getBgSource(fund?.emoji);
          return src ? (
            <Image source={src} style={styles.heroBgImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroGradient} />
          );
        })()}
        <View style={styles.heroFade} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color={DARK} style={styles.loader} />
        ) : !fund ? null : (
          <>
            {/* ── Balance card ──────────────────────────────────────────── */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceRow}>
                <View style={styles.balanceLeft}>
                  <Text style={styles.fundNameLabel}>{fund.name}</Text>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountValue}>
                      {balanceVisible
                        ? formatAmount(fund.currentAmount)
                        : '••••••'}
                    </Text>
                    <Text style={styles.amountUnit}>đ</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setBalanceVisible(v => !v)}
                >
                  <Text style={styles.eyeIcon}>
                    {balanceVisible ? '👁' : '🙈'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── Tổng thu / Tổng chi */}
              {(() => {
                const acts: any[] = fund.activities ?? [];
                const totalIncome = acts
                  .filter((a: any) => !a.type || a.type === 'contribution')
                  .reduce((s: number, a: any) => s + a.amount, 0);
                const totalExpense = acts
                  .filter(
                    (a: any) => a.type === 'expense' || a.type === 'withdrawal',
                  )
                  .reduce((s: number, a: any) => s + a.amount, 0);
                return (
                  <View style={styles.statRows}>
                    <View style={styles.statDivider} />
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Tổng thu</Text>
                      <Text style={[styles.statValue, styles.statIncome]}>
                        +{formatAmount(totalIncome)}đ
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statRow}>
                      <Text style={styles.statLabel}>Tổng chi</Text>
                      <Text style={[styles.statValue, styles.statExpense]}>
                        -{formatAmount(totalExpense)}đ
                      </Text>
                    </View>
                  </View>
                );
              })()}
            </View>

            {/* ── Action buttons ────────────────────────────────────── */}
            <View style={styles.actionRow}>
              {ACTION_BTNS.map(btn => (
                <TouchableOpacity
                  key={btn.key}
                  style={styles.actionItem}
                  onPress={() => handleAction(btn.key)}
                  activeOpacity={0.8}
                >
                  <View style={styles.actionCircle}>
                    {/* <Text style={styles.actionIcon}>{btn.icon}</Text> */}
                    {btn.type === 'image' ? (
                      <Image
                        source={btn.icon}
                        style={{ width: 24, height: 24 }}
                      />
                    ) : (
                      <SvgXml xml={btn.icon} />
                    )}
                  </View>
                  <Text style={styles.actionLabel}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Recent activity ───────────────────────────────────── */}
            <View style={styles.activitySection}>
              <Text style={styles.activityTitle}>Hoạt động gần đây</Text>

              {/* ── Filter tabs */}
              <View style={styles.filterRow}>
                {(['all', 'income', 'expense'] as const).map(f => (
                  <TouchableOpacity
                    key={f}
                    style={[
                      styles.filterBtn,
                      activityFilter === f && styles.filterBtnActive,
                    ]}
                    onPress={() => setActivityFilter(f)}
                  >
                    <Text
                      style={[
                        styles.filterBtnText,
                        activityFilter === f && styles.filterBtnTextActive,
                      ]}
                    >
                      {f === 'all'
                        ? 'Tất cả'
                        : f === 'income'
                        ? 'GD Thu'
                        : 'GD Chi'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {(() => {
                const acts: any[] = (fund.activities ?? []).filter((a: any) => {
                  if (activityFilter === 'all') return true;
                  const isIncome = !a.type || a.type === 'contribution';
                  return activityFilter === 'income' ? isIncome : !isIncome;
                });
                return acts.length > 0 ? (
                  acts.map((act: any) => {
                    const isIncome = !act.type || act.type === 'contribution';
                    const label = isIncome
                      ? `Nhận tiền từ ${act.name}`
                      : `Chi quỹ đến ${act.name}`;
                    return (
                      <View key={act.id} style={styles.activityItem}>
                        <View
                          style={[
                            styles.activityIconWrap,
                            !isIncome && styles.activityIconWrapExpense,
                          ]}
                        >
                          <Text style={styles.activityIconText}>
                            {isIncome ? '💰' : '💸'}
                          </Text>
                        </View>
                        <View style={styles.activityInfo}>
                          <Text style={styles.activityName}>{label}</Text>
                          {act.note ? (
                            <Text style={styles.activityNote}>{act.note}</Text>
                          ) : null}
                          <Text style={styles.activityDate}>{act.date}</Text>
                        </View>
                        <Text
                          style={[
                            styles.activityAmount,
                            !isIncome && styles.activityAmountExpense,
                          ]}
                        >
                          {isIncome ? '+' : '-'}
                          {formatAmount(act.amount)}đ
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyWrap}>
                    <Image
                      source={require('../../assets/image/group-fund-detail/mascot.png')}
                      style={styles.emptyImg}
                      resizeMode="contain"
                    />
                    <Text style={styles.emptyText}>Chưa có hoạt động</Text>
                  </View>
                );
              })()}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Nav bar — sau ScrollView để nằm trên z-order, nhận touch đúng ── */}
      {/* ── Fixed nav bar (overlaid on hero) ─────────────────────────── */}

      {/* ── AI Chat FAB ──────────────────────────────────────────────── */}

      {/* ── Home indicator ───────────────────────────────────────────── */}
      <View style={styles.homeBar}>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
};

export default GroupFundDetailScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Hero
  hero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  heroBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#d5c8ff',
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {},
      android: {},
    }),
  },

  // ── Nav bar
  navBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    height: Platform.OS === 'ios' ? 99 : 68,
  },
  navIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconText: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ── Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: HERO_HEIGHT - 40,
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 24,
  },

  // ── Balance card
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  balanceLeft: { flex: 1, gap: 4 },
  fundNameLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: GREY4,
    lineHeight: 21,
  },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  amountValue: {
    fontSize: 24,
    fontWeight: '600',
    color: DARK,
    letterSpacing: -0.24,
    lineHeight: 31,
  },
  amountUnit: { fontSize: 24, fontWeight: '600', color: GREY3, lineHeight: 31 },
  memberCount: {
    fontSize: 12,
    fontWeight: '500',
    color: GREY4,
    lineHeight: 18,
  },
  eyeBtn: {
    width: 35,
    height: 35,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIcon: { fontSize: 16 },

  // ── Stat rows (Tổng thu / Tổng chi)
  statRows: { gap: 0 },
  statDivider: { height: 1, backgroundColor: '#f5f5f5' },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statLabel: { fontSize: 13, color: GREY4 },
  statValue: { fontSize: 13, fontWeight: '700' },
  statIncome: { color: DARK },
  statExpense: { color: '#e53935' },

  // ── Filter tabs
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  filterBtnActive: {
    borderColor: DARK,
    backgroundColor: DARK,
  },
  filterBtnText: { fontSize: 13, fontWeight: '600', color: GREY4 },
  filterBtnTextActive: { color: '#fff' },

  // ── Action row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  actionItem: { alignItems: 'center', gap: 8 },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 100,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: { fontSize: 20 },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: DARK,
    lineHeight: 18,
    textAlign: 'center',
  },

  // ── Activity section
  activitySection: { gap: 20 },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK,
    lineHeight: 27,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  activityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIconText: { fontSize: 20 },
  activityInfo: { flex: 1, gap: 2 },
  activityName: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
    lineHeight: 21,
  },
  activityNote: {
    fontSize: 12,
    fontWeight: '400',
    color: GREY4,
    lineHeight: 18,
  },
  activityDate: {
    fontSize: 12,
    fontWeight: '400',
    color: GREY4,
    lineHeight: 18,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN_TEXT,
    lineHeight: 21,
  },
  activityAmountExpense: { color: '#e53935' },
  activityIconWrapExpense: { backgroundColor: '#fdecea' },

  loader: { marginTop: 40 },

  // ── Empty state
  emptyWrap: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyImg: { width: 80, height: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', color: DARK, lineHeight: 24 },

  // ── Home indicator
  homeBar: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 8,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 100,
    backgroundColor: DARK,
  },

  // ── AI Chat FAB
  aiFab: {
    position: 'absolute',
    bottom: 56,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  aiFabIcon: { fontSize: 24 },

  // ── AI Chat Modal
  aiOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  aiSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  aiHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0ebff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarText: { fontSize: 20 },
  aiHeaderTitle: { fontSize: 15, fontWeight: '700', color: DARK },
  aiHeaderSub: { fontSize: 12, color: GREY4, marginTop: 1 },
  aiCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCloseIcon: { fontSize: 13, color: GREY4, fontWeight: '700' },

  // ── Messages
  aiMessages: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  aiMsgWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  aiMsgWrapUser: { justifyContent: 'flex-end' },
  aiMsgWrapBot: { justifyContent: 'flex-start' },
  aiBotDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0ebff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiMsgBubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  aiMsgBubbleUser: { backgroundColor: DARK, borderBottomRightRadius: 4 },
  aiMsgBubbleBot: { backgroundColor: '#f5f5f5', borderBottomLeftRadius: 4 },
  aiMsgText: { fontSize: 14, lineHeight: 20 },
  aiMsgTextUser: { color: '#fff' },
  aiMsgTextBot: { color: DARK },

  // ── Typing
  aiTyping: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  aiTypingText: { fontSize: 13, color: GREY4 },

  // ── Input
  aiInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  aiInput: {
    flex: 1,
    backgroundColor: '#f7f5fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: DARK,
    maxHeight: 100,
  },
  aiSendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiSendBtnDisabled: { backgroundColor: '#d1d1d1' },
  aiSendIcon: { fontSize: 18, color: '#fff', fontWeight: '700' },
});
