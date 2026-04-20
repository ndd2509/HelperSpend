import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { sendChatMessage } from '../../apis/apis';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

const SUGGESTIONS = [
  'Tôi chi tiêu gì nhiều nhất?',
  'Cho tôi lời khuyên tiết kiệm',
  'Phân tích tài chính tháng này',
  'Tôi nên cắt giảm chi phí nào?',
];

const AIChatScreen = () => {
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Typing indicator animation
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const animateDots = useCallback(() => {
    const createAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ]),
      );
    Animated.parallel([
      createAnim(dot1, 0),
      createAnim(dot2, 150),
      createAnim(dot3, 300),
    ]).start();
  }, [dot1, dot2, dot3]);

  useEffect(() => {
    if (sending) {
      animateDots();
    } else {
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }
  }, [sending, animateDots, dot1, dot2, dot3]);

  // Welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Xin chào! 👋 Tôi là trợ lý tài chính AI của bạn.\n\nTôi có thể giúp bạn:\n• 📊 Phân tích chi tiêu\n• 💡 Gợi ý tiết kiệm\n• 📈 Đánh giá tài chính\n• 🎯 Lập kế hoạch ngân sách\n\nHãy hỏi tôi bất cứ điều gì! 😊',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Keyboard handling for modal
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 250,
        useNativeDriver: false,
      }).start();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? (e?.duration || 250) : 250,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeight]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;

    Keyboard.dismiss();
    setInput('');

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome' && !m.loading)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await sendChatMessage({
        message: msg,
        history,
      });

      if (response.success) {
        const aiMsg: ChatMessage = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: response.data.reply,
          timestamp: new Date(response.data.timestamp),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: '❌ Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageBubbleContainer,
          isUser ? styles.userContainer : styles.aiContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.aiText,
            ]}
          >
            {item.content}
          </Text>
          <Text style={[styles.timeText, isUser && styles.userTimeText]}>
            {item.timestamp.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!sending) return null;

    const dotStyle = (anim: Animated.Value) => ({
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -6],
          }),
        },
      ],
    });

    return (
      <View style={[styles.messageBubbleContainer, styles.aiContainer]}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>🤖</Text>
        </View>
        <View
          style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}
        >
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, dotStyle(dot1)]} />
            <Animated.View style={[styles.dot, dotStyle(dot2)]} />
            <Animated.View style={[styles.dot, dotStyle(dot3)]} />
          </View>
        </View>
      </View>
    );
  };

  const renderSuggestions = () => {
    if (messages.length > 1) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>💬 Gợi ý câu hỏi:</Text>
        {SUGGESTIONS.map((s, i) => (
          <TouchableOpacity
            key={i}
            style={styles.suggestionBtn}
            onPress={() => handleSend(s)}
          >
            <Text style={styles.suggestionText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🤖 Trợ lý AI</Text>
            <Text style={styles.headerSubtitle}>
              Powered by Groq • Llama 3.3
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          ListFooterComponent={
            <>
              {renderTypingIndicator()}
              {renderSuggestions()}
            </>
          }
        />

        {/* Input */}
        <Animated.View style={[styles.inputContainer, { marginBottom: keyboardHeight }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Hôm nay tôi có thể giúp gì cho bạn?"
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!input.trim() || sending) && styles.sendBtnDisabled,
              ]}
              onPress={() => handleSend()}
              disabled={!input.trim() || sending}
            >
              <Text style={styles.sendText}>▶</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 24,
    color: '#007AFF',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  // Messages
  messagesList: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  aiContainer: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#1C1C1E',
  },
  timeText: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimeText: {
    color: 'rgba(255,255,255,0.7)',
  },
  // Typing indicator
  typingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8E8E93',
  },
  // Suggestions
  suggestionsContainer: {
    marginTop: 8,
    marginBottom: 12,
    paddingLeft: 40,
  },
  suggestionsTitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  suggestionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: 14,
    color: '#007AFF',
  },
  // Input
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F2F2F7',
    borderRadius: 22,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#C7C7CC',
  },
  sendText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});

export default AIChatScreen;
