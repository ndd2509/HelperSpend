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
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { updateGroupFund, deleteGroupFund, uploadImage } from '../../apis/apis';
import { SvgXml } from 'react-native-svg';
const trashSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M10 11V16M14 11V16M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6" stroke="#C02344" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const PURPLE = '#8662f8';
const DARK = '#252525';
const BG = '#f7f5fa';
const RED = '#E53935';
const SCREEN_WIDTH = Dimensions.get('window').width;

const BG_IMAGE_MAP: Record<string, string> = {
  bg1: 'https://static.toptop.vn/images/v1.0/group-fund/1.jpg',
  bg2: 'https://static.toptop.vn/images/v1.0/group-fund/2.jpg',
  bg3: 'https://static.toptop.vn/images/v1.0/group-fund/3.jpg',
  bg4: 'https://static.toptop.vn/images/v1.0/group-fund/4.jpg',
  bg5: 'https://static.toptop.vn/images/v1.0/group-fund/5.jpg',
};

const BACKGROUNDS = Object.entries(BG_IMAGE_MAP).map(([id, url]) => ({
  id,
  url,
}));

const getImageSource = (emoji?: string) => {
  if (!emoji) return null;
  if (emoji.startsWith('http') || emoji.startsWith('file://'))
    return { uri: emoji };
  const url = BG_IMAGE_MAP[emoji];
  return url ? { uri: url } : null;
};

export type GroupFundSettingsParams = {
  GroupFundSettings: {
    fundId: string;
    fundName: string;
    fundEmoji: string;
    isOwner: boolean;
  };
};

