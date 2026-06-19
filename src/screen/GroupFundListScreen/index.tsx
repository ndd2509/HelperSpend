import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getGroupFunds } from '../../apis/apis';

const DARK = '#252525';
const GREY4 = '#8e8e8e';
const PURPLE = '#8662f8';
const BG = '#f7f5fa';

const BG_IMAGE_MAP: Record<string, any> = {
  bg1: 'https://static.toptop.vn/images/v1.0/group-fund/1.jpg',
  bg2: 'https://static.toptop.vn/images/v1.0/group-fund/2.jpg',
  bg3: 'https://static.toptop.vn/images/v1.0/group-fund/3.jpg',
  bg4: 'https://static.toptop.vn/images/v1.0/group-fund/4.jpg',
  bg5: 'https://static.toptop.vn/images/v1.0/group-fund/5.jpg',
};

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

const FundSeparator = () => <View style={styles.separator} />;

const EmptyState = ({ onPress }: { onPress: () => void }) => (
  <View style={styles.emptyWrap}>
    <Text style={styles.emptyEmoji}>🏦</Text>
    <Text style={styles.emptyTitle}>Chưa có quỹ nhóm</Text>
    <Text style={styles.emptySubtitle}>
      Tạo quỹ để cùng nhau quản lý chi tiêu
    </Text>
    <TouchableOpacity
      style={styles.emptyCreateBtn}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.emptyCreateText}>Tạo quỹ nhóm ngay</Text>
    </TouchableOpacity>
  </View>
);

const GroupFundListScreen = () => {
  const navigation = useNavigation<any>();
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFunds = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getGroupFunds();
      if (res.success) setFunds(res.data);
    } catch (e: any) {
      Alert.alert(
        'Lỗi',
        e?.response?.data?.message ?? 'Không tải được danh sách quỹ',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFunds();
    }, [loadFunds]),
  );

  const renderFundCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() =>
        navigation.navigate('GroupFundDetail', { fundId: item.id })
      }
    >
      {/* Background image */}
      <View style={styles.cardBg}>
        {(() => {
          const src = getBgSource(item.emoji);
          return src ? (
            <Image source={src} style={styles.cardBgImage} resizeMode="cover" />
          ) : (
            <View style={styles.cardBgFallback} />
          );
        })()}
        <View style={styles.cardBgFade} />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          {/* <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>
              👥 {item.members?.length ?? 0}
            </Text>
          </View> */}
        </View>

        <Text style={styles.cardBalance}>
          {formatAmount(item.currentAmount)}
          <Text style={styles.cardBalanceUnit}>đ</Text>
        </Text>

        {item.targetAmount > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      100,
                      (item.currentAmount / item.targetAmount) * 100,
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {Math.round((item.currentAmount / item.targetAmount) * 100)}% mục
              tiêu
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quỹ nhóm</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('SharedFundIntro')}
        >
          <Text style={styles.createIcon}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* ── List ────────────────────────────────────────────────────── */}
      {loading ? (
        <ActivityIndicator color={DARK} style={styles.loader} />
      ) : (
        <FlatList
          data={funds}
          keyExtractor={item => item.id}
          renderItem={renderFundCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              onPress={() => navigation.navigate('SharedFundIntro')}
            />
          }
          ItemSeparatorComponent={FundSeparator}
        />
      )}

      {/* ── Home indicator ───────────────────────────────────────────── */}
      {!loading && funds.length > 0 && (
        <View style={styles.homeBar}>
          <View style={styles.homeIndicator} />
        </View>
      )}
    </View>
  );
};

export default GroupFundListScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    height: Platform.OS === 'ios' ? 99 : 68,
    backgroundColor: BG,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 30, color: DARK, lineHeight: 34 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK,
    flex: 1,
    textAlign: 'center',
  },
  createBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createIcon: { fontSize: 22, color: PURPLE, fontWeight: '400' },

  loader: { flex: 1, alignSelf: 'center', marginTop: 80 },
  list: { padding: 16, paddingBottom: 32 },
  separator: { height: 12 },

  // ── Fund card
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  cardBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cardBgFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  cardContent: { flex: 1, padding: 16, justifyContent: 'space-between' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  memberBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  memberBadgeText: { fontSize: 12, fontWeight: '500', color: '#fff' },
  cardBalance: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  cardBalanceUnit: { fontSize: 18, fontWeight: '400' },

  // ── Progress bar
  progressWrap: { gap: 4 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  cardBgFallback: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#d5c8ff',
  },

  // ── Empty state
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
    gap: 8,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 8 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: GREY4,
    textAlign: 'center',
    lineHeight: 21,
  },
  emptyCreateBtn: {
    marginTop: 16,
    backgroundColor: DARK,
    borderRadius: 100,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyCreateText: { fontSize: 15, fontWeight: '600', color: '#fff' },

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
});
