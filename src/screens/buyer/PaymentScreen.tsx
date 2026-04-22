import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch } from '../../store/hooks';
import { createMomoPayment, createVnpayPayment, checkPaymentStatus } from '../../store/orderSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type PaymentRouteProp = RouteProp<RootStackParamList, 'Payment'>;
type PaymentNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type PaymentState = 'processing' | 'success' | 'failed';

const PaymentScreen = () => {
    const navigation = useNavigation<PaymentNavigationProp>();
    const route = useRoute<PaymentRouteProp>();
    const dispatch = useAppDispatch();

    const { orderId, amount, paymentMethod } = route.params;

    const [paymentState, setPaymentState] = useState<PaymentState>(
        paymentMethod === 'COD' ? 'success' : 'processing'
    );
    const [statusMessage, setStatusMessage] = useState('');
    const [isPolling, setIsPolling] = useState(false);

    // Handle online payment (MoMo / VNPay)
    const initiateOnlinePayment = useCallback(async () => {
        try {
            setStatusMessage('Đang tạo liên kết thanh toán...');

            let result: any;
            if (paymentMethod === 'momo') {
                result = await dispatch(createMomoPayment(orderId)).unwrap();
            } else if (paymentMethod === 'vnpay') {
                result = await dispatch(createVnpayPayment({ orderId })).unwrap();
            }

            const payUrl = result?.payUrl || result?.payment?.payUrl;
            if (payUrl) {
                setStatusMessage('Đang chuyển đến trang thanh toán...');
                await Linking.openURL(payUrl);
                // Start polling for payment status
                setIsPolling(true);
                setStatusMessage('Đang chờ thanh toán...');
            } else {
                setPaymentState('failed');
                setStatusMessage('Không thể tạo liên kết thanh toán');
            }
        } catch (err: any) {
            setPaymentState('failed');
            setStatusMessage(err || 'Lỗi thanh toán. Vui lòng thử lại.');
        }
    }, [dispatch, orderId, paymentMethod]);

    useEffect(() => {
        if (paymentMethod !== 'COD') {
            initiateOnlinePayment();
        }
    }, [initiateOnlinePayment, paymentMethod]);

    // Poll payment status
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        let attempts = 0;
        const MAX_ATTEMPTS = 60; // 5 minutes max

        if (isPolling) {
            interval = setInterval(async () => {
                attempts++;
                try {
                    const result = await dispatch(checkPaymentStatus(orderId)).unwrap();
                    const status = result?.payment?.status || result?.status;

                    if (status === 'paid' || status === 'completed') {
                        setPaymentState('success');
                        setIsPolling(false);
                        clearInterval(interval);
                    } else if (status === 'failed' || status === 'cancelled') {
                        setPaymentState('failed');
                        setStatusMessage('Thanh toán thất bại hoặc bị hủy');
                        setIsPolling(false);
                        clearInterval(interval);
                    }
                } catch (e) {
                    // Continue polling
                }

                if (attempts >= MAX_ATTEMPTS) {
                    setPaymentState('failed');
                    setStatusMessage('Hết thời gian chờ thanh toán');
                    setIsPolling(false);
                    clearInterval(interval);
                }
            }, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPolling, dispatch, orderId]);

    const handleViewOrder = () => {
        navigation.replace('OrderDetail', { orderId });
    };

    const handleRetry = () => {
        setPaymentState('processing');
        setStatusMessage('');
        initiateOnlinePayment();
    };

    const handleGoHome = () => {
        navigation.popToTop();
    };

    // ===== Render States =====

    const renderProcessing = () => (
        <View style={styles.stateContainer}>
            <View style={styles.iconCircle}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
            <Text style={styles.stateTitle}>Đang xử lý thanh toán</Text>
            <Text style={styles.stateMessage}>
                {statusMessage || 'Vui lòng không tắt ứng dụng...'}
            </Text>
            <Text style={styles.amountText}>${amount.toFixed(2)}</Text>

            <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                    setIsPolling(true);
                    setStatusMessage('Đang kiểm tra trạng thái thanh toán...');
                }}
            >
                <Icon name="refresh" size={18} color={COLORS.primary} />
                <Text style={styles.secondaryBtnText}>Kiểm tra trạng thái</Text>
            </TouchableOpacity>
        </View>
    );

    const renderSuccess = () => (
        <View style={styles.stateContainer}>
            <View style={[styles.iconCircle, styles.successCircle]}>
                <Icon name="check-circle" size={60} color={COLORS.success} />
            </View>
            <Text style={styles.stateTitle}>
                {paymentMethod === 'COD' ? 'Đặt hàng thành công!' : 'Thanh toán thành công!'}
            </Text>
            <Text style={styles.stateMessage}>
                {paymentMethod === 'COD'
                    ? 'Đơn hàng của bạn đã được tạo. Thanh toán khi nhận hàng.'
                    : 'Thanh toán đã được xác nhận thành công.'}
            </Text>
            <Text style={styles.amountText}>${amount.toFixed(2)}</Text>

            <View style={styles.paymentMethodBadge}>
                <Icon
                    name={paymentMethod === 'COD' ? 'cash' : paymentMethod === 'momo' ? 'wallet' : 'credit-card'}
                    size={16}
                    color={COLORS.text.secondary}
                />
                <Text style={styles.paymentMethodText}>
                    {paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng'
                        : paymentMethod === 'momo' ? 'Ví MoMo'
                            : 'VNPay'}
                </Text>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleViewOrder}>
                <Icon name="package-variant" size={20} color={COLORS.text.inverse} />
                <Text style={styles.primaryBtnText}>Xem đơn hàng</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoHome}>
                <Icon name="home" size={18} color={COLORS.primary} />
                <Text style={styles.secondaryBtnText}>Về trang chủ</Text>
            </TouchableOpacity>
        </View>
    );

    const renderFailed = () => (
        <View style={styles.stateContainer}>
            <View style={[styles.iconCircle, styles.failedCircle]}>
                <Icon name="close-circle" size={60} color={COLORS.error} />
            </View>
            <Text style={styles.stateTitle}>Thanh toán thất bại</Text>
            <Text style={styles.stateMessage}>
                {statusMessage || 'Đã xảy ra lỗi khi xử lý thanh toán.'}
            </Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry}>
                <Icon name="refresh" size={20} color={COLORS.text.inverse} />
                <Text style={styles.primaryBtnText}>Thử lại</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn} onPress={handleViewOrder}>
                <Icon name="package-variant" size={18} color={COLORS.primary} />
                <Text style={styles.secondaryBtnText}>Xem đơn hàng</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {paymentState === 'processing' && renderProcessing()}
            {paymentState === 'success' && renderSuccess()}
            {paymentState === 'failed' && renderFailed()}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    stateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    successCircle: {
        backgroundColor: COLORS.success + '15',
    },
    failedCircle: {
        backgroundColor: COLORS.error + '15',
    },
    stateTitle: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
        textAlign: 'center',
    },
    stateMessage: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.md,
    },
    amountText: {
        fontSize: 36,
        fontWeight: '800',
        color: COLORS.primary,
        marginBottom: SPACING.lg,
    },
    paymentMethodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        gap: SPACING.xs,
        marginBottom: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    paymentMethodText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        fontWeight: '500',
    },
    primaryBtn: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
        width: '100%',
        marginBottom: SPACING.md,
    },
    primaryBtnText: {
        color: COLORS.text.inverse,
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
    secondaryBtn: {
        flexDirection: 'row',
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        width: '100%',
    },
    secondaryBtnText: {
        color: COLORS.primary,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
});

export default PaymentScreen;
