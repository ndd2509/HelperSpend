import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  launchImageLibrary,
  launchCamera,
  ImagePickerResponse,
} from 'react-native-image-picker';
import { uploadImage, uploadMultipleImages } from '../apis/apis';

interface ImageUploaderProps {
  onUploadSuccess?: (imageUrl: string) => void;
  multiple?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onUploadSuccess,
  multiple = false,
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImagePicker = () => {
    Alert.alert('Chọn ảnh', 'Bạn muốn chọn ảnh từ đâu?', [
      {
        text: 'Hủy',
        style: 'cancel',
      },
      {
        text: 'Thư viện',
        onPress: () => pickImageFromLibrary(),
      },
      {
        text: 'Máy ảnh',
        onPress: () => pickImageFromCamera(),
      },
    ]);
  };

  const pickImageFromLibrary = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: multiple ? 10 : 1,
      },
      handleImageResponse,
    );
  };

  const pickImageFromCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      },
      handleImageResponse,
    );
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      console.log('User cancelled image picker');
      return;
    }

    if (response.errorCode) {
      Alert.alert('Lỗi', response.errorMessage || 'Không thể chọn ảnh');
      return;
    }

    if (response.assets && response.assets.length > 0) {
      const uris = response.assets
        .map(asset => asset.uri || '')
        .filter(uri => uri);
      setSelectedImages(uris);
    }
  };

  const handleUpload = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('Lỗi', 'Vui lòng chọn ảnh trước');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      if (multiple && selectedImages.length > 1) {
        const images = selectedImages.map(uri => ({ uri }));
        const response = await uploadMultipleImages(images);

        if (response.data?.success) {
          Alert.alert(
            'Thành công',
            `Đã upload ${response.data.data.count} ảnh`,
          );
          setSelectedImages([]);
          setUploadProgress(0);
          if (onUploadSuccess && response.data.data.files[0]) {
            onUploadSuccess(response.data.data.files[0].url);
          }
        }
      } else {
        const response = await uploadImage(
          selectedImages[0],
          undefined,
          progress => setUploadProgress(progress),
        );

        if (response.data?.success) {
          Alert.alert('Thành công', 'Upload ảnh thành công');
          setSelectedImages([]);
          setUploadProgress(0);
          if (onUploadSuccess) {
            onUploadSuccess(response.data.data.url);
          }
        }
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Có lỗi xảy ra';
      Alert.alert('Lỗi upload', errorMessage);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.pickButton}
        onPress={handleImagePicker}
        disabled={uploading}
      >
        <Text style={styles.buttonText}>
          {multiple ? 'Chọn nhiều ảnh' : 'Chọn ảnh'}
        </Text>
      </TouchableOpacity>

      {selectedImages.length > 0 && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>
            Đã chọn {selectedImages.length} ảnh
          </Text>
          <View style={styles.imagesGrid}>
            {selectedImages.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.previewImage} />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.buttonDisabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.progressText}>{uploadProgress}%</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Upload</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  pickButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    marginTop: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
