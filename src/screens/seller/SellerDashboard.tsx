import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    RefreshControl,
    StatusBar,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts } from '../../store/productSlice';
import { fetchOrders } from '../../store/orderSlice';
import { fetchMyShop } from '../../store/shopSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import api from '../../api/client';

type SellerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// --- Components ---

const StatCard = ({
    icon,
    label,
    value,
    color,
    bg,
    delay = 0,
}: {
    icon: string;
    label: string;
    value: string | number;
    color: string;
    bg: string;
    delay?: number;
}) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.statCard,
                {
                    opacity: anim,
                    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                },
            ]}
        >
            <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
                <Icon name={icon} size={22} color={color} />
            </View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </Animated.View>
    );
};

const AlertItem = ({ icon, title, desc, type }: { icon: string; title: string; desc: string; type: 'warning' | 'error' | 'info' }) => {
    const colors = {
        warning: { color: '#f59e0b', bg: '#fef3c7' },
        error: { color: '#ef4444', bg: '#fee2e2' },
        info: { color: '#3b82f6', bg: '#dbeafe' },
    };

    return (
        <View style={[styles.alertItem, { borderColor: colors[type].color }]}>
            <View style={[styles.alertIcon, { backgroundColor: colors[type].bg }]}>
                <Icon name={icon} size={20} color={colors[type].color} />
            </View>
            <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{title}</Text>
                <Text style={styles.alertDesc}>{desc}</Text>
            </View>
        </View>
    );
};

// --- Main Screen ---