const GroupFundSettingsScreen = () => {
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<GroupFundSettingsParams, 'GroupFundSettings'>>();
  const { fundId, fundName, fundEmoji, isOwner } = route.params;

  const [name, setName] = useState(fundName);
  const [selectedBg, setSelectedBg] = useState(
    BG_IMAGE_MAP[fundEmoji] ? fundEmoji : 'custom',
  );
  const [customBgUri, setCustomBgUri] = useState<string | null>(
    !BG_IMAGE_MAP[fundEmoji] ? fundEmoji : null,
  );
  const [uploadingBg, setUploadingBg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const processPickedImage = async (uri: string, fileName?: string) => {
    try {
      setUploadingBg(true);
      const res = await uploadImage(uri, fileName ?? 'bg_custom.jpg');
      const url = res.data?.success ? res.data?.data?.url ?? uri : uri;
      setCustomBgUri(url);
      setSelectedBg('custom');
    } catch {
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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên quỹ');
      return;
    }
    setSaving(true);
    try {
      const emoji =
        selectedBg === 'custom' ? customBgUri ?? fundEmoji : selectedBg;
      const res = await updateGroupFund(fundId, { name: name.trim(), emoji });
      if (res.success) {
        Alert.alert('Thành công', 'Đã cập nhật quỹ nhóm', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Lỗi', res.message ?? 'Cập nhật thất bại');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message ?? 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xoá quỹ nhóm',
      `Bạn có chắc muốn xoá quỹ "${name}"? Hành động này không thể hoàn tác.`,
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const res = await deleteGroupFund(fundId);
              if (res.success) {
                navigation.navigate('Tabs', { screen: 'wallet' });
              } else {
                Alert.alert('Lỗi', res.message ?? 'Không thể xoá quỹ');
              }
            } catch (err: any) {
              Alert.alert(
                'Lỗi',
                err?.response?.data?.message ?? 'Không thể xoá quỹ',
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.navIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Cài đặt quỹ</Text>
        <View style={styles.navBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Tên quỹ */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Tên quỹ</Text>
          <View style={styles.textfield}>
            <TextInput
              style={styles.textfieldInput}
              placeholder="Nhập tên quỹ"
              placeholderTextColor="#a5a5a5"
              value={name}
              onChangeText={setName}
              maxLength={50}
              editable={isOwner}
            />
          </View>
        </View>

        {/* Hình nền */}
        {isOwner && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Hình nền</Text>
            <View style={styles.backgroundGrid}>
              {BACKGROUNDS.map(bg => {
                const isSelected = selectedBg === bg.id;
                return (
                  <TouchableOpacity
                    key={bg.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedBg(bg.id);
                      setCustomBgUri(null);
                    }}
                    style={[
                      styles.backgroundItem,
                      isSelected && styles.backgroundItemSelected,
                    ]}
                  >
                    <Image
                      source={{ uri: bg.url }}
                      style={styles.backgroundImage}
                      resizeMode="cover"
                    />
                    {isSelected && (
                      <View style={styles.checkIconContainer}>
                        <Text style={styles.checkIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Ảnh upload tùy chỉnh */}
              {customBgUri && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setSelectedBg('custom')}
                  style={[
                    styles.backgroundItem,
                    selectedBg === 'custom' && styles.backgroundItemSelected,
                  ]}
                >
                  <Image
                    source={{ uri: customBgUri }}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                  />
                  {selectedBg === 'custom' && (
                    <View style={styles.checkIconContainer}>
                      <Text style={styles.checkIcon}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* Chụp ảnh */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={pickFromCamera}
                disabled={uploadingBg}
                style={styles.backgroundItem}
              >
                <View style={styles.placeholderBackground}>
                  {uploadingBg ? (
                    <ActivityIndicator color={PURPLE} size="small" />
                  ) : (
                    <>
                      <Text style={styles.bgAddIcon}>📷</Text>
                      <Text style={styles.bgAddLabel}>Chụp ảnh</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Thư viện */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={pickFromGallery}
                disabled={uploadingBg}
                style={styles.backgroundItem}
              >
                <View style={styles.placeholderBackground}>
                  {uploadingBg ? (
                    <ActivityIndicator color={PURPLE} size="small" />
                  ) : (
                    <>
                      <Text style={styles.bgAddIcon}>🖼️</Text>
                      <Text style={styles.bgAddLabel}>Thư viện</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Preview hiện tại */}
        {!isOwner && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Hình nền hiện tại</Text>
            {(() => {
              const src = getImageSource(fundEmoji);
              return src ? (
                <Image
                  source={src}
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[styles.previewImage, { backgroundColor: '#d5c8ff' }]}
                />
              );
            })()}
          </View>
        )}

        {/* Xoá quỹ (chỉ owner) */}
        {isOwner && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={deleting}
            activeOpacity={0.85}
          >
            {deleting ? (
              <ActivityIndicator color={RED} size="small" />
            ) : (
              <>
                {/* <Text style={styles.deleteIcon}>🗑️</Text> */}
                <Text style={styles.deleteText}>Xoá quỹ nhóm</Text>
                <SvgXml xml={trashSvg} />
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* CTA */}
      {isOwner && (
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[styles.ctaBtn, saving && styles.ctaBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.ctaIcon}>✓</Text>
                <Text style={styles.ctaText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.homeBar}>
        <View style={styles.homeIndicator} />
      </View>
    </KeyboardAvoidingView>
  );
};

export default GroupFundSettingsScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

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

  scroll: { paddingHorizontal: 16, paddingTop: 0, paddingBottom: 24, gap: 12 },

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
  cardLabel: { fontSize: 16, fontWeight: '600', color: DARK },

  textfield: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d1d1',
    borderRadius: 16,
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  textfieldInput: { fontSize: 16, fontWeight: '400', color: DARK, padding: 0 },

  backgroundGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  backgroundItem: {
    width: (SCREEN_WIDTH - 64 - 8) / 2,
    height: 90,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  backgroundItemSelected: { borderColor: PURPLE },
  backgroundImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  checkIconContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: { fontSize: 13, color: PURPLE, fontWeight: '700' },
  placeholderBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EDE8FF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 2,
    borderColor: '#d1d1d1',
    borderStyle: 'dashed',
  },
  bgAddIcon: { fontSize: 24 },
  bgAddLabel: { fontSize: 11, color: PURPLE, fontWeight: '600' },

  previewImage: { width: '100%', height: 120, borderRadius: 16 },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD0CF',
  },
  deleteIcon: { fontSize: 18 },
  deleteText: { fontSize: 15, fontWeight: '600', color: RED },

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
    width: '100%',
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
