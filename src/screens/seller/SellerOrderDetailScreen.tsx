import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrderById, updateOrderStatus, clearCurrentOrder } from '../../store/orderSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type DetailRouteProp = RouteProp<RootStackParamList, 'SellerOrderDetail'>;
type DetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_LABELS: Record<string, string> = {
    pending: 'Chờ xác nhận',
    processing: 'Đang xử lý',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#22c55e',
    cancelled: '#ef4444',
};

const STATUS_ICONS: Record<string, string> = {
    pending: 'clock-outline',
    processing: 'cog-outline',
    shipped: 'truck-delivery-outline',
    delivered: 'check-circle-outline',
    cancelled: 'close-circle-outline',
};

// Map current status → next status and action label
const STATUS_ACTIONS: Record<string, { nextStatus: string; label: string; icon: string; color: string }> = {
    pending: { nextStatus: 'processing', label: 'Xác nhận đơn hàng', icon: 'check', color: '#3b82f6' },
    processing: { nextStatus: 'shipped', label: 'Giao hàng', icon: 'truck-delivery', color: '#8b5cf6' },
    shipped: { nextStatus: 'delivered', label: 'Xác nhận đã giao', icon: 'check-circle', color: '#22c55e' },
};

const PAYMENT_LABELS: Record<string, string> = {
    COD: 'Thanh toán khi nhận hàng',
    momo: 'Ví MoMo',
    vnpay: 'VNPay',
    card: 'Thẻ tín dụng',
    bank_transfer: 'Chuyển khoản',
    manual: 'Thủ công',
};

