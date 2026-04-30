import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrders, clearOrders } from '../../store/orderSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type SellerOrdersNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TABS = [
    { key: '', label: 'Tất cả', icon: 'format-list-bulleted' },
    { key: 'pending', label: 'Mới', icon: 'bell-ring-outline' },
    { key: 'processing', label: 'Đang xử lý', icon: 'cog-outline' },
    { key: 'shipped', label: 'Đang giao', icon: 'truck-delivery-outline' },
    { key: 'delivered', label: 'Hoàn thành', icon: 'check-circle-outline' },
    { key: 'cancelled', label: 'Đã hủy', icon: 'close-circle-outline' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; action?: string }> = {
    pending: { color: '#f59e0b', bg: '#fef3c7', label: 'Chờ xác nhận', action: 'Xác nhận' },
    processing: { color: '#3b82f6', bg: '#dbeafe', label: 'Đang xử lý', action: 'Giao hàng' },
    shipped: { color: '#8b5cf6', bg: '#ede9fe', label: 'Đang giao', action: 'Đã giao' },
    delivered: { color: '#22c55e', bg: '#dcfce7', label: 'Hoàn thành' },
    cancelled: { color: '#ef4444', bg: '#fee2e2', label: 'Đã hủy' },
};

const SellerOrdersScreen = () => {
    const navigation = useNavigation<SellerOrdersNavigationProp>();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { orders, pagination, isLoading } = useAppSelector((state) => state.order);

    const [activeTab, setActiveTab] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadOrders = useCallback(
        (page = 1) => {
            const params: any = { page, limit: 15, asSeller: true };
            if (activeTab) params.status = activeTab;
            dispatch(fetchOrders(params));
        },
        [dispatch, activeTab]
    );

    useEffect(() => {
        dispatch(clearOrders());
        loadOrders(1);
    }, [activeTab, loadOrders, dispatch]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        dispatch(clearOrders());
        loadOrders(1);
        setIsRefreshing(false);
    };

    const handleLoadMore = () => {
        if (pagination?.hasNextPage && !isLoading) {
            loadOrders(pagination.currentPage + 1);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderOrderCard = ({ item }: { item: any }) => {
        const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
        const itemCount = item.items?.length || 0;

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('SellerOrderDetail', { orderId: item.id })}
                activeOpacity={0.7}
            >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.orderIdRow}>
                        <Icon name="receipt" size={14} color={COLORS.text.muted} />
                        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                        <Text style={[styles.statusText, { color: config.color }]}>
                            {config.label}
                        </Text>
                    </View>
                </View>

                {/* Customer Info */}
                <View style={styles.customerRow}>
                    <Icon name="account" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.customerName}>
                        {item.customer?.name || 'Khách hàng'}
                    </Text>
                </View>

                {/* Items Preview */}
                <View style={styles.itemsPreview}>
                    <Text style={styles.itemsText} numberOfLines={1}>
                        {item.items?.map((i: any) => i.name).join(', ') || 'Sản phẩm'}
                    </Text>
                    <Text style={styles.itemCount}>{itemCount} sản phẩm</Text>
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                    <Text style={styles.totalAmount}>${item.totalAmount?.toFixed(2)}</Text>
                    {config.action && (
                        <View style={[styles.actionHint, { borderColor: config.color }]}>
                            <Text style={[styles.actionHintText, { color: config.color }]}>
                                {config.action} →
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => {
        if (isLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Icon name="clipboard-text-outline" size={80} color={COLORS.text.muted} />
                <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
                <Text style={styles.emptySubtitle}>
                    {activeTab
                        ? `Không có đơn "${STATUS_CONFIG[activeTab]?.label}"`
                        : 'Đơn hàng từ khách hàng sẽ xuất hiện ở đây'}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View>
                    <Text style={styles.title}>Quản lý đơn hàng</Text>
                    <Text style={styles.subtitle}>
                        {pagination ? `${pagination.totalItems} đơn hàng` : 'Đang tải...'}
                    </Text>
                </View>
            </View>

            {/* Status Tabs */}
            <View style={styles.tabsWrapper}>
                <FlatList
                    horizontal
                    data={STATUS_TABS}
                    keyExtractor={(item: any) => item.key}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                    renderItem={({ item }: { item: any }) => (
                        <TouchableOpacity
                            style={[
                                styles.tab,
                                activeTab === item.key && styles.tabActive,
                            ]}
                            onPress={() => setActiveTab(item.key)}
                            activeOpacity={0.7}
                        >
                            <Icon
                                name={item.icon}
                                size={16}
                                color={activeTab === item.key ? COLORS.text.inverse : COLORS.text.secondary}
                            />
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === item.key && styles.tabTextActive,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Orders List */}
            <FlatList
                data={orders}
                keyExtractor={(item: any) => item.id}
                renderItem={renderOrderCard}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={
                    pagination?.hasNextPage ? (
                        <View style={styles.loadMore}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text.primary },
    subtitle: { fontSize: FONT_SIZE.sm, color: COLORS.text.muted, marginTop: 2 },

    // Tabs
    tabsWrapper: {
        backgroundColor: COLORS.surface,
        height: 50,
    },
    tabsContainer: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, gap: SPACING.sm },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        height: 36,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
        alignSelf: 'center',
    },
    tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tabText: { fontSize: FONT_SIZE.xs, color: COLORS.text.secondary, fontWeight: '500' },
    tabTextActive: { color: COLORS.text.inverse },

    // Order Cards
    listContent: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.lg },
    orderCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    orderNumber: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text.secondary },
    orderDate: { fontSize: FONT_SIZE.xs, color: COLORS.text.muted, marginLeft: SPACING.sm },
    statusBadge: { paddingHorizontal: SPACING.sm + 2, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.xs,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    customerName: { fontSize: FONT_SIZE.md, fontWeight: '500', color: COLORS.text.primary },

    itemsPreview: {
        paddingVertical: SPACING.xs,
    },
    itemsText: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary },
    itemCount: { fontSize: FONT_SIZE.xs, color: COLORS.text.muted, marginTop: 2 },

    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        paddingTop: SPACING.sm,
    },
    totalAmount: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.primary },
    actionHint: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
        borderWidth: 1.5,
    },
    actionHintText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

    // Empty & Loading
    emptyContainer: { alignItems: 'center', paddingTop: 80 },
    emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '600', color: COLORS.text.primary, marginTop: SPACING.md },
    emptySubtitle: { fontSize: FONT_SIZE.md, color: COLORS.text.muted, marginTop: SPACING.xs },
    loadMore: { padding: SPACING.md, alignItems: 'center' },
});

export default SellerOrdersScreen;
