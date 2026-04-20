import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getUserImages, deleteImage, requestLogout } from '../../apis/apis';
import { useAuth } from '../../contexts/AuthContext';
import { BaseContainer } from 'react-native-shared-components';

interface UploadedImage {
  id: string;
  url: string;
  uploadedAt: string;
  filename: string;
  originalname: string;
}

export const ProfileScreen = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const { user, logout } = useAuth();

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await getUserImages();
      if (response.data?.success) {
        setImages(response.data.data.images);
      }
    } catch (error: any) {
      console.error('Error loading images:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadImages();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadImages();
    setRefreshing(false);
  };

  const handleDeleteImage = (imageId: string) => {
    Alert.alert('Xóa ảnh', 'Bạn có chắc chắn muốn xóa ảnh này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await deleteImage(imageId);
            if (response.data?.success) {
              Alert.alert('Thành công', 'Đã xóa ảnh');
              loadImages();
            }
          } catch (error: any) {
            const errorMessage =
              error?.response?.data?.message || 'Không thể xóa ảnh';
            Alert.alert('Lỗi', errorMessage);
          }
        },
      },
    ]);
  };

  const handleClearImages = () => {
    Alert.alert(
      'Xóa tất cả ảnh',
      'Bạn có chắc chắn muốn xóa tất cả ảnh đã upload?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const image of images) {
                await deleteImage(image.id);
              }
              Alert.alert('Thành công', 'Đã xóa tất cả ảnh');
              loadImages();
            } catch (error: any) {
              const errorMessage =
                error?.response?.data?.message || 'Không thể xóa ảnh';
              Alert.alert('Lỗi', errorMessage);
            }
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            try {
              await requestLogout();
            } catch (apiError) {
              console.error('Logout API error:', apiError);
            }
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Lỗi', 'Không thể đăng xuất, vui lòng thử lại');
          }
        },
      },
    ]);
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <BaseContainer style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header + Avatar */}
        <View style={styles.headerSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
          <Text style={styles.userPhone}>{user?.phone || ''}</Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{images.length}</Text>
            <Text style={styles.statLabel}>Ảnh</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {new Date().toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })}
            </Text>
            <Text style={styles.statLabel}>Tham gia</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Tài khoản</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.menuIconText}>👤</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Thông tin cá nhân</Text>
              <Text style={styles.menuSub}>{user?.name}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.menuIconText}>📱</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Số điện thoại</Text>
              <Text style={styles.menuSub}>{user?.phone}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.menuIconText}>🔒</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Đổi mật khẩu</Text>
              <Text style={styles.menuSub}>••••••••</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Images section */}
        <View style={styles.menuSection}>
          <View style={styles.imageSectionHeader}>
            <Text style={styles.menuSectionTitle}>
              Ảnh đã upload ({images.length})
            </Text>
            <View style={styles.imageActions}>
              {images.length > 0 && (
                <TouchableOpacity onPress={handleClearImages}>
                  <Text style={styles.clearBtn}>Xóa tất cả</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowImages(!showImages)}>
                <Text style={styles.toggleBtn}>
                  {showImages ? 'Ẩn' : 'Xem'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {showImages && (
            <>
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color="#00A8E8" />
                  <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
              ) : images.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyIcon}>📷</Text>
                  <Text style={styles.emptyText}>Chưa có ảnh nào</Text>
                  <Text style={styles.emptySub}>
                    Vào trang chủ để upload ảnh
                  </Text>
                </View>
              ) : (
                <View style={styles.imagesGrid}>
                  {images.map(image => (
                    <View key={image.id} style={styles.imageCard}>
                      <Image
                        source={{ uri: image.url }}
                        style={styles.image}
                        resizeMode="cover"
                      />
                      <View style={styles.imageOverlay}>
                        <Text style={styles.imageDate}>
                          {new Date(image.uploadedAt).toLocaleDateString(
                            'vi-VN',
                          )}
                        </Text>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteImage(image.id)}
                        >
                          <Text style={styles.deleteBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* App info */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Ứng dụng</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.menuIconText}>ℹ️</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Phiên bản</Text>
              <Text style={styles.menuSub}>1.0.0</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#E8EAF6' }]}>
              <Text style={styles.menuIconText}>📝</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Điều khoản sử dụng</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={[styles.menuIcon, { backgroundColor: '#E0F7FA' }]}>
              <Text style={styles.menuIconText}>🛡️</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>Chính sách bảo mật</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </BaseContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header
  headerSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00A8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#888',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 1,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00A8E8',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E5EA',
  },

  // Menu
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: {
    fontSize: 18,
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  menuSub: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 22,
    color: '#C7C7CC',
    fontWeight: '300',
  },

  // Images
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
  },
  clearBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  toggleBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00A8E8',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#888',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: '#999',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 12,
  },
  imageCard: {
    width: '48%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  image: {
    width: '100%',
    height: 130,
  },
  imageOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  imageDate: {
    fontSize: 11,
    color: '#888',
  },
  deleteBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 8,
  },
  logoutIcon: {
    fontSize: 18,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
