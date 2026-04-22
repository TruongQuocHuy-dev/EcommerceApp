import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Image,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrders, clearOrders } from '../../store/orderSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type OrdersNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TABS = [
    { key: '', label: 'Tất cả', icon: 'format-list-bulleted' },
    { key: 'pending', label: 'Chờ xử lý', icon: 'clock-outline' },
    { key: 'processing', label: 'Đang xử lý', icon: 'cog-outline' },
    { key: 'shipped', label: 'Đang giao', icon: 'truck-delivery-outline' },
    { key: 'delivered', label: 'Đã giao', icon: 'check-circle-outline' },
    { key: 'cancelled', label: 'Đã hủy', icon: 'close-circle-outline' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; icon: string }> = {
    pending: { color: '#f59e0b', bg: '#fffbeb', label: 'Chờ xử lý', icon: 'clock-outline' },
    processing: { color: '#3b82f6', bg: '#eff6ff', label: 'Đang xử lý', icon: 'cog-outline' },
    shipped: { color: '#8b5cf6', bg: '#f5f3ff', label: 'Đang giao', icon: 'truck-delivery-outline' },
    delivered: { color: '#22c55e', bg: '#f0fdf4', label: 'Đã giao', icon: 'check-circle-outline' },
    cancelled: { color: '#ef4444', bg: '#fef2f2', label: 'Đã hủy', icon: 'close-circle-outline' },
};

const formatPrice = (price: number) => {
    return price?.toLocaleString('vi-VN') || '0';
};

