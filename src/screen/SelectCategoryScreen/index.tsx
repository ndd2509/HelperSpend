import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BaseContainer } from 'react-native-shared-components';
import { getCategories } from '../../apis/apis';
import type { Category } from '../../apis/types';

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = 'expense' | 'income';

interface CategoryItem extends Category {
  group?: string;
}

// ─── Group config ─────────────────────────────────────────────────────────────
const GROUP_CONFIG: Record<string, { icon: string; color: string }> = {
  'Ăn uống':          { icon: '🍜', color: '#FF7043' },
  'Di chuyển':        { icon: '🚗', color: '#42A5F5' },
  'Mua sắm':          { icon: '🛍️', color: '#EC407A' },
  'Giải trí':         { icon: '🎮', color: '#AB47BC' },
  'Sức khỏe':         { icon: '❤️', color: '#EF5350' },
  'Nhà ở':            { icon: '🏠', color: '#26A69A' },
  'Hóa đơn':          { icon: '🧾', color: '#FFA726' },
  'Giáo dục':         { icon: '🎓', color: '#29B6F6' },
  'Trẻ em':           { icon: '👶', color: '#66BB6A' },
  'Quà & Từ thiện':   { icon: '🎁', color: '#FF7043' },
  'Thú cưng':         { icon: '🐾', color: '#8D6E63' },
  'Ngân hàng':        { icon: '🏦', color: '#5C6BC0' },
  'Khác':             { icon: '📌', color: '#78909C' },
  'Thu nhập chính':   { icon: '💼', color: '#43A047' },
  'Đầu tư':           { icon: '📈', color: '#1E88E5' },
  'Quà nhận':         { icon: '🎀', color: '#E91E63' },
  'Thu khác':         { icon: '💡', color: '#FB8C00' },
};

// Group flat list into rows of 4
const groupIntoRows = (items: CategoryItem[]): CategoryItem[][] => {
  const rows: CategoryItem[][] = [];
  for (let i = 0; i < items.length; i += 4) {
    rows.push(items.slice(i, i + 4));
  }
  return rows;
};

// Build SectionList sections from flat API response
const buildSections = (cats: CategoryItem[], query: string) => {
  const filtered = query
    ? cats.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : cats;

  const groupMap: Record<string, CategoryItem[]> = {};
  filtered.forEach(cat => {
    const group = (cat as any).group || 'Khác';
    if (!groupMap[group]) groupMap[group] = [];
    groupMap[group].push(cat);
  });

  return Object.entries(groupMap).map(([title, items]) => ({
    title,
    icon: GROUP_CONFIG[title]?.icon || '📌',
    color: GROUP_CONFIG[title]?.color || '#607D8B',
    data: groupIntoRows(items),
  }));
};

// ─── Component ────────────────────────────────────────────────────────────────
export const SelectCategoryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialType: TabType = route.params?.type || 'expense';

  const [activeTab, setActiveTab] = useState<TabType>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories(activeTab);
  }, [activeTab]);

  const loadCategories = async (t: TabType) => {
    try {
      setLoading(true);
      setSearchQuery('');
      const res = await getCategories(t);
      if (res.success) {
        setCategories(res.data as CategoryItem[]);
      }
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const sections = useMemo(
    () => buildSections(categories, searchQuery),
    [categories, searchQuery],
  );

  const handleSelect = (cat: CategoryItem) => {
    navigation.navigate('AddTransaction', {
      selectedCategory: { id: cat.id, name: cat.name, type: cat.type, icon: cat.icon },
      type: activeTab,
    });
  };

  const TABS: { key: TabType; label: string }[] = [
    { key: 'expense', label: 'Chi tiêu' },
    { key: 'income', label: 'Thu tiêu' },
  ];

  return (
    <BaseContainer style={styles.container} edges={['top']}>
      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn hạng mục</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.headerIconText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.headerIconText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── TABS ──────────────────────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
            {activeTab === tab.key && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SEARCH ────────────────────────────────────────────────────── */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên hạng mục"
          placeholderTextColor="#bbb"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearch}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── LOADING ───────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Đang tải hạng mục...</Text>
        </View>
      ) : (
        /* ── CATEGORY LIST ────────────────────────────────────────────── */
        <SectionList
          sections={sections}
          keyExtractor={(row, idx) => `row-${idx}-${row[0]?.id}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.groupHeader}>
              <View style={[styles.groupIconWrap, { backgroundColor: section.color + '20' }]}>
                <Text style={styles.groupIcon}>{section.icon}</Text>
              </View>
              <Text style={[styles.groupTitle, { color: section.color }]}>
                {section.title}
              </Text>
            </View>
          )}
          renderItem={({ item: row, section }) => (
            <View style={styles.catRow}>
              {row.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.catItem}
                  onPress={() => handleSelect(cat)}
                >
                  <View style={[styles.catIconWrap, { backgroundColor: section.color + '18' }]}>
                    <Text style={styles.catIcon}>{cat.icon || '📌'}</Text>
                  </View>
                  <Text style={styles.catName} numberOfLines={2}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {/* Fill empty cells */}
              {row.length < 4 &&
                Array.from({ length: 4 - row.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={styles.catItem} />
                ))}
            </View>
          )}
          renderSectionFooter={() => <View style={styles.sectionSeparator} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Không tìm thấy hạng mục</Text>
              <Text style={styles.emptySub}>Thử từ khóa khác</Text>
            </View>
          }
        />
      )}
    </BaseContainer>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: {
    fontSize: 22,
    color: '#444',
    fontWeight: '600',
  },
  headerIconText: {
    fontSize: 18,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
  },
  headerRight: {
    flexDirection: 'row',
  },

  // ── Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabLabel: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#1E88E5',
    fontWeight: '700',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 2.5,
    backgroundColor: '#1E88E5',
    borderRadius: 2,
  },

  // ── Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 0,
  },
  clearSearch: {
    fontSize: 14,
    color: '#bbb',
    paddingHorizontal: 4,
  },

  // ── Loading
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#999',
  },

  // ── List
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 40,
  },

  // ── Group header
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    marginTop: 4,
  },
  groupIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupIcon: { fontSize: 18 },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
  },

  // ── Category row & item
  catRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  catItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  catIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catIcon: { fontSize: 28 },
  catName: {
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
    lineHeight: 15,
  },

  // ── Section separator
  sectionSeparator: {
    height: 10,
    backgroundColor: '#F5F7FA',
    marginVertical: 4,
    borderRadius: 8,
  },

  // ── Empty
  emptyBox: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#aaa',
  },
});
