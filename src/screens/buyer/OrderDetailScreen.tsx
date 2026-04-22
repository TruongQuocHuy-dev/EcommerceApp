import React, { useEffect, useState } from 'react';
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
    TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrderById, cancelOrder, clearCurrentOrder } from '../../store/orderSlice';
import { createReview, resetReviewState } from '../../store/reviewSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type DetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;
type DetailNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_STEPS = ['pending', 'processing', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
};
const STATUS_ICONS: Record<string, string> = {
    pending: 'clock-outline',
    processing: 'cog-outline',
    shipped: 'truck-delivery-outline',
    delivered: 'check-circle-outline',
    cancelled: 'close-circle-outline',
};
const STATUS_COLORS: Record<string, string> = {
    pending: '#f59e0b',
    processing: '#3b82f6',
    shipped: '#8b5cf6',
    delivered: '#22c55e',
    cancelled: '#ef4444',
};
const STATUS_DESCRIPTIONS: Record<string, string> = {
    pending: 'Đơn hàng đang chờ xác nhận',
    processing: 'Đơn hàng đang được chuẩn bị',
    shipped: 'Đơn hàng đang trên đường giao',
    delivered: 'Đơn hàng đã được giao thành công',
    cancelled: 'Đơn hàng đã bị hủy',
};

const PAYMENT_LABELS: Record<string, string> = {
    COD: 'Thanh toán khi nhận hàng',
    momo: 'Ví MoMo',
    vnpay: 'VNPay',
    card: 'Thẻ tín dụng',
    bank_transfer: 'Chuyển khoản',
    manual: 'Thủ công',
};

const formatPrice = (price: number) => {
    return price?.toLocaleString('vi-VN') || '0';
};

