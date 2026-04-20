import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import FastImage from 'react-native-fast-image';
import { SvgXml } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../assets/svg';
import { Images } from '../../assets/image';

export default function HeaderLogin({
  isBack = false,
  onPressBack,
  isLogo = false,
  isFocused,
}: any) {
  //   const [visible, setVisible] = useState(false);
  //   const onPressIconRightHeader = () => {
  //     if (onCloseKeyboard) {
  //       onCloseKeyboard?.();
  //     }
  //     setTimeout(() => {
  //       setVisible(true);
  //     }, 250);
  //   };
  const { top } = useSafeAreaInsets();

  return (
    <View style={{}}>
      {!isLogo && (
        <FastImage
          source={Images.header_background}
          style={styles.imageHeader}
        />
      )}
      <View style={[styles.containerHeader, { paddingTop: top }]}>
        {isBack && (
          <TouchableOpacity onPress={onPressBack} style={styles.btnBack}>
            <SvgXml xml={Icon.ic_arrow_left} />
          </TouchableOpacity>
        )}
        {isLogo && (
          <TouchableOpacity activeOpacity={1} onPress={onPressBack}>
            <SvgXml xml={Icon.ic_header_logo} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.buttonSupport, { opacity: isFocused && 1 }]}
        >
          <Text style={styles.label}>Hỗ trợ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 200,
    zIndex: -1,
  },
  containerHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  btnBack: {
    alignSelf: 'flex-start',
    marginVertical: 10,
  },
  buttonSupport: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 5.5,
    borderRadius: 20,
    marginVertical: 10,
    shadowColor: '#ccc',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
    marginLeft: 'auto',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
});
