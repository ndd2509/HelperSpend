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

const EXPENSE_COLORS = [
  '#FF9500',
  '#FF3B30',
  '#AF52DE',
  '#00A8E8',
  '#FF2D55',
  '#5AC8FA',
];
const INCOME_COLORS = [
  '#34C759',
  '#00A8E8',
  '#FF9500',
  '#AF52DE',
  '#5AC8FA',
  '#FFD60A',
];
const fmt = (n: number) => n.toLocaleString('vi-VN') + ' đ';

const buildDonut = (slices: { pct: number; color: string }[], size: number) => {
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const sw = size * 0.18;
  const polar = (angle: number) => ({
    x: cx + r * Math.cos((angle - 90) * (Math.PI / 180)),
    y: cy + r * Math.sin((angle - 90) * (Math.PI / 180)),
  });
  let startAngle = 0;
  const paths = slices.map((s, i) => {
    const sweep = (s.pct / 100) * 360;
    const endAngle = startAngle + sweep;
    const start = polar(startAngle);
    const end = polar(endAngle - 0.5);
    const large = sweep > 180 ? 1 : 0;
    const d = `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
    startAngle = endAngle;
    return <Path key={i} d={d} fill="none" stroke={s.color} strokeWidth={sw} />;
  });
  return { paths, r, cx, cy, sw };
};

const ContactAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getAIAnalysis({ type: 'category' });
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
        <ActivityIndicator size="large" color="#00A8E8" />
        <Text style={styles.loadingText}>
          🤖 AI đang phân tích đối tượng...
        </Text>
      </View>
    );
  }

  const expenseBreakdown = chartData?.categoryBreakdown || [];
  const incomeBreakdown = chartData?.incomeBreakdown || [];
  const expTotal = expenseBreakdown.reduce(
    (s: number, b: any) => s + b.amount,
    0,
  );
  const incTotal = incomeBreakdown.reduce(
    (s: number, b: any) => s + b.amount,
    0,
  );

  const expSlices = expenseBreakdown.slice(0, 6).map((b: any, i: number) => ({
    ...b,
    pct: expTotal > 0 ? (b.amount / expTotal) * 100 : 0,
    color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
  }));
  const incSlices = incomeBreakdown.slice(0, 6).map((b: any, i: number) => ({
    ...b,
    pct: incTotal > 0 ? (b.amount / incTotal) * 100 : 0,
    color: INCOME_COLORS[i % INCOME_COLORS.length],
  }));

  const size = 140;
  const expDonut = expSlices.length > 0 ? buildDonut(expSlices, size) : null;
  const incDonut = incSlices.length > 0 ? buildDonut(incSlices, size) : null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Summary */}
      {summary && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: '#FF3B30' }]}>
            <Text style={styles.summaryLabel}>Tổng chi</Text>
            <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>
              {fmt(summary.totalExpense)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#34C759' }]}>
            <Text style={styles.summaryLabel}>Tổng thu</Text>
            <Text style={[styles.summaryValue, { color: '#34C759' }]}>
              {fmt(summary.totalIncome)}
            </Text>
          </View>
        </View>
      )}

      {/* Expense donut */}
      {expDonut && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📤 Đối tượng chi tiêu</Text>
          <View style={styles.donutRow}>
            <Svg width={size} height={size}>
              <G>
                <Circle
                  cx={expDonut.cx}
                  cy={expDonut.cy}
                  r={expDonut.r}
                  fill="none"
                  stroke="#F0F0F0"
                  strokeWidth={expDonut.sw}
                />
                {expDonut.paths}
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

      {/* Income donut */}
      {incDonut && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📥 Nguồn thu nhập</Text>
          <View style={styles.donutRow}>
            <Svg width={size} height={size}>
              <G>
                <Circle
                  cx={incDonut.cx}
                  cy={incDonut.cy}
                  r={incDonut.r}
                  fill="none"
                  stroke="#F0F0F0"
                  strokeWidth={incDonut.sw}
                />
                {incDonut.paths}
              </G>
            </Svg>
            <View style={styles.legend}>
              {incSlices.map((s: any, i: number) => (
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

      {/* Comparison */}
      {/* {summary && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>⚖️ So sánh thu chi</Text>
          <View style={styles.compareRow}>
            <View style={styles.compareItem}>
              <View style={[styles.compareBar, { flex: summary.totalIncome, backgroundColor: '#34C759' }]} />
              <Text style={styles.compareLabel}>Thu</Text>
            </View>
            <View style={styles.compareItem}>
              <View style={[styles.compareBar, { flex: summary.totalExpense, backgroundColor: '#FF3B30' }]} />
              <Text style={styles.compareLabel}>Chi</Text>
            </View>
          </View>
          <Text style={styles.compareBalance}>
            Chênh lệch: {fmt(summary.totalIncome - summary.totalExpense)}
          </Text>
        </View>
      )} */}

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
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
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
  compareRow: { gap: 8, marginBottom: 8 },
  compareItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compareBar: { height: 24, borderRadius: 6, minWidth: 10 },
  compareLabel: { fontSize: 12, color: '#666', fontWeight: '600', width: 30 },
  compareBalance: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00A8E8',
    textAlign: 'center',
    marginTop: 4,
  },
  analysisCard: {
    backgroundColor: '#F0F8FF',
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

export default ContactAnalysis;