const OrderDetailScreen = () => {
    const navigation = useNavigation<DetailNavigationProp>();
    const route = useRoute<DetailRouteProp>();
    const dispatch = useAppDispatch();
    const { currentOrder, isLoading, isUpdating } = useAppSelector((state) => state.order);
    const { isSubmitting, submitSuccess, submitError } = useAppSelector((state) => state.review);

    const { orderId } = route.params;

    // Review state per product
    const [reviewData, setReviewData] = useState<Record<string, { rating: number; title: string; comment: string }>>({});
    const [reviewedProducts, setReviewedProducts] = useState<Set<string>>(new Set());

    useEffect(() => {
        dispatch(fetchOrderById(orderId));
        return () => {
            dispatch(clearCurrentOrder());
            dispatch(resetReviewState());
        };
    }, [dispatch, orderId]);

    useEffect(() => {
        if (submitSuccess) {
            Alert.alert('Thành công', 'Đánh giá của bạn đã được gửi!');
            dispatch(resetReviewState());
        }
        if (submitError) {
            Alert.alert('Lỗi', submitError);
            dispatch(resetReviewState());
        }
    }, [submitSuccess, submitError, dispatch]);

    const getReviewForProduct = (productId: string) => {
        return reviewData[productId] || { rating: 0, title: '', comment: '' };
    };

    const setRating = (productId: string, rating: number) => {
        setReviewData(prev => ({
            ...prev,
            [productId]: { ...getReviewForProduct(productId), rating },
        }));
    };

    const setTitle = (productId: string, title: string) => {
        setReviewData(prev => ({
            ...prev,
            [productId]: { ...getReviewForProduct(productId), title },
        }));
    };

    const setComment = (productId: string, comment: string) => {
        setReviewData(prev => ({
            ...prev,
            [productId]: { ...getReviewForProduct(productId), comment },
        }));
    };

    const handleSubmitReview = async (productId: string) => {
        const data = getReviewForProduct(productId);
        if (data.rating === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn số sao');
            return;
        }
        if (!data.title.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập tiêu đề đánh giá');
            return;
        }
        if (!data.comment.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập nội dung đánh giá');
            return;
        }
        try {
            await dispatch(createReview({
                productId,
                rating: data.rating,
                title: data.title.trim(),
                comment: data.comment.trim(),
            })).unwrap();
            setReviewedProducts(prev => new Set(prev).add(productId));
        } catch {
            // error handled in useEffect
        }
    };

    const handleCancel = () => {
        Alert.alert(
            'Hủy đơn hàng',
            'Bạn có chắc muốn hủy đơn hàng này? Thao tác này không thể hoàn tác.',
            [
                { text: 'Không', style: 'cancel' },
                {
                    text: 'Hủy đơn',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(cancelOrder(orderId)).unwrap();
                            Alert.alert('Thành công', 'Đơn hàng đã được hủy');
                            dispatch(fetchOrderById(orderId));
                        } catch (err: any) {
                            Alert.alert('Lỗi', err || 'Không thể hủy đơn hàng');
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
    const isCancelled = order.status === 'cancelled';
    const currentStepIndex = STATUS_STEPS.indexOf(order.status);
    const statusColor = STATUS_COLORS[order.status] || COLORS.text.muted;

    // ===== Hero Header =====
    const renderHeader = () => (
        <View style={[styles.heroHeader, { backgroundColor: statusColor }]}>
            {/* Background pattern circles */}
            <View style={[styles.heroCircle, styles.heroCircle1]} />
            <View style={[styles.heroCircle, styles.heroCircle2]} />

            <View style={styles.heroContent}>
                {/* Status Icon */}
                <View style={styles.heroIconContainer}>
                    <Icon
                        name={STATUS_ICONS[order.status] || 'circle'}
                        size={36}
                        color="#fff"
                    />
                </View>

                {/* Status Info */}
                <Text style={styles.heroStatusLabel}>
                    {STATUS_LABELS[order.status] || order.status}
                </Text>
                <Text style={styles.heroDescription}>
                    {STATUS_DESCRIPTIONS[order.status] || ''}
                </Text>

                {/* Order Number & Date */}
                <View style={styles.heroMeta}>
                    <View style={styles.heroMetaItem}>
                        <Icon name="receipt" size={14} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.heroMetaText}>#{order.orderNumber}</Text>
                    </View>
                    <View style={styles.heroMetaDot} />
                    <View style={styles.heroMetaItem}>
                        <Icon name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.heroMetaText}>{formatDate(order.createdAt)}</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    // ===== Status Timeline =====
    const renderTimeline = () => {
        if (isCancelled) {
            return (
                <View style={styles.section}>
                    <View style={styles.cancelledBanner}>
                        <View style={styles.cancelledIconCircle}>
                            <Icon name="close" size={20} color="#fff" />
                        </View>
                        <View style={styles.cancelledInfo}>
                            <Text style={styles.cancelledTitle}>Đơn hàng đã bị hủy</Text>
                            <Text style={styles.cancelledSubtitle}>
                                Đơn hàng này đã được hủy
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <Icon name="timeline-clock-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
                </View>
                <View style={styles.timeline}>
                    {STATUS_STEPS.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const isActive = index <= currentStepIndex;
                        const isLast = index === STATUS_STEPS.length - 1;
                        const stepColor = STATUS_COLORS[step];

                        return (
                            <View key={step} style={styles.timelineStep}>
                                {/* Left Indicator Column */}
                                <View style={styles.timelineIndicator}>
                                    {/* Dot/Circle */}
                                    <View
                                        style={[
                                            styles.timelineDot,
                                            isActive && { backgroundColor: stepColor, borderColor: stepColor },
                                            isCurrent && styles.timelineDotCurrent,
                                            isCurrent && { borderColor: stepColor + '40' },
                                        ]}
                                    >
                                        {isCompleted ? (
                                            <Icon name="check" size={12} color="#fff" />
                                        ) : isCurrent ? (
                                            <View style={styles.timelineDotPulse}>
                                                <Icon name={STATUS_ICONS[step]} size={14} color="#fff" />
                                            </View>
                                        ) : (
                                            <View style={styles.timelineDotInactive} />
                                        )}
                                    </View>

                                    {/* Connecting Line */}
                                    {!isLast && (
                                        <View style={styles.timelineLineContainer}>
                                            <View
                                                style={[
                                                    styles.timelineLine,
                                                    isCompleted && {
                                                        backgroundColor: stepColor,
                                                    },
                                                ]}
                                            />
                                        </View>
                                    )}
                                </View>

                                {/* Right Content */}
                                <View style={[styles.timelineContent, isLast && { paddingBottom: 0 }]}>
                                    <Text
                                        style={[
                                            styles.timelineLabel,
                                            isActive && styles.timelineLabelActive,
                                            isCurrent && { color: stepColor, fontWeight: '700' },
                                        ]}
                                    >
                                        {STATUS_LABELS[step]}
                                    </Text>
                                    {isCurrent && (
                                        <Text style={styles.timelineDescription}>
                                            {STATUS_DESCRIPTIONS[step]}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Header */}
                {renderHeader()}

                {/* Timeline */}
                {renderTimeline()}

                {/* Order Items */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Icon name="package-variant" size={18} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Sản phẩm ({order.items?.length})</Text>
                    </View>
                    {order.items?.map((item: any, idx: number) => {
                        const productId = typeof item.product === 'object' ? item.product._id || item.product.id : item.product;
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.itemRow, idx === order.items.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={() => navigation.navigate('ProductDetail', { productId })}
                                activeOpacity={0.7}
                            >
                                <Image
                                    source={{ uri: item.image || 'https://via.placeholder.com/56' }}
                                    style={styles.itemImage}
                                />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                                    {item.variationText && (
                                        <View style={styles.itemVariationBadge}>
                                            <Text style={styles.itemVariation}>{item.variationText}</Text>
                                        </View>
                                    )}
                                    <View style={styles.itemPriceRow}>
                                        <Text style={styles.itemPrice}>{formatPrice(item.price)}đ</Text>
                                        <Text style={styles.itemQty}>x{item.quantity}</Text>
                                        <Text style={styles.itemSubtotal}>
                                            {formatPrice(item.price * item.quantity)}đ
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Shipping Address */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Icon name="map-marker" size={18} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
                    </View>
                    {order.shippingAddress && (
                        <View style={styles.addressCard}>
                            <View style={styles.addressTop}>
                                <Icon name="account" size={16} color={COLORS.text.primary} />
                                <Text style={styles.addressName}>{order.shippingAddress.name}</Text>
                                <View style={styles.addressDivider} />
                                <Icon name="phone" size={14} color={COLORS.text.secondary} />
                                <Text style={styles.addressPhone}>{order.shippingAddress.phone}</Text>
                            </View>
                            <Text style={styles.addressText}>
                                {order.shippingAddress.address}
                                {order.shippingAddress.city ? `, ${order.shippingAddress.city}` : ''}
                                {order.shippingAddress.province ? `, ${order.shippingAddress.province}` : ''}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Payment Info */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Icon name="credit-card" size={18} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Thanh toán</Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Phương thức</Text>
                        <Text style={styles.paymentValue}>
                            {PAYMENT_LABELS[order.paymentInfo?.method] || order.paymentInfo?.method}
                        </Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Trạng thái</Text>
                        <View style={[
                            styles.paymentStatusBadge,
                            {
                                backgroundColor: order.paymentInfo?.status === 'paid'
                                    ? COLORS.success + '15'
                                    : COLORS.warning + '15',
                            },
                        ]}>
                            <Icon
                                name={order.paymentInfo?.status === 'paid' ? 'check-circle' : 'clock-outline'}
                                size={12}
                                color={order.paymentInfo?.status === 'paid' ? COLORS.success : COLORS.warning}
                            />
                            <Text style={[
                                styles.paymentStatusText,
                                {
                                    color: order.paymentInfo?.status === 'paid'
                                        ? COLORS.success
                                        : COLORS.warning,
                                },
                            ]}>
                                {order.paymentInfo?.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Icon name="calculator-variant" size={18} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Chi tiết thanh toán</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tạm tính</Text>
                        <Text style={styles.summaryValue}>
                            {formatPrice(order.subtotal || order.totalAmount)}đ
                        </Text>
                    </View>
                    {order.discount && (
                        <View style={styles.summaryRow}>
                            <View style={styles.discountRow}>
                                <Icon name="tag" size={14} color={COLORS.success} />
                                <Text style={styles.discountLabel}>
                                    Giảm giá {order.discount.code ? `(${order.discount.code})` : ''}
                                </Text>
                            </View>
                            <Text style={styles.discountValue}>
                                -{formatPrice(order.discount.amount)}đ
                            </Text>
                        </View>
                    )}
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                        <Text style={styles.summaryFreeShip}>Miễn phí</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Tổng cộng</Text>
                        <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}đ</Text>
                    </View>
                </View>

                {/* Notes */}
                {order.notes && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Icon name="note-text" size={18} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Ghi chú</Text>
                        </View>
                        <View style={styles.notesCard}>
                            <Text style={styles.notesText}>{order.notes}</Text>
                        </View>
                    </View>
                )}

                {/* Review Section — Only for delivered orders */}
                {order.status === 'delivered' && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Icon name="star-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>
                        </View>
                        <Text style={styles.reviewSectionSubtitle}>
                            Hãy chia sẻ trải nghiệm của bạn về sản phẩm
                        </Text>

                        {order.items?.map((item: any, idx: number) => {
                            const productId = typeof item.product === 'object' ? item.product._id || item.product.id : item.product;
                            const isReviewed = reviewedProducts.has(productId);
                            const data = getReviewForProduct(productId);

                            return (
                                <View key={idx} style={styles.reviewItemCard}>
                                    {/* Product Info */}
                                    <View style={styles.reviewProduct}>
                                        <Image
                                            source={{ uri: item.image || 'https://via.placeholder.com/40' }}
                                            style={styles.reviewProductImage}
                                        />
                                        <View style={styles.reviewProductInfo}>
                                            <Text style={styles.reviewProductName} numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                            {item.variationText && (
                                                <Text style={styles.reviewProductVariation}>
                                                    {item.variationText}
                                                </Text>
                                            )}
                                        </View>
                                    </View>

                                    {isReviewed ? (
                                        /* Already Reviewed */
                                        <View style={styles.reviewedBanner}>
                                            <Icon name="check-circle" size={20} color={COLORS.success} />
                                            <Text style={styles.reviewedText}>Đã đánh giá - Cảm ơn bạn!</Text>
                                        </View>
                                    ) : (
                                        /* Review Form */
                                        <View style={styles.reviewForm}>
                                            {/* Star Rating */}
                                            <View style={styles.starRow}>
                                                <Text style={styles.starLabel}>Đánh giá:</Text>
                                                <View style={styles.starsContainer}>
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <TouchableOpacity
                                                            key={star}
                                                            onPress={() => setRating(productId, star)}
                                                            activeOpacity={0.6}
                                                            style={styles.starButton}
                                                        >
                                                            <Icon
                                                                name={star <= data.rating ? 'star' : 'star-outline'}
                                                                size={28}
                                                                color={star <= data.rating ? '#f59e0b' : COLORS.border}
                                                            />
                                                        </TouchableOpacity>
                                                    ))}
                                                </View>
                                                {data.rating > 0 && (
                                                    <Text style={styles.ratingText}>{data.rating}/5</Text>
                                                )}
                                            </View>

                                            {/* Title Input */}
                                            <TextInput
                                                style={styles.reviewInput}
                                                placeholder="Tiêu đề đánh giá"
                                                placeholderTextColor={COLORS.text.muted}
                                                value={data.title}
                                                onChangeText={(text) => setTitle(productId, text)}
                                                maxLength={100}
                                            />

                                            {/* Comment Input */}
                                            <TextInput
                                                style={[styles.reviewInput, styles.reviewTextArea]}
                                                placeholder="Chia sẻ trải nghiệm của bạn..."
                                                placeholderTextColor={COLORS.text.muted}
                                                value={data.comment}
                                                onChangeText={(text) => setComment(productId, text)}
                                                multiline
                                                numberOfLines={3}
                                                textAlignVertical="top"
                                                maxLength={1000}
                                            />

                                            {/* Submit Button */}
                                            <TouchableOpacity
                                                style={[
                                                    styles.submitReviewBtn,
                                                    (!data.rating || !data.title || !data.comment) && styles.submitReviewBtnDisabled,
                                                ]}
                                                onPress={() => handleSubmitReview(productId)}
                                                disabled={isSubmitting || !data.rating || !data.title || !data.comment}
                                                activeOpacity={0.8}
                                            >
                                                {isSubmitting ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <>
                                                        <Icon name="send" size={16} color="#fff" />
                                                        <Text style={styles.submitReviewText}>Gửi đánh giá</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Cancel Button */}
            {order.isCancellable && !isCancelled && (
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={handleCancel}
                        disabled={isUpdating}
                        activeOpacity={0.8}
                    >
                        {isUpdating ? (
                            <ActivityIndicator size="small" color={COLORS.error} />
                        ) : (
                            <>
                                <Icon name="close-circle-outline" size={20} color={COLORS.error} />
                                <Text style={styles.cancelBtnText}>Hủy đơn hàng</Text>
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
    scrollContent: { paddingBottom: SPACING.xxl },

    // ========== HERO HEADER ==========
    heroHeader: {
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.xl + SPACING.sm,
        paddingHorizontal: SPACING.lg,
        position: 'relative',
        overflow: 'hidden',
    },
    heroCircle: {
        position: 'absolute',
        borderRadius: 999,
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    heroCircle1: {
        width: 150,
        height: 150,
        top: -30,
        right: -30,
    },
    heroCircle2: {
        width: 100,
        height: 100,
        bottom: -20,
        left: -20,
    },
    heroContent: {
        alignItems: 'center',
    },
    heroIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    heroStatusLabel: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        color: '#fff',
        marginBottom: SPACING.xs,
    },
    heroDescription: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    heroMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs + 2,
        borderRadius: BORDER_RADIUS.full,
    },
    heroMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    heroMetaText: {
        fontSize: FONT_SIZE.xs,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    heroMetaDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: SPACING.sm,
    },

    // ========== TIMELINE ==========
    cancelledBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.error + '08',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.error + '20',
        gap: SPACING.md,
    },
    cancelledIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.error,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelledInfo: {
        flex: 1,
    },
    cancelledTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.error,
    },
    cancelledSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.muted,
        marginTop: 2,
    },
    timeline: {
        marginTop: SPACING.sm,
    },
    timelineStep: {
        flexDirection: 'row',
    },
    timelineIndicator: {
        alignItems: 'center',
        width: 40,
    },
    timelineDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.divider,
        borderWidth: 0,
        borderColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineDotCurrent: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    timelineDotPulse: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineDotInactive: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.text.muted,
        opacity: 0.4,
    },
    timelineLineContainer: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 2,
    },
    timelineLine: {
        width: 2.5,
        height: 30,
        backgroundColor: COLORS.divider,
        borderRadius: 1.25,
    },
    timelineContent: {
        flex: 1,
        marginLeft: SPACING.md,
        paddingBottom: SPACING.lg,
        justifyContent: 'center',
    },
    timelineLabel: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.muted,
        fontWeight: '500',
    },
    timelineLabelActive: {
        color: COLORS.text.primary,
        fontWeight: '600',
    },
    timelineDescription: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
        marginTop: 2,
    },

    // ========== SECTIONS ==========
    section: {
        backgroundColor: COLORS.surface,
        marginTop: SPACING.sm,
        padding: SPACING.md,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
    },

    // ========== ITEMS ==========
    itemRow: {
        flexDirection: 'row',
        paddingVertical: SPACING.sm + 2,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    itemImage: {
        width: 64,
        height: 64,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.divider,
    },
    itemInfo: { flex: 1, marginLeft: SPACING.md },
    itemName: { fontSize: FONT_SIZE.md, color: COLORS.text.primary, fontWeight: '500', lineHeight: 20 },
    itemVariationBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.divider,
        borderRadius: BORDER_RADIUS.sm,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        marginTop: 4,
    },
    itemVariation: { fontSize: FONT_SIZE.xs, color: COLORS.text.secondary },
    itemPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: SPACING.sm,
        gap: SPACING.md,
    },
    itemPrice: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary },
    itemQty: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.muted,
        backgroundColor: COLORS.divider,
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: BORDER_RADIUS.sm,
    },
    itemSubtotal: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.error,
        marginLeft: 'auto',
    },

    // ========== ADDRESS ==========
    addressCard: {
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
    },
    addressTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.xs,
    },
    addressName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text.primary },
    addressDivider: {
        width: 1,
        height: 14,
        backgroundColor: COLORS.border,
        marginHorizontal: 4,
    },
    addressPhone: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary },
    addressText: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary, lineHeight: 20 },

    // ========== PAYMENT ==========
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    paymentLabel: { fontSize: FONT_SIZE.md, color: COLORS.text.secondary },
    paymentValue: { fontSize: FONT_SIZE.md, fontWeight: '600', color: COLORS.text.primary },
    paymentStatusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.full,
    },
    paymentStatusText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },

    // ========== SUMMARY ==========
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    summaryLabel: { fontSize: FONT_SIZE.md, color: COLORS.text.secondary },
    summaryValue: { fontSize: FONT_SIZE.md, fontWeight: '500', color: COLORS.text.primary },
    summaryFreeShip: { fontSize: FONT_SIZE.md, fontWeight: '500', color: COLORS.success },
    discountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    discountLabel: { fontSize: FONT_SIZE.md, color: COLORS.success },
    discountValue: { fontSize: FONT_SIZE.md, fontWeight: '500', color: COLORS.success },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: SPACING.md,
        marginTop: SPACING.xs,
        marginBottom: 0,
    },
    totalLabel: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text.primary },
    totalValue: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.error },

    // ========== NOTES ==========
    notesCard: {
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        borderLeftWidth: 3,
        borderLeftColor: COLORS.warning,
    },
    notesText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.secondary,
        lineHeight: 22,
    },

    // ========== BOTTOM BAR ==========
    bottomBar: {
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        paddingBottom: SPACING.lg,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    cancelBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.error,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        gap: SPACING.sm,
        backgroundColor: COLORS.error + '08',
    },
    cancelBtnText: {
        color: COLORS.error,
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },

    // ========== REVIEWS ==========
    reviewSectionSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        marginBottom: SPACING.md,
    },
    reviewItemCard: {
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    reviewProduct: {
        flexDirection: 'row',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    reviewProductImage: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.sm,
        backgroundColor: COLORS.divider,
    },
    reviewProductInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    reviewProductName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: 2,
    },
    reviewProductVariation: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
    },
    reviewedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success + '10',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.sm,
        gap: SPACING.sm,
    },
    reviewedText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '500',
        color: COLORS.success,
    },
    reviewForm: {
        gap: SPACING.md,
    },
    starRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    starLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '500',
        color: COLORS.text.primary,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    starButton: {
        padding: 4,
    },
    ratingText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: '#f59e0b',
        marginLeft: 'auto',
    },
    reviewInput: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 10, // Fixed height for title
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
    },
    reviewTextArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingTop: SPACING.sm, // Padding for multiline
    },
    submitReviewBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: SPACING.md,
        gap: SPACING.sm,
    },
    submitReviewBtnDisabled: {
        backgroundColor: COLORS.border,
        opacity: 0.7,
    },
    submitReviewText: {
        color: '#fff',
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
});

export default OrderDetailScreen;
