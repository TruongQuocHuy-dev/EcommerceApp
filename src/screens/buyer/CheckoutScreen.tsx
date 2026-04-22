import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createOrder, fetchDefaultAddress } from '../../store/orderSlice';
import { fetchCart, clearCart } from '../../store/cartSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type CheckoutNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AddressForm {
    name: string;
    phone: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
}

const PAYMENT_OPTIONS = [
    { id: 'COD', label: 'Thanh toán khi nhận hàng', icon: 'cash', desc: 'Trả tiền mặt khi nhận hàng' },
    { id: 'momo', label: 'Ví MoMo', icon: 'wallet', desc: 'Thanh toán qua ví điện tử MoMo' },
    { id: 'vnpay', label: 'VNPay', icon: 'credit-card', desc: 'Thanh toán qua VNPay (ATM/Visa/MasterCard)' },
];

const BASE_SHIPPING_FEE = 10.0;

const CheckoutScreen = () => {
    const navigation = useNavigation<CheckoutNavigationProp>();
    const dispatch = useAppDispatch();
    const { items, totalAmount, discountedTotal, shopDiscount, systemDiscount, freeshippingDiscount } = useAppSelector((state) => state.cart);
    const { isCreating, error } = useAppSelector((state) => state.order);

    const [selectedAddress, setSelectedAddress] = useState<any>(null);
    const [addressLoaded, setAddressLoaded] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [notes, setNotes] = useState('');

    const hasDiscount = !!(shopDiscount?.code || systemDiscount?.code || freeshippingDiscount?.code);
    const isFreeShip = freeshippingDiscount?.type === 'freeship' || shopDiscount?.type === 'freeship' || systemDiscount?.type === 'freeship';
    const productDiscountAmount = (shopDiscount?.amount || 0) + (systemDiscount?.amount || 0);
    const shippingFee = isFreeShip ? 0 : BASE_SHIPPING_FEE;
    const finalTotal = discountedTotal + shippingFee;

    let savingsText = '';
    if (productDiscountAmount > 0 && isFreeShip) {
        savingsText = `- $${productDiscountAmount.toFixed(2)} & Freeship`;
    } else if (productDiscountAmount > 0) {
        savingsText = `- $${productDiscountAmount.toFixed(2)}`;
    } else if (isFreeShip) {
        savingsText = 'Miễn phí vận chuyển';
    }

    // Load cart and default address on mount
    useEffect(() => {
        dispatch(fetchCart());

        const loadDefaultAddress = async () => {
            try {
                const result = await dispatch(fetchDefaultAddress()).unwrap();
                if (result?.address) {
                    setSelectedAddress(result.address);
                }
            } catch (e) {
                // No default address
            } finally {
                setAddressLoaded(true);
            }
        };
        loadDefaultAddress();
    }, [dispatch]);

    const validateForm = (): boolean => {
        if (!selectedAddress) {
            Alert.alert('Lỗi', 'Vui lòng chọn địa chỉ giao hàng');
            return false;
        }
        return true;
    };

    const handlePlaceOrder = async () => {
        if (!validateForm()) return;

        try {
            const result = await dispatch(
                createOrder({
                    shippingAddress: {
                        name: selectedAddress.name,
                        phone: selectedAddress.phone,
                        address: selectedAddress.address,
                        city: selectedAddress.city,
                        province: selectedAddress.province || undefined,
                        postalCode: selectedAddress.postalCode || undefined,
                    },
                    paymentMethod,
                    notes: notes.trim() || undefined,
                })
            ).unwrap();

            // Clear cart after successful order
            dispatch(clearCart());

            const order = result.order;

            if (paymentMethod === 'COD') {
                navigation.replace('Payment', {
                    orderId: order.id,
                    amount: finalTotal,
                    paymentMethod: 'COD',
                });
            } else {
                navigation.replace('Payment', {
                    orderId: order.id,
                    amount: finalTotal,
                    paymentMethod,
                });
            }
        } catch (err: any) {
            Alert.alert('Lỗi đặt hàng', err || 'Không thể tạo đơn hàng. Vui lòng thử lại.');
        }
    };

    if (!addressLoaded) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Đang tải...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (items.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Icon name="cart-off" size={80} color={COLORS.text.muted} />
                    <Text style={[styles.loadingText, { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text.primary, marginTop: SPACING.md }]}>
                        Giỏ hàng trống
                    </Text>
                    <Text style={styles.loadingText}>Hãy thêm sản phẩm trước khi thanh toán</Text>
                    <TouchableOpacity
                        style={{ marginTop: SPACING.lg, backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg }}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={{ color: COLORS.text.inverse, fontWeight: '600', fontSize: FONT_SIZE.md }}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Order Items Summary */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="package-variant" size={20} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Sản phẩm ({items.length})</Text>
                        </View>
                        {items.map((item: any, idx: number) => (
                            <View key={item.id || item._id || idx} style={styles.orderItem}>
                                <Image
                                    source={{ uri: item.product?.image || item.product?.images?.[0] || 'https://via.placeholder.com/60' }}
                                    style={styles.itemImage}
                                />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={2}>
                                        {item.product?.name || item.name}
                                    </Text>
                                    {item.variationText && (
                                        <Text style={styles.itemVariation}>{item.variationText}</Text>
                                    )}
                                    <View style={styles.itemPriceRow}>
                                        <Text style={styles.itemPrice}>
                                            ${item.price?.toFixed(2)}
                                        </Text>
                                        <Text style={styles.itemQty}>x{item.quantity}</Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Shipping Address */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="map-marker" size={20} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.addressBox}
                            onPress={() => navigation.navigate('AddressList', {
                                isSelectionMode: true,
                                onSelectAddress: (addr) => setSelectedAddress(addr)
                            })}
                        >
                            {selectedAddress ? (
                                <View style={styles.addressContent}>
                                    <View style={styles.addressRow}>
                                        <Text style={styles.addressName}>{selectedAddress.name}</Text>
                                        <Text style={styles.addressPhone}>{selectedAddress.phone}</Text>
                                    </View>
                                    <Text style={styles.addressText}>{selectedAddress.address}</Text>
                                    <Text style={styles.addressText}>
                                        {selectedAddress.city}{selectedAddress.province ? `, ${selectedAddress.province}` : ''}
                                    </Text>
                                </View>
                            ) : (
                                <View style={styles.addressContent}>
                                    <Text style={styles.addressPlaceholder}>Vui lòng chọn địa chỉ giao hàng</Text>
                                </View>
                            )}
                            <Icon name="chevron-right" size={24} color={COLORS.text.muted} />
                        </TouchableOpacity>
                    </View>

                    {/* Payment Method */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="credit-card" size={20} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
                        </View>
                        {PAYMENT_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.id}
                                style={[
                                    styles.paymentOption,
                                    paymentMethod === opt.id && styles.paymentOptionSelected,
                                ]}
                                onPress={() => setPaymentMethod(opt.id)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.radioOuter,
                                    paymentMethod === opt.id && styles.radioOuterSelected,
                                ]}>
                                    {paymentMethod === opt.id && <View style={styles.radioInner} />}
                                </View>
                                <Icon
                                    name={opt.icon}
                                    size={24}
                                    color={paymentMethod === opt.id ? COLORS.primary : COLORS.text.secondary}
                                    style={styles.paymentIcon}
                                />
                                <View style={styles.paymentInfo}>
                                    <Text style={[
                                        styles.paymentLabel,
                                        paymentMethod === opt.id && styles.paymentLabelSelected,
                                    ]}>{opt.label}</Text>
                                    <Text style={styles.paymentDesc}>{opt.desc}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Vouchers Applied (read-only - select from Cart) */}
                    {hasDiscount && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Icon name="ticket-percent" size={20} color="#ee4d2d" />
                                <Text style={styles.sectionTitle}>Khuyến mãi đã áp dụng</Text>
                            </View>
                            {shopDiscount?.code && (
                                <View style={styles.voucherChip}>
                                    <Icon name="storefront-outline" size={14} color="#ee4d2d" />
                                    <Text style={styles.voucherChipText}>{shopDiscount.code}</Text>
                                    <Text style={styles.voucherChipSave}>
                                        {shopDiscount.type === 'freeship' ? 'Freeship' : `-$${(shopDiscount.amount || 0).toFixed(2)}`}
                                    </Text>
                                </View>
                            )}
                            {systemDiscount?.code && (
                                <View style={styles.voucherChip}>
                                    <Icon name="tag-outline" size={14} color="#26aa69" />
                                    <Text style={styles.voucherChipText}>{systemDiscount.code}</Text>
                                    <Text style={styles.voucherChipSave}>
                                        {systemDiscount.type === 'freeship' ? 'Freeship' : `-$${(systemDiscount.amount || 0).toFixed(2)}`}
                                    </Text>
                                </View>
                            )}
                            {freeshippingDiscount?.code && (
                                <View style={styles.voucherChip}>
                                    <Icon name="truck-fast-outline" size={14} color="#26aa69" />
                                    <Text style={styles.voucherChipText}>{freeshippingDiscount.code}</Text>
                                    <Text style={styles.voucherChipSave}>Freeship</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Notes */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="note-text" size={20} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Ghi chú</Text>
                        </View>
                        <TextInput
                            style={[styles.input, styles.notesInput]}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Ghi chú cho đơn hàng (tùy chọn)"
                            placeholderTextColor={COLORS.text.muted}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                    </View>
                </ScrollView>

                {/* Bottom Summary & Place Order */}
                <View style={styles.bottomBar}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Tạm tính</Text>
                        <Text style={styles.summaryValue}>${totalAmount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
                        <Text style={styles.summaryValue}>${BASE_SHIPPING_FEE.toFixed(2)}</Text>
                    </View>
                    {shopDiscount?.code && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.discountLabel}>
                                Shop Voucher ({shopDiscount.code})
                            </Text>
                            <Text style={styles.discountValue}>
                                {shopDiscount.type === 'freeship' ? 'Freeship' : `-$${(shopDiscount.amount || 0).toFixed(2)}`}
                            </Text>
                        </View>
                    )}
                    {systemDiscount?.code && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.discountLabel}>
                                Hệ thống Voucher ({systemDiscount.code})
                            </Text>
                            <Text style={styles.discountValue}>
                                {systemDiscount.type === 'freeship' ? 'Freeship' : `-$${(systemDiscount.amount || 0).toFixed(2)}`}
                            </Text>
                        </View>
                    )}
                    {isFreeShip && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.discountLabel}>Giảm phí vận chuyển</Text>
                            <Text style={styles.discountValue}>-${BASE_SHIPPING_FEE.toFixed(2)}</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Tổng cộng</Text>
                        <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.placeOrderBtn, isCreating && styles.btnDisabled]}
                        onPress={handlePlaceOrder}
                        disabled={isCreating}
                        activeOpacity={0.8}
                    >
                        {isCreating ? (
                            <ActivityIndicator size="small" color={COLORS.text.inverse} />
                        ) : (
                            <>
                                <Icon name="check-circle" size={20} color={COLORS.text.inverse} />
                                <Text style={styles.placeOrderText}>Đặt hàng</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: SPACING.md, color: COLORS.text.secondary },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: SPACING.md },

    // Sections
    section: {
        backgroundColor: COLORS.surface,
        marginTop: SPACING.sm,
        padding: SPACING.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
    },

    // Order Items
    orderItem: {
        flexDirection: 'row',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.divider,
    },
    itemInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    itemName: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    itemVariation: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        marginTop: 2,
    },
    itemPriceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.xs,
    },
    itemPrice: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.primary,
    },
    itemQty: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
    },

    // Address selection
    addressBox: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    addressContent: { flex: 1 },
    addressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: SPACING.md },
    addressName: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.text.primary },
    addressPhone: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary },
    addressText: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary, lineHeight: 20 },
    addressPlaceholder: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontStyle: 'italic' },

    // Notes
    input: {
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    notesInput: {
        minHeight: 80,
        paddingTop: SPACING.sm + 2,
    },

    // Payment
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1.5,
        borderColor: COLORS.border,
        marginBottom: SPACING.sm,
    },
    paymentOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '08',
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.text.muted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: COLORS.primary,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    paymentIcon: {
        marginLeft: SPACING.md,
    },
    paymentInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    paymentLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    paymentLabelSelected: {
        color: COLORS.primary,
    },
    paymentDesc: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
        marginTop: 2,
    },

    // Vouchers (read-only chips)
    voucherChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        backgroundColor: COLORS.background,
        borderRadius: BORDER_RADIUS.sm,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs + 2,
        marginBottom: SPACING.xs,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignSelf: 'flex-start',
    },
    voucherChipText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    voucherChipSave: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: '#26aa69',
    },

    // Bottom Bar
    bottomBar: {
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
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    summaryLabel: { color: COLORS.text.secondary, fontSize: FONT_SIZE.md },
    summaryValue: { color: COLORS.text.primary, fontWeight: '500', fontSize: FONT_SIZE.md },
    discountLabel: { color: COLORS.success, fontSize: FONT_SIZE.md },
    discountValue: { color: COLORS.success, fontWeight: '500', fontSize: FONT_SIZE.md },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: SPACING.sm,
        marginTop: SPACING.xs,
        marginBottom: SPACING.md,
    },
    totalLabel: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: COLORS.text.primary },
    totalValue: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.primary },
    placeOrderBtn: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    placeOrderText: {
        color: COLORS.text.inverse,
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
    },
});

export default CheckoutScreen;
