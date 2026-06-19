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
  ScrollView,
  Alert,
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

// ─── Gợi ý theo chủ đề ──────────────────────────────────────────────────────
interface SuggestionTopic {
  id: string;
  label: string;
  emoji: string;
  questions: string[];
}

const SUGGESTION_TOPICS: SuggestionTopic[] = [
  {
    id: 'overview',
    label: 'Tổng quan',
    emoji: '📊',
    questions: [
      'Tôi chi tiêu gì nhiều nhất tháng này?',
      'Tỷ lệ tiết kiệm của tôi đang ở mức nào?',
      'Tình hình tài chính tháng này như thế nào?',
      'So sánh thu chi 3 tháng gần nhất cho tôi',
    ],
  },
  {
    id: 'saving',
    label: 'Tiết kiệm',
    emoji: '💡',
    questions: [
      'Cho tôi 5 lời khuyên tiết kiệm thực tế',
      'Tôi nên cắt giảm chi tiêu ở đâu?',
      'Làm sao để tiết kiệm 20% thu nhập?',
      'Quy tắc 50/30/20 áp dụng cho tôi thế nào?',
    ],
  },
  {
    id: 'budget',
    label: 'Ngân sách',
    emoji: '🎯',
    questions: [
      'Ngân sách nào đang bị vượt quá?',
      'Tôi nên đặt ngân sách cho danh mục nào?',
      'Gợi ý hạn mức ngân sách phù hợp với tôi',
      'Cách quản lý ngân sách hiệu quả nhất?',
    ],
  },
  {
    id: 'fund',
    label: 'Quỹ nhóm',
    emoji: '👥',
    questions: [
      'Các quỹ nhóm của tôi đang thế nào?',
      'Cách quản lý quỹ nhóm hiệu quả?',
      'Nên đặt mức đóng góp quỹ bao nhiêu?',
      'Quỹ nhóm nào đang có số dư thấp nhất?',
    ],
  },
  {
    id: 'plan',
    label: 'Kế hoạch',
    emoji: '🚀',
    questions: [
      'Lập kế hoạch tài chính cho tháng tới',
      'Tôi có thể tiết kiệm thêm bao nhiêu mỗi tháng?',
      'Cách đạt mục tiêu tài chính trong 6 tháng?',
      'Gợi ý phân bổ thu nhập của tôi',
    ],
  },
  {
    id: 'loan',
    label: 'Vay/Nợ',
    emoji: '💳',
    questions: [
      'Tôi đang có khoản nợ nào cần ưu tiên trả?',
      'Cách quản lý khoản vay hiệu quả?',
      'Nên trả nợ hay tiết kiệm trước?',
      'Tình trạng các khoản vay của tôi thế nào?',
    ],
  },
];

const AIChatScreen = () => {
  const navigation = useNavigation<any>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('overview');
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
          'Xin chào! 👋 Tôi là **HelperSpend AI** — trợ lý tài chính của bạn.\n\nTôi có thể giúp bạn:\n• 📊 Phân tích chi tiêu & thu nhập\n• 💡 Gợi ý tiết kiệm thực tế\n• 🎯 Quản lý ngân sách & mục tiêu\n• 👥 Tư vấn quỹ nhóm\n• 💳 Theo dõi khoản vay\n\nChọn chủ đề bên dưới hoặc hỏi tôi bất cứ điều gì! 😊',
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Keyboard handling
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

  const handleClearChat = () => {
    Alert.alert(
      'Xóa cuộc trò chuyện',
      'Bạn có muốn bắt đầu cuộc trò chuyện mới không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            setMessages([
              {
                id: 'welcome',
                role: 'assistant',
                content:
                  'Cuộc trò chuyện mới bắt đầu! 🌟 Tôi có thể giúp gì cho bạn?',
                timestamp: new Date(),
              },
            ]);
          },
        },
      ],
    );
  };

  // Render text with basic bold markdown (**text**)
  const renderMessageText = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    return (
      <Text>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text key={i} style={{ fontWeight: '700' }}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
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
            {isUser ? item.content : renderMessageText(item.content)}
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
        <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, dotStyle(dot1)]} />
            <Animated.View style={[styles.dot, dotStyle(dot2)]} />
            <Animated.View style={[styles.dot, dotStyle(dot3)]} />
          </View>
        </View>
      </View>
    );
  };

  // Suggestion section — shown only when chat is new (only welcome message)
  const renderSuggestions = () => {
    if (messages.length > 1) return null;

    const currentTopic = SUGGESTION_TOPICS.find(t => t.id === selectedTopic) ?? SUGGESTION_TOPICS[0];

    return (
      <View style={styles.suggestionsWrapper}>
        {/* Topic chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topicChipsRow}
        >
          {SUGGESTION_TOPICS.map(topic => (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicChip,
                selectedTopic === topic.id && styles.topicChipActive,
              ]}
              onPress={() => setSelectedTopic(topic.id)}
            >
              <Text style={styles.topicChipEmoji}>{topic.emoji}</Text>
              <Text
                style={[
                  styles.topicChipLabel,
                  selectedTopic === topic.id && styles.topicChipLabelActive,
                ]}
              >
                {topic.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Questions for selected topic */}
        <Text style={styles.suggestionsTitle}>💬 Câu hỏi gợi ý:</Text>
        {currentTopic.questions.map((q, i) => (
          <TouchableOpacity
            key={i}
            style={styles.suggestionBtn}
            onPress={() => handleSend(q)}
            activeOpacity={0.7}
          >
            <Text style={styles.suggestionBtnArrow}>→</Text>
            <Text style={styles.suggestionText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const isShowingHistory = messages.length > 1;
  const charCount = input.length;

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
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>🤖 HelperSpend AI</Text>
              <View style={styles.onlineDot} />
            </View>
            <Text style={styles.headerSubtitle}>
              Groq • Llama 3.3 70B
            </Text>
          </View>
          {isShowingHistory ? (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClearChat}
            >
              <Text style={styles.clearBtnText}>🗑️</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerRight} />
          )}
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
          {charCount > 400 && (
            <Text style={styles.charCounter}>{charCount}/500</Text>
          )}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={input}
              onChangeText={setInput}
              placeholder="Hỏi về tài chính của bạn..."
              placeholderTextColor="#8E8E93"
              multiline
              maxLength={500}
              editable={!sending}
              onSubmitEditing={() => handleSend()}
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

  // ── Header
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  clearBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: 18,
  },

  // ── Messages
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

  // ── Typing indicator
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

  // ── Suggestions
  suggestionsWrapper: {
    marginTop: 4,
    marginBottom: 12,
    paddingLeft: 40,
    paddingRight: 8,
  },
  topicChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topicChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  topicChipEmoji: {
    fontSize: 13,
  },
  topicChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  topicChipLabelActive: {
    color: '#FFFFFF',
  },
  suggestionsTitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
  },
  suggestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1E8FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 7,
    alignSelf: 'flex-start',
    gap: 8,
    maxWidth: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  suggestionBtnArrow: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '700',
  },
  suggestionText: {
    fontSize: 13,
    color: '#1C1C1E',
    flex: 1,
    flexWrap: 'wrap',
  },

  // ── Input
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 8,
  },
  charCounter: {
    fontSize: 11,
    color: '#FF9500',
    textAlign: 'right',
    marginBottom: 4,
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
