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

const ExpenseAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getAIAnalysis({ type: 'expense' });
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
        <ActivityIndicator size="large" color="#FF3B30" />
        <Text style={styles.loadingText}>🤖 AI đang phân tích chi tiêu...</Text>
      </View>
    );
  }

  const breakdown = chartData?.categoryBreakdown || [];
  const trend = chartData?.trend || [];
  const total = breakdown.reduce((s: number, b: any) => s + b.amount, 0);
  const slices = breakdown.slice(0, 6).map((b: any, i: number) => ({
    ...b,
    pct: total > 0 ? (b.amount / total) * 100 : 0,
    color: COLORS[i % COLORS.length],
  }));

  // Donut
  const size = 160;
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const sw = size * 0.18;
  const polar = (angle: number) => ({
    x: cx + r * Math.cos((angle - 90) * (Math.PI / 180)),
    y: cy + r * Math.sin((angle - 90) * (Math.PI / 180)),
  });
  let startAngle = 0;
  const paths = slices.map((s: any, i: number) => {
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
      {/* Summary */}
      {summary && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { borderLeftColor: '#FF3B30' }]}>
            <Text style={styles.summaryLabel}>Tổng chi tiêu</Text>
            <Text style={[styles.summaryValue, { color: '#FF3B30' }]}>
              {fmt(summary.totalExpense)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { borderLeftColor: '#34C759' }]}>
            <Text style={styles.summaryLabel}>Tổng thu nhập</Text>
            <Text style={[styles.summaryValue, { color: '#34C759' }]}>
              {fmt(summary.totalIncome)}
            </Text>
          </View>
        </View>
      )}

      {/* Donut chart */}
      {slices.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📤 Cơ cấu chi tiêu</Text>
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
                {paths}
              </G>
            </Svg>
            <View style={styles.legend}>
              {slices.map((s: any, i: number) => (
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

          {/* Category amounts */}
          <View style={styles.catList}>
            {breakdown.slice(0, 6).map((b: any, i: number) => (
              <View key={i} style={styles.catItem}>
                <View
                  style={[
                    styles.catDot,
                    { backgroundColor: COLORS[i % COLORS.length] },
                  ]}
                />
                <Text style={styles.catName}>{b.category}</Text>
                <Text style={styles.catAmount}>{fmt(b.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Trend */}
      {trend.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📈 Xu hướng chi tiêu 3 tháng</Text>
          <View style={styles.trendRow}>
            {trend.map((m: any, i: number) => {
              const maxVal = Math.max(
                ...trend.map((t: any) => Math.max(t.income, t.expense)),
                1,
              );
              const expH = (m.expense / maxVal) * 100;
              const incH = (m.income / maxVal) * 100;
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
                  <Text style={styles.trendAmount}>
                    {(m.expense / 1000).toFixed(0)}k
                  </Text>
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
  catList: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
    gap: 8,
  },
  catItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { flex: 1, fontSize: 13, color: '#444' },
  catAmount: { fontSize: 13, fontWeight: '600', color: '#FF3B30' },
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
  trendAmount: { fontSize: 10, color: '#999', marginTop: 2 },
  trendLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  analysisCard: {
    backgroundColor: '#FFF5F5',
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

export default ExpenseAnalysis;