const SellerDashboard = () => {
    const navigation = useNavigation<SellerDashboardNavigationProp>();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { user } = useAppSelector((state) => state.auth);
    const { products, isLoading: productsLoading } = useAppSelector((state) => state.product);
    const { orders, pagination, isLoading: ordersLoading } = useAppSelector((state) => state.order);
    const { myShop } = useAppSelector((state) => state.shop);

    const [overviewData, setOverviewData] = useState<any>(null);
    const [isLoadingOverview, setIsLoadingOverview] = useState(false);

    const fetchOverview = useCallback(async () => {
        if (!user?.id) return;
        setIsLoadingOverview(true);
        try {
            const res = await api.get('/analytics/seller/overview');
            if (res.data?.success) {
                setOverviewData(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching seller overview:', error);
        } finally {
            setIsLoadingOverview(false);
        }
    }, [user?.id]);

    const loadData = useCallback(() => {
        if (user?.id) {
            dispatch(fetchProducts({ seller: user.id }));
            dispatch(fetchOrders({ asSeller: true, limit: 10 }));
            dispatch(fetchMyShop());
            fetchOverview();
        }
    }, [dispatch, user?.id, fetchOverview]);

    const isFocused = useIsFocused();

    useEffect(() => {
        if (!isFocused) return;

        loadData();

        // Poll shop status every 5 seconds while focused
        const timer = setInterval(() => {
            if (user?.id) {
                dispatch(fetchMyShop());
            }
        }, 5000);

        return () => clearInterval(timer);
    }, [isFocused, loadData, user?.id]);

    useEffect(() => {
        if (myShop?.status === 'suspended') {
            Alert.alert(
                'Cửa hàng bị tạm khóa',
                `Cửa hàng của bạn đã bị tạm khóa.\nLý do: ${myShop.suspensionReason || 'Không có lý do cụ thể.'}\n\nVui lòng liên hệ Admin để được hỗ trợ.`,
                [{ text: 'Đóng', style: 'cancel' }]
            );
        }
    }, [myShop?.status, myShop?.suspensionReason]);

    // Computed Stats
    const totalRevenue = overviewData ? overviewData.totalRevenue : products.reduce((sum: number, p: any) => sum + (p.price || 0) * (p.sold || 0), 0);
    const lowStockProducts = products.filter((p: any) => p.stock <= 5);
    const pendingCount = overviewData ? overviewData.pendingOrders : orders.filter((o: any) => o.status === 'pending').length;
    
    const isCompletelyEmpty = products.length === 0 && orders.length === 0 && !productsLoading && !ordersLoading;
    const recentOrders = orders.slice(0, 5); // Take top 5 recent orders

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return { label: 'Chờ xác nhận', color: '#f59e0b' };
            case 'processing': return { label: 'Đang xử lý', color: '#3b82f6' };
            case 'shipped': return { label: 'Đang giao', color: '#8b5cf6' };
            case 'delivered': return { label: 'Hoàn thành', color: '#10b981' };
            case 'cancelled': return { label: 'Đã hủy', color: '#ef4444' };
            default: return { label: status, color: COLORS.text.muted };
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#16a34a" />
            <ScrollView
                refreshControl={<RefreshControl refreshing={productsLoading || ordersLoading || isLoadingOverview} onRefresh={loadData} />}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
            >
                {/* Hero Header */}
                <View style={styles.hero}>
                    <View style={styles.heroContent}>
                        <View>
                            <Text style={styles.greeting}>Bảng điều khiển</Text>
                            <Text style={styles.shopName}>{user?.name || 'Cửa hàng của bạn'}</Text>
                        </View>
                        <TouchableOpacity 
                            style={styles.profileBtn}
                            onPress={() => navigation.navigate('SellerProfileTab' as any)}
                        >
                            <Icon name="store-cog-outline" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.mainStats}>
                        <View style={styles.revenueBox}>
                            <View style={styles.revenueHeader}>
                                <Text style={styles.revenueLabel}>Doanh thu thực tế</Text>
                                <View style={styles.badgeContext}>
                                    <Text style={styles.badgeContextText}>Đã hoàn thành</Text>
                                </View>
                            </View>
                            <Text style={styles.revenueValue}>{totalRevenue.toLocaleString()}đ</Text>
                            {overviewData && overviewData.revenueGrowth !== undefined && (
                                <Text style={styles.revenueTrend}>
                                    <Icon name={overviewData.revenueGrowth >= 0 ? "trending-up" : "trending-down"} size={14} color="#a7f3d0" />{' '}
                                    {overviewData.revenueGrowth >= 0 ? '+' : ''}{overviewData.revenueGrowth.toFixed(1)}% so với tháng trước
                                </Text>
                            )}
                        </View>
                        <View style={styles.statsGrid}>
                            <StatCard
                                icon="package-variant"
                                label="Sản phẩm"
                                value={overviewData ? overviewData.totalProducts : products.length}
                                color="#3b82f6"
                                bg="#dbeafe"
                                delay={100}
                            />
                            <StatCard
                                icon="cart-outline"
                                label="Đơn hàng"
                                value={overviewData ? overviewData.totalOrders : (pagination?.totalItems || 0)}
                                color="#10b981"
                                bg="#d1fae5"
                                delay={200}
                            />
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    
                    {/* Shop Suspended Warning Banner */}
                    {myShop?.status === 'suspended' && (
                        <View style={styles.suspendedBanner}>
                            <View style={styles.suspendedHeader}>
                                <Icon name="alert-octagon" size={24} color={COLORS.error} />
                                <Text style={styles.suspendedTitle}>CỬA HÀNG ĐANG BỊ TẠM KHÓA</Text>
                            </View>
                            <Text style={styles.suspendedDesc}>
                                Cửa hàng của bạn đã bị quản trị viên tạm khóa.
                            </Text>
                            {myShop.suspensionReason && (
                                <View style={styles.reasonBox}>
                                    <Text style={styles.reasonLabel}>Lý do khóa:</Text>
                                    <Text style={styles.reasonText}>{myShop.suspensionReason}</Text>
                                </View>
                            )}
                            <Text style={styles.contactSupportText}>
                                Vui lòng liên hệ với bộ phận hỗ trợ khách hàng để được trợ giúp giải quyết.
                            </Text>
                        </View>
                    )}

                    {/* Empty State Actionable */}
                    {isCompletelyEmpty && (
                        <View style={styles.emptyStateBox}>
                            <Icon name="rocket-launch-outline" size={48} color="#f59e0b" style={styles.emptyIcon} />
                            <Text style={styles.emptyTitle}>Bắt đầu hành trình bán hàng!</Text>
                            <Text style={styles.emptyDesc}>Cửa hàng của bạn chưa có sản phẩm nào. Hãy đăng sản phẩm đầu tiên để bắt đầu nhận đơn hàng.</Text>
                            
                            <TouchableOpacity 
                                style={[styles.primaryCta, myShop?.status === 'suspended' && styles.disabledCta]}
                                onPress={() => navigation.navigate('AddEditProduct', { isEdit: false })}
                                disabled={myShop?.status === 'suspended'}
                            >
                                <Icon name="plus-circle" size={20} color="#fff" />
                                <Text style={styles.primaryCtaText}>Đăng sản phẩm ngay</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.secondaryCta, myShop?.status === 'suspended' && styles.disabledCtaSecondary]}
                                onPress={() => navigation.navigate('SellerVouchers' as any)}
                                disabled={myShop?.status === 'suspended'}
                            >
                                <Icon name="ticket-percent-outline" size={20} color={COLORS.primary} />
                                <Text style={styles.secondaryCtaText}>Tạo mã khuyến mãi</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Alerts Section (Only show if there are issues) */}
                    {(lowStockProducts.length > 0 || pendingCount > 0) && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>⚠️ Cần chú ý</Text>
                            </View>
                            {pendingCount > 0 && (
                                <AlertItem
                                    icon="bell-ring"
                                    title={`${pendingCount} Đơn hàng chờ xác nhận`}
                                    desc="Xử lý ngay để đảm bảo tiến độ giao hàng."
                                    type="error" // Make it red to grab attention
                                />
                            )}
                            {lowStockProducts.length > 0 && (
                                <AlertItem
                                    icon="alert"
                                    title={`${lowStockProducts.length} Sản phẩm sắp hết hàng`}
                                    desc="Hãy cập nhật tồn kho để tránh mất đơn."
                                    type="warning"
                                />
                            )}
                        </View>
                    )}

                    {/* Quick Navigation */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Lối tắt</Text>
                        <View style={styles.shortcutGrid}>
                            <TouchableOpacity 
                                style={styles.shortcutItem}
                                onPress={() => navigation.navigate('SellerOrdersTab' as any)}
                            >
                                <View style={styles.iconContainer}>
                                    <View style={[styles.shortcutIcon, { backgroundColor: '#fef3c7' }]}>
                                        <Icon name="clipboard-list-outline" size={28} color="#f59e0b" />
                                    </View>
                                    {pendingCount > 0 && (
                                        <View style={styles.shortcutBadge}>
                                            <Text style={styles.shortcutBadgeText}>{pendingCount}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.shortcutText}>Đơn hàng</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.shortcutItem}
                                onPress={() => navigation.navigate('SellerProductsTab' as any)}
                            >
                                <View style={styles.iconContainer}>
                                    <View style={[styles.shortcutIcon, { backgroundColor: '#dcfce7' }]}>
                                        <Icon name="package-variant-closed" size={28} color="#16a34a" />
                                    </View>
                                </View>
                                <Text style={styles.shortcutText}>Sản phẩm</Text>
                            </TouchableOpacity>

                             <TouchableOpacity 
                                style={[styles.shortcutItem, myShop?.status === 'suspended' && { opacity: 0.5 }]}
                                onPress={() => navigation.navigate('SellerVouchers' as any)}
                                disabled={myShop?.status === 'suspended'}
                            >
                                <View style={styles.iconContainer}>
                                    <View style={[styles.shortcutIcon, { backgroundColor: '#dbeafe' }]}>
                                        <Icon name="ticket-percent-outline" size={28} color="#3b82f6" />
                                    </View>
                                </View>
                                <Text style={styles.shortcutText}>Khuyến mãi</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[styles.shortcutItem, myShop?.status === 'suspended' && { opacity: 0.5 }]}
                                onPress={() => navigation.navigate('SellerReports' as any)}
                                disabled={myShop?.status === 'suspended'}
                            >
                                <View style={styles.iconContainer}>
                                    <View style={[styles.shortcutIcon, { backgroundColor: '#ede9fe' }]}>
                                        <Icon name="chart-bar" size={28} color="#8b5cf6" />
                                    </View>
                                </View>
                                <Text style={styles.shortcutText}>Báo cáo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Recent Orders - Actionable Content */}
                    {!isCompletelyEmpty && recentOrders.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
                                <TouchableOpacity onPress={() => navigation.navigate('SellerOrdersTab' as any)}>
                                    <Text style={styles.seeAllText}>Xem tất cả</Text>
                                </TouchableOpacity>
                            </View>
                            
                            {recentOrders.map((order: any, index: number) => {
                                const statusInfo = getStatusLabel(order.status);
                                return (
                                    <TouchableOpacity 
                                        key={order.id || index}
                                        style={styles.recentOrderCard}
                                        onPress={() => navigation.navigate('SellerOrderDetail', { orderId: order.id })}
                                    >
                                        <View style={styles.recentOrderLeft}>
                                            <View style={[styles.orderIconBg, { backgroundColor: statusInfo.color + '20' }]}>
                                                <Icon name="receipt" size={20} color={statusInfo.color} />
                                            </View>
                                            <View>
                                                <Text style={styles.recentOrderId}>#{order.orderNumber || order.id.slice(-6).toUpperCase()}</Text>
                                                <Text style={[styles.recentOrderStatus, { color: statusInfo.color }]}>
                                                    {statusInfo.label}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.recentOrderRight}>
                                            <View style={{ alignItems: 'flex-end', marginRight: 8 }}>
                                                <Text style={styles.recentOrderAmount}>${order.totalAmount?.toFixed(2)}</Text>
                                                <Text style={styles.recentOrderDate}>{formatDate(order.createdAt)}</Text>
                                            </View>
                                            <Icon name="chevron-right" size={20} color={COLORS.text.muted} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    hero: {
        backgroundColor: '#16a34a',
        paddingBottom: 40,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
    },
    greeting: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    shopName: { fontSize: FONT_SIZE.xl, color: '#fff', fontWeight: '800' },
    profileBtn: { padding: 4 },
    mainStats: { paddingHorizontal: SPACING.md, marginTop: SPACING.xl },
    revenueBox: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: SPACING.md,
    },
    revenueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    revenueLabel: { color: 'rgba(255,255,255,0.9)', fontSize: FONT_SIZE.sm, fontWeight: '500' },
    badgeContext: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
    },
    badgeContextText: { color: '#fff', fontSize: 10, fontWeight: '600' },
    revenueValue: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1 },
    revenueTrend: { color: '#a7f3d0', fontSize: FONT_SIZE.xs, marginTop: 4, fontWeight: '500' },
    statsGrid: { flexDirection: 'row', gap: SPACING.sm },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    statIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    statValue: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text.primary },
    statLabel: { fontSize: FONT_SIZE.xs, color: COLORS.text.muted, fontWeight: '600' },
    
    content: { padding: SPACING.md, marginTop: -20 },
    section: { marginBottom: SPACING.xl },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
    sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.text.primary },
    seeAllText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: '600' },
    
    // Alerts
    alertItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderLeftWidth: 4,
        marginBottom: SPACING.sm,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    alertIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
    alertContent: { flex: 1 },
    alertTitle: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text.primary, marginBottom: 2 },
    alertDesc: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary },
    
    // Shortcuts
    shortcutGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    shortcutItem: { alignItems: 'center', width: '22%' },
    iconContainer: { position: 'relative' },
    shortcutIcon: { width: 60, height: 60, borderRadius: BORDER_RADIUS.xl, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    shortcutBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: COLORS.error,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#f8fafc',
    },
    shortcutBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    shortcutText: { fontSize: FONT_SIZE.sm, color: COLORS.text.primary, fontWeight: '700' },
    shortcutHint: { fontSize: 10, color: COLORS.error, fontWeight: '600', marginTop: 2 },
    
    // Empty State
    emptyStateBox: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.xl,
        alignItems: 'center',
        marginBottom: SPACING.xl,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
    },
    emptyIcon: { marginBottom: SPACING.md },
    emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.text.primary, marginBottom: SPACING.sm, textAlign: 'center' },
    emptyDesc: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 20 },
    primaryCta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: 12,
        borderRadius: BORDER_RADIUS.full,
        gap: 8,
        marginBottom: SPACING.sm,
        width: '100%',
        justifyContent: 'center',
    },
    primaryCtaText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },
    secondaryCta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: SPACING.xl,
        paddingVertical: 12,
        borderRadius: BORDER_RADIUS.full,
        gap: 8,
        width: '100%',
        justifyContent: 'center',
    },
    secondaryCtaText: { color: COLORS.primary, fontWeight: '700', fontSize: FONT_SIZE.md },

    // Recent Orders
    recentOrderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        marginBottom: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    recentOrderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
    orderIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    recentOrderId: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text.primary, marginBottom: 2 },
    recentOrderStatus: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
    recentOrderRight: { flexDirection: 'row', alignItems: 'center' },
    recentOrderAmount: { fontSize: FONT_SIZE.md, fontWeight: '800', color: COLORS.text.primary },
    recentOrderDate: { fontSize: 10, color: COLORS.text.muted, marginTop: 2 },

    // Suspended Shop Styles
    suspendedBanner: {
        backgroundColor: '#fee2e2',
        borderWidth: 1.5,
        borderColor: COLORS.error,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    suspendedHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    suspendedTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '800',
        color: COLORS.error,
    },
    suspendedDesc: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.primary,
        fontWeight: '600',
        marginBottom: 8,
    },
    reasonBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.sm,
        marginBottom: 8,
    },
    reasonLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.error,
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    reasonText: {
        fontSize: 13,
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    contactSupportText: {
        fontSize: 12,
        color: COLORS.text.secondary,
        fontStyle: 'italic',
    },
    disabledCta: {
        backgroundColor: COLORS.text.muted,
        shadowColor: 'transparent',
    },
    disabledCtaSecondary: {
        backgroundColor: '#e2e8f0',
    },
});

export default SellerDashboard;