const SellerOrderDetailScreen = () => {
    const navigation = useNavigation<DetailNavigationProp>();
    const route = useRoute<DetailRouteProp>();
    const dispatch = useAppDispatch();
    const { currentOrder, isLoading, isUpdating } = useAppSelector((state) => state.order);

    const { orderId } = route.params;

    useEffect(() => {
        dispatch(fetchOrderById(orderId));
        return () => {
            dispatch(clearCurrentOrder());
        };
    }, [dispatch, orderId]);

    const handleUpdateStatus = () => {
        if (!currentOrder) return;
        const action = STATUS_ACTIONS[currentOrder.status];
        if (!action) return;

        Alert.alert(
            action.label,
            `Chuyển trạng thái đơn hàng sang "${STATUS_LABELS[action.nextStatus]}"?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xác nhận',
                    onPress: async () => {
                        try {
                            await dispatch(
                                updateOrderStatus({
                                    orderId,
                                    status: action.nextStatus,
                                })
                            ).unwrap();
                            Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng');
                            dispatch(fetchOrderById(orderId));
                        } catch (err: any) {
                            Alert.alert('Lỗi', err || 'Không thể cập nhật trạng thái');
                        }
                    },
                },
            ]
        );
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

    if (isLoading || !currentOrder) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const order = currentOrder;
    const statusAction = STATUS_ACTIONS[order.status];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>#{order.orderNumber}</Text>
                    <Text style={styles.headerDate}>{formatDate(order.createdAt)}</Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        { backgroundColor: (STATUS_COLORS[order.status] || '#999') + '20' },
                    ]}
                >
                    <Icon
                        name={STATUS_ICONS[order.status] || 'circle'}
                        size={14}
                        color={STATUS_COLORS[order.status] || '#999'}
                    />
                    <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] || '#999' }]}>
                        {STATUS_LABELS[order.status] || order.status}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Order Items */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Icon name="package-variant" size={18} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Sản phẩm ({order.items?.length})</Text>
                    </View>
                    {order.items?.map((item: any, idx: number) => (
                        <View key={idx} style={styles.itemRow}>
                            <Image
                                source={{ uri: item.image || 'https://via.placeholder.com/48' }}
                                style={styles.itemImage}
                            />
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                {item.variationText && (
                                    <Text style={styles.itemVariation}>{item.variationText}</Text>
                                )}
                                <View style={styles.itemPriceRow}>
                                    <Text style={styles.itemPrice}>${item.price?.toFixed(2)}</Text>
                                    <Text style={styles.itemQty}>x{item.quantity}</Text>
                                    <Text style={styles.itemSubtotal}>
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Shipping Address */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Icon name="map-marker" size={18} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
                    </View>
                    {order.shippingAddress && (
                        <View style={styles.addressCard}>
                            <View style={styles.addressRow}>
                                <Icon name="account" size={16} color={COLORS.text.secondary} />
                                <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
                            </View>
                            <View style={styles.addressRow}>
                                <Icon name="phone" size={16} color={COLORS.text.secondary} />
                                <Text style={styles.addressPhone}>{order.shippingAddress.phone}</Text>
                            </View>
                            <View style={styles.addressRow}>
                                <Icon name="home" size={16} color={COLORS.text.secondary} />
                                <Text style={styles.addressText}>
                                    {order.shippingAddress.address}
                                    {order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ''}
                                    {order.shippingAddress.province ? `, ${order.shippingAddress.province}` : ''}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Payment Info */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Icon name="credit-card" size={18} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Thanh toán</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Phương thức</Text>
                        <Text style={styles.infoValue}>
                            {PAYMENT_LABELS[order.paymentInfo?.method] || order.paymentInfo?.method}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Trạng thái</Text>
                        <View style={[
                            styles.paymentBadge,
                            {
                                backgroundColor: order.paymentInfo?.status === 'paid'
                                    ? COLORS.success + '15' : COLORS.warning + '15',
                            },
                        ]}>
                            <Text style={{
                                fontSize: FONT_SIZE.xs,
                                fontWeight: '700',
                                color: order.paymentInfo?.status === 'paid' ? COLORS.success : COLORS.warning,
                            }}>
                                {order.paymentInfo?.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tạm tính</Text>
                        <Text style={styles.summaryValue}>
                            ${(order.subtotal || order.totalAmount)?.toFixed(2)}
                        </Text>
                    </View>
                    {order.discount && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.discountLabel}>Giảm giá</Text>
                            <Text style={styles.discountValue}>-${order.discount.amount?.toFixed(2)}</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Tổng cộng</Text>
                        <Text style={styles.totalValue}>${order.totalAmount?.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Notes */}
                {order.notes && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="note-text" size={18} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Ghi chú</Text>
                        </View>
                        <Text style={styles.notesText}>{order.notes}</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Action Button */}
            {statusAction && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: statusAction.color }]}
                        onPress={handleUpdateStatus}
                        disabled={isUpdating}
                        activeOpacity={0.8}
                    >
                        {isUpdating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Icon name={statusAction.icon} size={22} color="#fff" />
                                <Text style={styles.actionBtnText}>{statusAction.label}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: SPACING.md, color: COLORS.text.secondary },
    scrollView: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: { padding: SPACING.xs, marginRight: SPACING.sm },
    headerInfo: { flex: 1 },
    headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text.primary },
    headerDate: { fontSize: FONT_SIZE.xs, color: COLORS.text.muted, marginTop: 2 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
        gap: 4,
    },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

    // Sections
    section: {
        backgroundColor: COLORS.surface,
        marginTop: SPACING.sm,
        padding: SPACING.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text.primary },

    // Items
    itemRow: {
        flexDirection: 'row',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    itemImage: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.divider,
    },
    itemInfo: { flex: 1, marginLeft: SPACING.md },
    itemName: { fontSize: FONT_SIZE.md, color: COLORS.text.primary, fontWeight: '500' },
    itemVariation: { fontSize: FONT_SIZE.xs, color: COLORS.text.muted, marginTop: 2 },
    itemPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.xs,
        gap: SPACING.md,
    },
    itemPrice: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary },
    itemQty: { fontSize: FONT_SIZE.sm, color: COLORS.text.muted },
    itemSubtotal: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.primary },

    // Address
    addressCard: {
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    addressName: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text.primary },
    addressPhone: { fontSize: FONT_SIZE.md, color: COLORS.text.secondary },
    addressText: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary, flex: 1, lineHeight: 20 },

    // Info rows
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.xs,
    },
    infoLabel: { fontSize: FONT_SIZE.md, color: COLORS.text.secondary },
    infoValue: { fontSize: FONT_SIZE.md, fontWeight: '500', color: COLORS.text.primary },
    paymentBadge: {
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: 3,
        borderRadius: BORDER_RADIUS.full,
    },

    // Summary
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    summaryLabel: { fontSize: FONT_SIZE.md, color: COLORS.text.secondary },
    summaryValue: { fontSize: FONT_SIZE.md, fontWeight: '500', color: COLORS.text.primary },
    discountLabel: { fontSize: FONT_SIZE.md, color: COLORS.success },
    discountValue: { fontSize: FONT_SIZE.md, fontWeight: '500', color: COLORS.success },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: SPACING.sm,
        marginTop: SPACING.xs,
    },
    totalLabel: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text.primary },
    totalValue: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.primary },
    notesText: { fontSize: FONT_SIZE.md, color: COLORS.text.secondary, lineHeight: 22 },

    // Bottom Action
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        paddingBottom: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        gap: SPACING.sm,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
});

export default SellerOrderDetailScreen;
