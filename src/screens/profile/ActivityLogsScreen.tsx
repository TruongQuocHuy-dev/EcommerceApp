import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import api from '../../api/client';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';

type AuditLogItem = {
  _id: string;
  action: string;
  entity: string;
  status: 'success' | 'failed';
  ipAddress?: string;
  createdAt: string;
  metadata?: any;
};

const actionLabel = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'Tạo';
    case 'UPDATE':
      return 'Cập nhật';
    case 'DELETE':
      return 'Xóa';
    case 'LOGIN':
      return 'Đăng nhập';
    case 'LOGOUT':
      return 'Đăng xuất';
    case 'APPROVE':
      return 'Duyệt';
    case 'REJECT':
      return 'Từ chối';
    default:
      return action;
  }
};

const actionIcon = (action: string) => {
  switch (action) {
    case 'CREATE':
      return 'plus-circle-outline';
    case 'UPDATE':
      return 'pencil-outline';
    case 'DELETE':
      return 'trash-can-outline';
    case 'LOGIN':
      return 'login';
    case 'LOGOUT':
      return 'logout';
    case 'APPROVE':
      return 'check-circle-outline';
    case 'REJECT':
      return 'close-circle-outline';
    default:
      return 'information-outline';
  }
};

const ActivityLogsScreen = () => {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const canLoadMore = useMemo(() => page < pages && !loading, [page, pages, loading]);

  const fetchPage = useCallback(async (nextPage: number, replace = false) => {
    setLoading(true);
    try {
      const res = await api.get(`/audit-logs/me?page=${nextPage}&limit=20`);
      const data = res.data?.data;
      const logs: AuditLogItem[] = data?.logs || [];
      setPages(data?.pages || 1);
      setPage(data?.page || nextPage);
      setItems((prev) => (replace ? logs : [...prev, ...logs]));
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPage(1, true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  React.useEffect(() => {
    fetchPage(1, true).catch(() => {});
  }, [fetchPage]);

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (canLoadMore) fetchPage(page + 1).catch(() => {});
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="file-document-outline" size={52} color={COLORS.text.muted} />
            <Text style={styles.emptyTitle}>Chưa có nhật ký</Text>
            <Text style={styles.emptyDesc}>Các hoạt động của bạn sẽ hiển thị ở đây.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Icon name={actionIcon(item.action)} size={22} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {actionLabel(item.action)} · {item.entity}
                </Text>
                <Text style={styles.meta}>
                  {new Date(item.createdAt).toLocaleString('vi-VN')}
                  {item.ipAddress ? ` · ${item.ipAddress}` : ''}
                </Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  item.status === 'success' ? styles.statusSuccess : styles.statusFailed,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    item.status === 'success' ? styles.statusTextSuccess : styles.statusTextFailed,
                  ]}
                >
                  {item.status === 'success' ? 'Thành công' : 'Thất bại'}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  listContainer: { padding: SPACING.md, gap: SPACING.md },
  emptyContainer: { flexGrow: 1, padding: SPACING.md },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xl,
  },
  emptyTitle: { marginTop: SPACING.md, fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text.primary },
  emptyDesc: { marginTop: SPACING.xs, fontSize: FONT_SIZE.sm, color: COLORS.text.muted, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text.primary },
  meta: { marginTop: 2, fontSize: FONT_SIZE.xs, color: COLORS.text.muted },
  statusPill: { paddingHorizontal: SPACING.sm, paddingVertical: 6, borderRadius: BORDER_RADIUS.full },
  statusSuccess: { backgroundColor: '#DCFCE7' },
  statusFailed: { backgroundColor: '#FEE2E2' },
  statusText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
  statusTextSuccess: { color: '#166534' },
  statusTextFailed: { color: '#991B1B' },
});

export default ActivityLogsScreen;