const OrdersScreen = () => {
    const navigation = useNavigation<OrdersNavigationProp>();
    const dispatch = useAppDispatch();
    const { orders, pagination, isLoading } = useAppSelector((state) => state.order);

    const [activeTab, setActiveTab] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadOrders = useCallback(
        (page = 1) => {
            const params: any = { page, limit: 15 };
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

    const handleTabChange = (tabKey: string) => {
        setActiveTab(tabKey);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderOrderItem = ({ item }: { item: any }) => {
        const firstItem = item.items?.[0];
        const itemCount = item.items?.length || 0;
        const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                activeOpacity={0.7}
            >
                {/* Status Color Strip */}
                <View style={[styles.statusStrip, { backgroundColor: config.color }]} />

                {/* Card Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.orderIdRow}>
                        <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                        <View style={styles.datePill}>
                            <Icon name="calendar-clock" size={11} color={COLORS.text.muted} />
                            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                        <Icon name={config.icon} size={12} color={config.color} />
                        <Text style={[styles.statusText, { color: config.color }]}>
                            {config.label}
                        </Text>
                    </View>
                </View>

                {/* Products Preview */}
                <View style={styles.productsSection}>
                    {firstItem && (
                        <View style={styles.productRow}>
                            <Image
                                source={{ uri: firstItem.image || 'https://via.placeholder.com/60' }}
                                style={styles.productImage}
                            />
                            <View style={styles.productInfo}>
                                <Text style={styles.productName} numberOfLines={2}>
                                    {firstItem.name || 'Sản phẩm'}
                                </Text>
                                {firstItem.variationText && (
                                    <View style={styles.variationBadge}>
                                        <Text style={styles.variationText}>{firstItem.variationText}</Text>
                                    </View>
                                )}
                                <View style={styles.priceQtyRow}>
                                    <Text style={styles.productPrice}>{formatPrice(firstItem.price)}đ</Text>
                                    <Text style={styles.productQty}>x{firstItem.quantity}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {itemCount > 1 && (
                        <View style={styles.moreItemsRow}>
                            <View style={styles.moreItemsDot} />
                            <Text style={styles.moreItemsText}>
                                và {itemCount - 1} sản phẩm khác
                            </Text>
                        </View>
                    )}
                </View>

                {/* Card Footer */}
                <View style={styles.cardFooter}>
                    <View style={styles.footerLeft}>
                        <Text style={styles.totalItemsText}>{itemCount} sản phẩm</Text>
                    </View>
                    <View style={styles.footerRight}>
                        <Text style={styles.totalLabel}>Tổng: </Text>
                        <Text style={styles.totalAmount}>{formatPrice(item.totalAmount)}đ</Text>
                    </View>
                </View>

                {/* Chevron */}
                <View style={styles.chevronContainer}>
                    <Icon name="chevron-right" size={20} color={COLORS.text.muted} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => {
        if (isLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                    <Icon name="package-variant" size={48} color={COLORS.text.muted} />
                </View>
                <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
                <Text style={styles.emptySubtitle}>
                    {activeTab
                        ? `Không có đơn hàng "${STATUS_CONFIG[activeTab]?.label}"`
                        : 'Hãy mua sắm để tạo đơn hàng đầu tiên'}
                </Text>
            </View>
        );
    };

    const renderFooter = () => {
        if (!pagination?.hasNextPage) return null;
        return (
            <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
        );
    };

    return (
        <View style={styles.container}>

            {/* Status Tabs */}
            <View style={styles.tabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContainer}
                >
                    {STATUS_TABS.map((item) => {
                        const isActive = activeTab === item.key;
                        const tabColor = item.key ? STATUS_CONFIG[item.key]?.color : COLORS.primary;

                        return (
                            <TouchableOpacity
                                key={item.key}
                                style={[
                                    styles.tab,
                                    isActive && styles.tabActive,
                                    isActive && { backgroundColor: tabColor, borderColor: tabColor },
                                ]}
                                onPress={() => handleTabChange(item.key)}
                                activeOpacity={0.7}
                            >
                                <Icon
                                    name={item.icon}
                                    size={16}
                                    color={isActive ? '#fff' : COLORS.text.secondary}
                                />
                                <Text
                                    style={[
                                        styles.tabText,
                                        isActive && styles.tabTextActive,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Orders List */}
            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={renderOrderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.primary}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.3}
                ListEmptyComponent={renderEmpty}
                ListFooterComponent={renderFooter}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    // ========== TABS ==========
    tabsWrapper: {
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    tabsContainer: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        gap: SPACING.xs + 2,
        alignItems: 'center',
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md + 4,
        paddingVertical: SPACING.sm + 4,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 6,
    },
    tabActive: {
        borderWidth: 0,
    },
    tabText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.secondary,
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#fff',
        fontWeight: '600',
    },

    // ========== ORDER CARD ==========
    listContent: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.xs,
        paddingBottom: SPACING.lg,
    },
    orderCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm + 2,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        position: 'relative',
    },
    statusStrip: {
        height: 3,
        width: '100%',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    orderIdRow: {
        gap: SPACING.xs,
    },
    orderNumber: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    datePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 2,
    },
    orderDate: {
        fontSize: FONT_SIZE.xs - 1,
        color: COLORS.text.muted,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
        gap: 4,
    },
    statusText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
    },

    // ========== PRODUCTS SECTION ==========
    productsSection: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    productRow: {
        flexDirection: 'row',
    },
    productImage: {
        width: 64,
        height: 64,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.divider,
    },
    productInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    productName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '500',
        color: COLORS.text.primary,
        lineHeight: 20,
    },
    variationBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.divider,
        borderRadius: BORDER_RADIUS.sm,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 1,
        marginTop: 4,
    },
    variationText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.secondary,
    },
    priceQtyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xs,
        gap: SPACING.sm,
    },
    productPrice: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.error,
        fontWeight: '600',
    },
    productQty: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
        backgroundColor: COLORS.divider,
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: BORDER_RADIUS.sm,
    },

    // More Items
    moreItemsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
        gap: SPACING.sm,
    },
    moreItemsDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
    },
    moreItemsText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.primary,
        fontWeight: '600',
    },

    // ========== CARD FOOTER ==========
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        backgroundColor: COLORS.background,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    footerLeft: {},
    totalItemsText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
    },
    totalAmount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.error,
    },

    // Chevron
    chevronContainer: {
        position: 'absolute',
        right: SPACING.sm,
        top: '50%',
        marginTop: -10,
        opacity: 0.4,
    },

    // ========== EMPTY STATE ==========
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.divider,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    emptyTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginTop: SPACING.sm,
    },
    emptySubtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.muted,
        marginTop: SPACING.xs,
        textAlign: 'center',
        paddingHorizontal: SPACING.xl,
    },
    loadMoreContainer: {
        padding: SPACING.md,
        alignItems: 'center',
    },
});

export default OrdersScreen;
