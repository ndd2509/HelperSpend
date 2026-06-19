import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

export type WebViewScreenParams = {
  WebViewScreen: {
    type: 'terms' | 'privacy';
  };
};

const TERMS_CONTENT = {
  title: 'Điều khoản sử dụng',
  lastUpdated: '01/01/2025',
  sections: [
    {
      heading: '1. Chấp nhận điều khoản',
      body: 'Bằng cách tải xuống, cài đặt hoặc sử dụng ứng dụng HelperSpend, bạn đồng ý bị ràng buộc bởi các Điều khoản sử dụng này. Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, bạn không được phép sử dụng ứng dụng.',
    },
    {
      heading: '2. Mô tả dịch vụ',
      body: 'HelperSpend là ứng dụng quản lý tài chính cá nhân giúp người dùng theo dõi thu chi, quản lý ngân sách, sử dụng ví điện tử nội bộ và nhận tư vấn tài chính từ trí tuệ nhân tạo. Ứng dụng được cung cấp "nguyên trạng" và có thể thay đổi mà không cần thông báo trước.',
    },
    {
      heading: '3. Tài khoản người dùng',
      body: 'Bạn có trách nhiệm duy trì tính bảo mật của tài khoản và mật khẩu. Bạn đồng ý thông báo ngay cho chúng tôi về bất kỳ hành vi sử dụng trái phép nào đối với tài khoản của bạn. Bạn phải cung cấp thông tin chính xác và cập nhật khi đăng ký.',
    },
    {
      heading: '4. Quy định sử dụng ví điện tử',
      body: 'Số dư ví trong HelperSpend là số dư nội bộ chỉ có giá trị trong phạm vi ứng dụng. Các giao dịch nạp tiền và chuyển khoản cần được xác nhận bởi quản trị viên. Chúng tôi không chịu trách nhiệm về các thiệt hại phát sinh từ việc sử dụng sai mục đích.',
    },
    {
      heading: '5. Quyền sở hữu trí tuệ',
      body: 'Tất cả nội dung trong ứng dụng, bao gồm nhưng không giới hạn ở văn bản, đồ họa, logo, biểu tượng, hình ảnh và phần mềm, là tài sản của HelperSpend và được bảo vệ bởi luật bản quyền. Bạn không được sao chép, phân phối hoặc tạo ra các tác phẩm phái sinh.',
    },
    {
      heading: '6. Giới hạn trách nhiệm',
      body: 'HelperSpend không chịu trách nhiệm về bất kỳ thiệt hại gián tiếp, ngẫu nhiên, đặc biệt, do hậu quả hoặc trừng phạt nào phát sinh từ việc bạn sử dụng hoặc không thể sử dụng dịch vụ. Các lời khuyên tài chính từ AI chỉ mang tính chất tham khảo.',
    },
    {
      heading: '7. Thay đổi điều khoản',
      body: 'Chúng tôi có quyền sửa đổi các Điều khoản này bất cứ lúc nào. Thay đổi sẽ có hiệu lực ngay khi được đăng tải trong ứng dụng. Việc tiếp tục sử dụng dịch vụ sau khi thay đổi được công bố đồng nghĩa với việc bạn chấp nhận các điều khoản mới.',
    },
    {
      heading: '8. Liên hệ',
      body: 'Nếu bạn có bất kỳ câu hỏi nào về Điều khoản này, vui lòng liên hệ với chúng tôi qua email: support@helperspend.vn hoặc số điện thoại: 1800 6789.',
    },
  ],
};

