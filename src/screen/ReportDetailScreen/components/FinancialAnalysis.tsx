import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { getAIAnalysis } from '../../../apis/apis';

const COLORS = [
  '#FF9500',
  '#FF3B30',
  '#34C759',
  '#00A8E8',
  '#AF52DE',
  '#FF2D55',
  '#5AC8FA',
  '#FFD60A',
];
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' đ';

const FinancialAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getAIAnalysis({ type: 'financial' });
        if (res.success && res.data) {
          setAnalysis(res.data.analysis);
          setChartData(res.data.chartData || null);
          setSummary(res.data.summary || null);
        }
      } catch {
        setAnalysis('Không thể tải phân tích. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#5C6BC0" />
        <Text style={styles.loadingText}>
          🤖 AI đang phân tích tài chính...
        </Text>
      </View>
    );
  }

  const expenseBreakdown = chartData?.categoryBreakdown || [];
  const trend = chartData?.trend || [];
  const expTotal = expenseBreakdown.reduce(
    (s: number, b: any) => s + b.amount,
    0,
  );
  const expSlices = expenseBreakdown.slice(0, 6).map((b: any, i: number) => ({
    ...b,
    pct: expTotal > 0 ? (b.amount / expTotal) * 100 : 0,
    color: COLORS[i % COLORS.length],
  }));

  // Health score from saving rate
  const savingRate = summary?.savingRate || 0;
  const healthScore = Math.max(0, Math.min(100, 50 + savingRate));

  // Donut
  const size = 150;
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const sw = size * 0.18;
  const polar = (angle: number) => ({
    x: cx + r * Math.cos((angle - 90) * (Math.PI / 180)),
    y: cy + r * Math.sin((angle - 90) * (Math.PI / 180)),
  });
  let startAngle = 0;
  const donutPaths = expSlices.map((s: any, i: number) => {
    const sweep = (s.pct / 100) * 360;
    const endAngle = startAngle + sweep;
    const start = polar(startAngle);
    const end = polar(endAngle - 0.5);
    const large = sweep > 180 ? 1 : 0;
    const d = `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
    startAngle = endAngle;
    return <Path key={i} d={d} fill="none" stroke={s.color} strokeWidth={sw} />;
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Health Score */}
      {summary && (
        <View style={styles.healthCard}>
          <View style={styles.healthScoreCircle}>
            <Text
              style={[
                styles.healthScore,
                {
                  color:
                    healthScore >= 60
                      ? '#34C759'
                      : healthScore >= 40
                      ? '#FF9500'
                      : '#FF3B30',
                },
              ]}
            >
              {healthScore}
            </Text>
            <Text style={styles.healthScoreLabel}>điểm</Text>
          </View>
          <View style={styles.healthInfo}>
            <Text style={styles.healthTitle}>🏥 Sức khỏe tài chính</Text>
            <Text style={styles.healthDesc}>
              {healthScore >= 70
                ? 'Tốt! Bạn quản lý tài chính rất tốt.'
                : healthScore >= 50
                ? 'Khá ổn, có thể cải thiện thêm.'
                : 'Cần cải thiện! Chi tiêu vượt thu nhập.'}
            </Text>
          </View>
        </View>
      )}

      {/* Summary grid */}
      {summary && (
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderLeftColor: '#34C759' }]}>
              <Text style={styles.summaryLabel}>Thu nhập</Text>
              <Text style={[styles.summaryValue, { color: '#34C759' }]}>
                {fmt(summary.totalIncome)}
              </Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: '#FF3B30' }]}>
              <Text style={styles.summaryLabel}>Chi tiêu</Text>
              <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>
                {fmt(summary.totalExpense)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, { borderLeftColor: '#00A8E8' }]}>
              <Text style={styles.summaryLabel}>Số dư</Text>
              <Text style={[styles.summaryValue, { color: '#00A8E8' }]}>
                {fmt(summary.balance)}
              </Text>
            </View>
            <View style={[styles.summaryCard, { borderLeftColor: '#FF9500' }]}>
              <Text style={styles.summaryLabel}>Tiết kiệm</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: savingRate >= 0 ? '#34C759' : '#FF3B30' },
                ]}
              >
                {savingRate}%
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Trend 3 months */}
      {trend.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📈 Xu hướng 3 tháng</Text>
          <View style={styles.trendRow}>
            {trend.map((m: any, i: number) => {
              const maxVal = Math.max(
                ...trend.map((t: any) => Math.max(t.income, t.expense)),
                1,
              );
              const incH = (m.income / maxVal) * 100;
              const expH = (m.expense / maxVal) * 100;
              return (
                <View key={i} style={styles.trendItem}>
                  <View style={styles.trendBars}>
                    <View
                      style={[
                        styles.trendBar,
                        { height: incH, backgroundColor: '#34C759' },
                      ]}
                    />
                    <View
                      style={[
                        styles.trendBar,
                        { height: expH, backgroundColor: '#FF3B30' },
                      ]}
                    />
                  </View>
                  <Text style={styles.trendLabel}>T{m.month}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.trendLegend}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: '#34C759' }]}
              />
              <Text style={styles.legendCat}>Thu</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: '#FF3B30' }]}
              />
              <Text style={styles.legendCat}>Chi</Text>
            </View>
          </View>
        </View>
      )}

      {/* Expense breakdown donut */}
      {expSlices.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📊 Phân bổ chi tiêu</Text>
          <View style={styles.donutRow}>
            <Svg width={size} height={size}>
              <G>
                <Circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#F0F0F0"
                  strokeWidth={sw}
                />
                {donutPaths}
              </G>
            </Svg>
            <View style={styles.legend}>
              {expSlices.map((s: any, i: number) => (
                <View key={i} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: s.color }]}
                  />
                  <Text style={styles.legendCat} numberOfLines={1}>
                    {s.category}
                  </Text>
                  <Text style={styles.legendPct}>{s.pct.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* AI Analysis */}
      {/* {analysis && (
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>🤖 Phân tích từ AI</Text>
          <Text style={styles.analysisText}>{analysis}</Text>
        </View>
      )} */}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  loadingText: { fontSize: 15, color: '#888', fontWeight: '500' },
  healthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  healthScoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  healthScore: { fontSize: 24, fontWeight: '800' },
  healthScoreLabel: { fontSize: 10, color: '#999' },
  healthInfo: { flex: 1 },
  healthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  healthDesc: { fontSize: 13, color: '#666', lineHeight: 18 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
  },
  summaryLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  summaryValue: { fontSize: 17, fontWeight: '700' },
  chartCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 14,
  },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  legend: { flex: 1, gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendCat: { flex: 1, fontSize: 12, color: '#444', fontWeight: '500' },
  legendPct: { fontSize: 12, fontWeight: '700', color: '#333' },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 120,
    marginBottom: 10,
  },
  trendItem: { alignItems: 'center', flex: 1 },
  trendBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  trendBar: { width: 20, borderRadius: 4, minHeight: 4 },
  trendLabel: { fontSize: 11, color: '#888', marginTop: 6 },
  trendLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  analysisCard: {
    backgroundColor: '#F5F0FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  analysisTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 10,
  },
  analysisText: { fontSize: 14, color: '#333', lineHeight: 22 },
});

export default FinancialAnalysis;
