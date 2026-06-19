import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { createGroupFund, uploadImage } from '../../apis/apis';

const BG_IMAGES = [
  'https://static.toptop.vn/images/v1.0/group-fund/1.jpg',
  'https://static.toptop.vn/images/v1.0/group-fund/2.jpg',
  'https://static.toptop.vn/images/v1.0/group-fund/3.jpg',
  'https://static.toptop.vn/images/v1.0/group-fund/4.jpg',
  'https://static.toptop.vn/images/v1.0/group-fund/5.jpg',
];

const PURPLE = '#8662f8';
const DARK = '#252525';
const BG = '#f7f5fa';

const BACKGROUNDS = [
  { id: 'bg1', img: BG_IMAGES[0] },
  { id: 'bg2', img: BG_IMAGES[1] },
  { id: 'bg3', img: BG_IMAGES[2] },
  { id: 'bg4', img: BG_IMAGES[3] },
  { id: 'bg5', img: BG_IMAGES[4] },
];

const CreateGroupFundScreen = () => {
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [selectedBg, setSelectedBg] = useState('bg1');
  const [customBgUri, setCustomBgUri] = useState<string | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [loading, setLoading] = useState(false);

  const processPickedImage = async (uri: string, fileName?: string) => {
    try {
      setUploadingBg(true);
      const res = await uploadImage(uri, fileName ?? 'bg_custom.jpg');
      if (res.data?.success) {
        const url = res.data?.data?.url ?? uri;
        setCustomBgUri(url);
        setSelectedBg('custom');
      } else {
        setCustomBgUri(uri);
        setSelectedBg('custom');
      }
    } catch {
      // Fallback: dùng URI cục bộ nếu upload lỗi
      setCustomBgUri(uri);
      setSelectedBg('custom');
    } finally {
      setUploadingBg(false);
    }
  };

  const pickFromGallery = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, selectionLimit: 1 },
      response => {
        if (response.didCancel || !response.assets?.[0]) return;
        const asset = response.assets[0];
        if (asset.uri) processPickedImage(asset.uri, asset.fileName);
      },
    );
  };

  const pickFromCamera = () => {
    launchCamera(
      { mediaType: 'photo', quality: 0.8, saveToPhotos: false },
      response => {
        if (response.didCancel || !response.assets?.[0]) return;
        const asset = response.assets[0];
        if (asset.uri) processPickedImage(asset.uri, asset.fileName);
      },
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên nhóm');
      return;
    }

    setLoading(true);
    try {
      const res = await createGroupFund({
        name: name.trim(),
        emoji: selectedBg === 'custom' ? customBgUri ?? 'bg1' : selectedBg,
      });

      if (res.success) {
        navigation.replace('GroupFundDetail', { fundId: res.data.id });
      } else {
        Alert.alert('Lỗi', res.message ?? 'Tạo quỹ thất bại');
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ?? 'Tạo quỹ thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.navIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Tạo quỹ nhóm</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Card: Tên nhóm ──────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Tên nhóm</Text>
          <View style={styles.textfield}>
            <TextInput
              style={styles.textfieldInput}
              placeholder="Nhập tên nhóm"
              placeholderTextColor="#a5a5a5"
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>
        </View>

        {/* ── Card: Hình nền ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Hình nền</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.bgScroll}
          >
            <View style={styles.bgRow}>
              {BACKGROUNDS.map(bg => {
                const isSelected = selectedBg === bg.id;
                return (
                  <TouchableOpacity
                    key={bg.id}
                    activeOpacity={0.85}
                    onPress={() => {
                      setSelectedBg(bg.id);
                      setCustomBgUri(null);
                    }}
                    style={[styles.bgCard, isSelected && styles.bgCardSelected]}
                  >
                    <Image
                      source={{ uri: bg.img }}
                      style={styles.bgImage}
                      resizeMode="cover"
                    />
                    {isSelected && (
                      <View style={styles.checkWrap}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {customBgUri && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setSelectedBg('custom')}
                  style={[
                    styles.bgCard,
                    selectedBg === 'custom' && styles.bgCardSelected,
                  ]}
                >
                  <Image
                    source={{ uri: customBgUri }}
                    style={styles.bgImage}
                    resizeMode="cover"
                  />
                  {selectedBg === 'custom' && (
                    <View style={styles.checkWrap}>
                      <Text style={styles.checkIcon}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
        <View style={styles.addBgContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={pickFromCamera}
            disabled={uploadingBg}
            style={styles.bgAddCard}
          >
            {uploadingBg ? (
              <ActivityIndicator color={PURPLE} size="small" />
            ) : (
              <>
                <Text style={styles.bgAddIcon}>📷</Text>
                <Text style={styles.bgAddLabel}>Chụp ảnh</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Gallery button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={pickFromGallery}
            disabled={uploadingBg}
            style={styles.bgAddCard}
          >
            {uploadingBg ? (
              <ActivityIndicator color={PURPLE} size="small" />
            ) : (
              <>
                <Text style={styles.bgAddIcon}>🖼️</Text>
                <Text style={styles.bgAddLabel}>Thư viện</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── CTA Button ──────────────────────────────────────────────── */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
          onPress={handleCreate}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.ctaIcon}>✓</Text>
              <Text style={styles.ctaText}>Tạo quỹ nhóm</Text>
              <Text style={styles.ctaArrow}>›</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Home Indicator ──────────────────────────────────────────── */}
      <View style={styles.homeBar}>
        <View style={styles.homeIndicator} />
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateGroupFundScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  addBgContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  // ── Nav bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    height: Platform.OS === 'ios' ? 99 : 68,
    backgroundColor: BG,
  },
  navBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: { fontSize: 30, color: DARK, lineHeight: 34 },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK,
    flex: 1,
    textAlign: 'center',
  },

  // ── Scroll
  scroll: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 24, gap: 12 },

  // ── Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
    lineHeight: 24,
  },

  // ── Textfield
  textfield: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  textfieldInput: {
    fontSize: 16,
    fontWeight: '400',
    color: DARK,
    padding: 0,
  },

  // ── Background selector
  bgScroll: { marginHorizontal: -16 },
  bgRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  bgCard: {
    width: 160,
    height: 90,
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bgCardSelected: { borderColor: PURPLE },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  checkWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: { fontSize: 13, color: '#fff', fontWeight: '700' },
  bgAddCard: {
    width: 90,
    height: 90,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#d1d1d1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#faf8ff',
  },
  bgAddIcon: { fontSize: 26 },
  bgAddLabel: { fontSize: 11, color: PURPLE, fontWeight: '600' },

  // ── CTA
  ctaContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: 332,
    height: 48,
    borderRadius: 100,
    backgroundColor: DARK,
    ...Platform.select({
      ios: {
        shadowColor: DARK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaIcon: { fontSize: 16, color: '#fff', fontWeight: '700' },
  ctaText: { fontSize: 16, fontWeight: '600', color: '#fff', lineHeight: 24 },
  ctaArrow: { fontSize: 20, color: '#fff', lineHeight: 24 },

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
