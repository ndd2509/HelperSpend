import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PURPLE = '#8662f8';
const DARK = '#252525';
const GREY5 = '#4f4f4f';
const GREY4 = '#8e8e8e';
const ICON_BG = '#F0EBFF';

interface FeatureRowProps {
  icon: string;
  label: string;
}

const FeatureRow = ({ icon, label }: FeatureRowProps) => (
  <View style={styles.featureRow}>
    <View style={styles.iconCircle}>
      <Text style={styles.iconEmoji}>{icon}</Text>
    </View>
    <Text style={styles.featureText}>{label}</Text>
  </View>
);

export const SharedFundIntroScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.root}>
      {/* ── Top Navigation Bar ──────────────────────────────────────── */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.navIcon}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => {}}>
          <Text style={styles.navShare}>↗</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar ──────────────────────────────────────────────────── */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarBg} />
          <Text style={styles.avatarEmoji}>🐱</Text>
        </View>

        {/* ── Title & Subtitle ────────────────────────────────────────── */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{'Tài khoản Quỹ Nhóm'}</Text>
          <Text style={styles.subtitle}>
            Quản lý tiện lợi, minh bạch chi tiêu
          </Text>
        </View>

        {/* ── Features ────────────────────────────────────────────────── */}
        <View style={styles.features}>
          <FeatureRow icon="💰" label="Quỹ chung" />
          <FeatureRow icon="🕐" label="Quản lý biến động số dư 24/7" />
          <FeatureRow
            icon="👥"
            label="Minh bạch tuyệt đối với mọi thành viên"
          />
          <FeatureRow icon="🙋" label="Không giới hạn quy mô nhóm" />
        </View>
      </ScrollView>

      {/* ── CTA Button ──────────────────────────────────────────────── */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CreateGroupFund')}
        >
          <Text style={styles.ctaArrow}>←</Text>
          <Text style={styles.ctaText}>Tạo quỹ nhóm</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* ── Home Indicator ──────────────────────────────────────────── */}
      <View style={styles.homeBar}>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },

  // ── Nav
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 52 : 16,
    height: Platform.OS === 'ios' ? 99 : 68,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: { fontSize: 30, color: DARK, lineHeight: 34 },
  navShare: { fontSize: 22, color: DARK },

  // ── Scroll content
  scroll: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 24,
  },

  // ── Avatar
  avatarWrap: {
    width: 121,
    height: 121,
    borderRadius: 30,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  avatarBg: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -80,
    right: -80,
    transform: [{ rotate: '-30deg' }],
  },
  avatarEmoji: { fontSize: 64 },

  // ── Title block
  titleBlock: {
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: DARK,
    letterSpacing: -0.24,
    lineHeight: 31,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: GREY4,
    lineHeight: 24,
    textAlign: 'center',
  },

  // ── Features
  features: {
    width: '100%',
    paddingVertical: 20,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 22 },
  featureText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: GREY5,
    lineHeight: 24,
  },

  // ── CTA
  ctaContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 305,
    height: 48,
    borderRadius: 100,
    backgroundColor: DARK,
    ...Platform.select({
      ios: {
        shadowColor: DARK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  ctaArrow: { fontSize: 18, color: '#fff', fontWeight: '500' },
  ctaText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },

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
