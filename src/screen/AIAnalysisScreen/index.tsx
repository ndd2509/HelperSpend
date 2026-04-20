import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BaseContainer } from 'react-native-shared-components';
import { getAIAnalysis } from '../../apis/apis';

const CONFIG: Record<string, { icon: string; title: string; color: string; gradient: string[] }> = {
  expense: {
    icon: '📊',
    title: 'Phân tích chi tiêu',
    color: '#007AFF',
    gradient: ['#007AFF', '#5856D6'],
  },
  income: {
    icon: '📈',
    title: 'Phân tích thu nhập',
    color: '#34C759',
    gradient: ['#34C759', '#30D158'],
  },
  financial: {
    icon: '💰',
    title: 'Phân tích tài chính',
    color: '#5856D6',
    gradient: ['#5856D6', '#AF52DE'],
  },
  category: {
    icon: '👥',
    title: 'Đối tượng thu/chi',
    color: '#AF52DE',
    gradient: ['#AF52DE', '#FF2D55'],
  },
};

const AIAnalysisScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { type = 'expense' } = route.params ?? {};

  const config = CONFIG[type] || CONFIG.expense;

  const [analysis, setAnalysis] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for loading
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    if (loading) pulse.start();
    return () => pulse.stop();
  }, [loading, pulseAnim]);

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      fadeAnim.setValue(0);
      slideAnim.setValue(30);

      const now = new Date();
      const response = await getAIAnalysis({
        type,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });

      if (response.success && response.data) {
        setAnalysis(response.data.analysis);
        setSummary(response.data.summary);
        animateIn();
      } else {
        setError('Không thể tải phân tích');
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          'Đã xảy ra lỗi khi phân tích',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const formatCurrency = (n: number) =>
    n.toLocaleString('vi-VN') + 'đ';

  // Parse markdown-like sections from analysis
  const renderAnalysis = (text: string) => {
    const sections = text.split(/^## /gm).filter(Boolean);

    return sections.map((section, index) => {
      const lines = section.split('\n');
      const title = lines[0]?.trim() || '';
      const body = lines.slice(1).join('\n').trim();

      return (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionBody}>{formatBody(body)}</Text>
        </View>
      );
    });
  };

  const formatBody = (text: string) => {
    // Clean up markdown bold markers for plain text display
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/^\s*[-•]\s*/gm, '  •  ')
      .trim();
  };

  return (
    <BaseContainer style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: config.color }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>{config.icon}</Text>
          <Text style={styles.headerTitle}>{config.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={fetchAnalysis}
          disabled={loading}
        >
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        {summary && !loading && (
          <Animated.View
            style={[
              styles.summaryRow,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={[styles.summaryCard, styles.incomeCard]}>
              <Text style={styles.summaryLabel}>Thu nhập</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(summary.totalIncome)}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.expenseCard]}>
              <Text style={styles.summaryLabel}>Chi tiêu</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(summary.totalExpense)}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.savingCard]}>
              <Text style={styles.summaryLabel}>Tiết kiệm</Text>
              <Text style={styles.summaryValue}>{summary.savingRate}%</Text>
            </View>
          </Animated.View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[
                styles.aiIconWrap,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Text style={styles.aiLoadingIcon}>🤖</Text>
            </Animated.View>
            <Text style={styles.loadingTitle}>AI đang phân tích...</Text>
            <Text style={styles.loadingSubtitle}>
              Đang thu thập dữ liệu giao dịch và phân tích chi tiết
            </Text>
            <ActivityIndicator
              size="small"
              color={config.color}
              style={{ marginTop: 16 }}
            />
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: config.color }]}
              onPress={fetchAnalysis}
            >
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analysis Content */}
        {analysis && !loading && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <View style={styles.aiLabel}>
              <Text style={styles.aiLabelIcon}>🤖</Text>
              <Text style={styles.aiLabelText}>Phân tích bởi Groq AI</Text>
            </View>
            <View style={styles.analysisCard}>
              {renderAnalysis(analysis)}
            </View>
          </Animated.View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </BaseContainer>
  );
};

export default AIAnalysisScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIcon: {
    fontSize: 18,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  incomeCard: {
    backgroundColor: '#E8FAF0',
  },
  expenseCard: {
    backgroundColor: '#FEF0F0',
  },
  savingCard: {
    backgroundColor: '#F0EDFE',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A2E',
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  aiIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#5856D6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  aiLoadingIcon: {
    fontSize: 40,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // AI Label
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  aiLabelIcon: {
    fontSize: 16,
  },
  aiLabelText: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },

  // Analysis Card
  analysisCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 14,
    color: '#3A3A4A',
    lineHeight: 22,
  },
});