const PRIVACY_CONTENT = {
  title: 'Chính sách bảo mật',
  lastUpdated: '01/01/2025',
  sections: [
    {
      heading: '1. Thông tin chúng tôi thu thập',
      body: 'Chúng tôi thu thập thông tin bạn cung cấp trực tiếp khi đăng ký tài khoản (số điện thoại, họ tên, mật khẩu), thông tin giao dịch tài chính bạn nhập vào ứng dụng, và dữ liệu sử dụng ứng dụng để cải thiện trải nghiệm.',
    },
    {
      heading: '2. Cách chúng tôi sử dụng thông tin',
      body: 'Thông tin của bạn được sử dụng để: cung cấp và duy trì dịch vụ, xử lý giao dịch ví điện tử, cá nhân hóa trải nghiệm người dùng, gửi thông báo liên quan đến tài khoản và giao dịch, cải thiện dịch vụ và phát triển tính năng mới.',
    },
    {
      heading: '3. Bảo mật thông tin',
      body: 'Chúng tôi sử dụng các biện pháp bảo mật tiêu chuẩn ngành để bảo vệ thông tin của bạn, bao gồm mã hóa mật khẩu bằng bcrypt, xác thực JWT với thời hạn ngắn và HTTPS cho mọi kết nối. Tuy nhiên, không có phương thức truyền tải nào qua Internet là hoàn toàn an toàn.',
    },
    {
      heading: '4. Chia sẻ thông tin',
      body: 'Chúng tôi không bán, trao đổi hoặc chuyển giao thông tin cá nhân của bạn cho bên thứ ba mà không có sự đồng ý của bạn, ngoại trừ trường hợp pháp luật yêu cầu hoặc để bảo vệ quyền lợi hợp pháp của chúng tôi.',
    },
    {
      heading: '5. Dữ liệu AI',
      body: 'Khi bạn sử dụng tính năng phân tích AI hoặc chat tư vấn, dữ liệu tài chính của bạn (được ẩn danh hóa) được gửi đến dịch vụ Groq API để xử lý. Chúng tôi không lưu trữ lịch sử chat AI trên máy chủ của mình sau mỗi phiên.',
    },
    {
      heading: '6. Thông báo đẩy (Push Notification)',
      body: 'Ứng dụng sử dụng Firebase Cloud Messaging để gửi thông báo. Token thiết bị của bạn được lưu trữ an toàn và chỉ được sử dụng để gửi thông báo liên quan đến tài khoản của bạn.',
    },
    {
      heading: '7. Quyền của bạn',
      body: 'Bạn có quyền truy cập, chỉnh sửa hoặc xóa thông tin cá nhân của mình bất cứ lúc nào thông qua phần Cài đặt trong ứng dụng hoặc bằng cách liên hệ với chúng tôi. Bạn cũng có quyền từ chối nhận thông báo tiếp thị.',
    },
    {
      heading: '8. Thay đổi chính sách',
      body: 'Chúng tôi có thể cập nhật Chính sách bảo mật này theo thời gian. Chúng tôi sẽ thông báo cho bạn về bất kỳ thay đổi quan trọng nào qua thông báo đẩy hoặc email. Ngày cập nhật lần cuối được hiển thị ở đầu trang này.',
    },
    {
      heading: '9. Liên hệ',
      body: 'Nếu bạn có câu hỏi về Chính sách bảo mật này, hãy liên hệ: Email: privacy@helperspend.vn | Điện thoại: 1800 6789 | Địa chỉ: Hà Nội, Việt Nam.',
    },
  ],
};

export default function WebViewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<WebViewScreenParams, 'WebViewScreen'>>();
  const { type } = route.params;

  const content = type === 'terms' ? TERMS_CONTENT : PRIVACY_CONTENT;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{content.title}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>
            {type === 'terms' ? '📋' : '🛡️'}
          </Text>
          <Text style={styles.bannerTitle}>{content.title}</Text>
          <Text style={styles.bannerDate}>
            Cập nhật lần cuối: {content.lastUpdated}
          </Text>
        </View>

        {/* Sections */}
        {content.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2025 HelperSpend. Mọi quyền được bảo lưu.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40,
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 30,
    color: '#00A8E8',
    lineHeight: 34,
    fontWeight: '300',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  bannerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
    textAlign: 'center',
  },
  bannerDate: {
    fontSize: 13,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00A8E8',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#BBBBBB',
    textAlign: 'center',
  },
});
