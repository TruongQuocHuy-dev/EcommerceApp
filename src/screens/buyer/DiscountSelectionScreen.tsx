import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    ScrollView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import api from '../../api/client';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { applyDiscount, removeDiscount, fetchCart } from '../../store/cartSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type DiscountNavProp = NativeStackNavigationProp<RootStackParamList>;

const VoucherTicket = ({
    discount,
    title,
    type,
    onRemove,
    color,
    icon,
    selected
}: {
    discount: any,
    title: string,
    type: 'shop' | 'system' | 'freeship',
    onRemove: () => void,
    color: string,
    icon: string,
    selected?: boolean
}) => {
    if (!discount?.code) {
        return (
            <View style={[styles.ticketContainer, styles.ticketEmpty]}>
                <View style={[styles.ticketLeft, { backgroundColor: '#e0e0e0' }]}>
                    <Icon name={icon} size={32} color={COLORS.surface} />
                </View>
                <View style={styles.ticketRight}>
                    <Text style={styles.ticketTitleEmpty}>{title}</Text>
                    <Text style={styles.ticketDescEmpty}>Chưa xác định</Text>
                </View>
            </View>
        );
    }

    const getDiscountText = () => {
        if (discount.type === 'freeship') return 'Miễn phí vận chuyển';
        if (discount.type === 'percentage') return `Giảm ${discount.value}%`;
        return `Giảm $${(discount.value || 0).toFixed(2)}`;
    };

    const getTypeLabel = () => {
        if (type === 'freeship') return 'Freeship';
        if (type === 'shop') return 'Shop';
        return 'Hệ thống';
    };

    return (
        <TouchableOpacity
            style={[styles.ticketContainer, selected && { borderColor: color, borderWidth: 1 }]}
            onPress={onRemove}
            activeOpacity={0.8}
        >
            {/* Left side: branding/color */}
            <View style={[styles.ticketLeft, { backgroundColor: color }]}>
                <Icon name={icon} size={32} color="#fff" />
                <Text style={styles.ticketLeftText}>{getTypeLabel()}</Text>
            </View>

            {/* Right side: details */}
            <View style={styles.ticketRight}>
                <View style={styles.ticketDetails}>
                    <Text style={styles.ticketCode}>{discount.code}</Text>
                    <Text style={styles.ticketAmount}>{getDiscountText()}</Text>
                    <Text style={styles.ticketExpiry}>
                        Đơn tối thiểu: ${discount.minOrderValue || 0}
                    </Text>
                </View>

                {/* Check / Remove action */}
                <View style={styles.ticketAction}>
                    <Icon
                        name={selected ? "check-circle" : "circle-outline"}
                        size={24}
                        color={selected ? color : COLORS.text.muted}
                    />
                </View>
            </View>

            {/* Ticket Cutouts */}
            <View style={[styles.cutout, styles.cutoutTop]} />
            <View style={[styles.cutout, styles.cutoutBottom]} />
            <View style={styles.dashedLineContainer}>
                <View style={styles.dashedLine} />
            </View>
        </TouchableOpacity>
    );
};

const DiscountSelectionScreen = () => {
    const navigation = useNavigation<DiscountNavProp>();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();

    const { shopDiscount, systemDiscount, freeshippingDiscount, isLoading } = useAppSelector((state) => state.cart);

    const [code, setCode] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [availableDiscounts, setAvailableDiscounts] = useState<any[]>([]);
    const [isLoadingDiscounts, setIsLoadingDiscounts] = useState(true);

    // Separate selected states: freeship slot + regular system slot + shop slot
    const [selectedFreeship, setSelectedFreeship] = useState<any>(
        freeshippingDiscount?.code ? freeshippingDiscount : null
    );
    const [selectedSystemDiscount, setSelectedSystemDiscount] = useState<any>(
        systemDiscount?.code ? systemDiscount : null
    );
    const [selectedShopDiscount, setSelectedShopDiscount] = useState<any>(shopDiscount);

    useEffect(() => {
        setSelectedFreeship(freeshippingDiscount?.code ? freeshippingDiscount : null);
        setSelectedSystemDiscount(systemDiscount?.code ? systemDiscount : null);
        setSelectedShopDiscount(shopDiscount);
    }, [shopDiscount, systemDiscount, freeshippingDiscount]);

    useEffect(() => {
        const fetchAvailableDiscounts = async () => {
            try {
                const res = await api.get('/discounts/available');
                setAvailableDiscounts(res.data.data.discounts);
            } catch (err) {
                console.log('Error fetching discounts:', err);
            } finally {
                setIsLoadingDiscounts(false);
            }
        };
        fetchAvailableDiscounts();
    }, []);

    const handleApplyTextCode = async (discountCode: string) => {
        if (!discountCode.trim()) return;
        setIsApplying(true);
        try {
            await dispatch(applyDiscount(discountCode)).unwrap();
            dispatch(fetchCart());
            setCode('');
            Alert.alert('Thành công', 'Đã áp dụng mã giảm giá');
        } catch (err: any) {
            Alert.alert('Lỗi', err || 'Mã giảm giá không hợp lệ');
        } finally {
            setIsApplying(false);
        }
    };

    const handleSelectDiscount = (discount: any) => {
        if (discount.type === 'freeship') {
            // Freeship is its own separate slot
            if (selectedFreeship?.code === discount.code) {
                setSelectedFreeship(null);
            } else {
                setSelectedFreeship({ code: discount.code, type: 'freeship', amount: 0, scope: 'system' });
            }
        } else if (discount.scope === 'system') {
            if (selectedSystemDiscount?.code === discount.code) {
                setSelectedSystemDiscount(null);
            } else {
                setSelectedSystemDiscount({ code: discount.code, type: discount.type, amount: discount.value, scope: 'system' });
            }
        } else {
            if (selectedShopDiscount?.code === discount.code) {
                setSelectedShopDiscount(null);
            } else {
                setSelectedShopDiscount({ code: discount.code, type: discount.type, amount: discount.value, scope: 'shop' });
            }
        }
    };

    const handleConfirm = async () => {
        setIsApplying(true);
        try {
            // Remove current discounts if they changed
            if (freeshippingDiscount && selectedFreeship?.code !== freeshippingDiscount.code) {
                await dispatch(removeDiscount('freeship')).unwrap();
            }
            if (systemDiscount && selectedSystemDiscount?.code !== systemDiscount?.code) {
                await dispatch(removeDiscount('system')).unwrap();
            }
            if (shopDiscount && (!selectedShopDiscount || selectedShopDiscount.code !== shopDiscount.code)) {
                await dispatch(removeDiscount('shop')).unwrap();
            }

            // Apply freeship (goes into its own freeshipping slot)
            if (selectedFreeship && selectedFreeship.code !== freeshippingDiscount?.code) {
                await dispatch(applyDiscount(selectedFreeship.code)).unwrap();
            }
            // Apply regular system discount
            if (selectedSystemDiscount && selectedSystemDiscount.code !== systemDiscount?.code) {
                await dispatch(applyDiscount(selectedSystemDiscount.code)).unwrap();
            }
            // Apply shop discount
            if (selectedShopDiscount && selectedShopDiscount.code !== shopDiscount?.code) {
                await dispatch(applyDiscount(selectedShopDiscount.code)).unwrap();
            }

            dispatch(fetchCart());
            navigation.goBack();
        } catch (err: any) {
            Alert.alert('Lỗi', err || 'Có lỗi khi áp dụng mã. Vui lòng thử lại.');
        } finally {
            setIsApplying(false);
        }
    };

    const freeshipsDiscounts = availableDiscounts.filter(d => d.type === 'freeship');
    const regularSystemDiscounts = availableDiscounts.filter(d => d.scope === 'system' && d.type !== 'freeship');
    const shopDiscounts = availableDiscounts.filter(d => d.scope === 'shop');

    const totalSelected = (selectedFreeship?.code ? 1 : 0) + (selectedSystemDiscount?.code ? 1 : 0) + (selectedShopDiscount?.code ? 1 : 0);

    return (
        <SafeAreaView style={styles.container}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chọn Voucher</Text>
                <TouchableOpacity style={styles.helpBtn}>
                    <Text style={styles.helpText}>Hỗ trợ</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xl }}>
                {/* INPUT SECTION */}
                <View style={styles.inputSection}>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Mã Voucher</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Nhập mã voucher tại đây"
                                value={code}
                                onChangeText={setCode}
                                autoCapitalize="characters"
                            />
                            <TouchableOpacity
                                style={[styles.applyBtn, !code.trim() && styles.applyBtnDisabled]}
                                onPress={() => handleApplyTextCode(code)}
                                disabled={!code.trim() || isApplying}
                            >
                                {isApplying ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={[styles.applyBtnText, !code.trim() && styles.applyBtnTextDisabled]}>ÁP DỤNG</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* VOUCHER LIST */}
                <View style={styles.listSection}>
                    {/* FREESHIP section - separate slot */}
                    <Text style={styles.sectionTitle}>MÃ MIỈN PHÍ VẬ N CHUYỂN</Text>
                    <Text style={styles.sectionSubtitle}>Có thể chọn 1 mã freeship (độc lập với mã giảm giá)</Text>

                    <View style={styles.spacer} />

                    {isLoadingDiscounts ? (
                        <ActivityIndicator color={COLORS.primary} size="small" />
                    ) : freeshipsDiscounts.length > 0 ? (
                        freeshipsDiscounts.map((discount) => (
                            <View key={discount.id} style={{ marginBottom: SPACING.md }}>
                                <VoucherTicket
                                    title={discount.name}
                                    type="freeship"
                                    discount={discount}
                                    onRemove={() => handleSelectDiscount(discount)}
                                    color="#26aa69"
                                    icon="truck-fast-outline"
                                    selected={selectedFreeship?.code === discount.code}
                                />
                            </View>
                        ))
                    ) : (
                        <Text style={styles.ticketDescEmpty}>Không có mã freeship khả dụng</Text>
                    )}

                    <View style={styles.spacer} />

                    {/* REGULAR SYSTEM discount section */}
                    <Text style={styles.sectionTitle}>MÃ GIẢM GIÁ HỆ THỐNG</Text>
                    <Text style={styles.sectionSubtitle}>Có thể chọn 1 mã giảm giá hệ thống</Text>

                    <View style={styles.spacer} />

                    {isLoadingDiscounts ? (
                        <ActivityIndicator color={COLORS.primary} size="small" />
                    ) : regularSystemDiscounts.length > 0 ? (
                        regularSystemDiscounts.map((discount) => (
                            <View key={discount.id} style={{ marginBottom: SPACING.md }}>
                                <VoucherTicket
                                    title={discount.name}
                                    type="system"
                                    discount={discount}
                                    onRemove={() => handleSelectDiscount(discount)}
                                    color="#1e88e5"
                                    icon="tag-outline"
                                    selected={selectedSystemDiscount?.code === discount.code}
                                />
                            </View>
                        ))
                    ) : (
                        <Text style={styles.ticketDescEmpty}>Không có mã hệ thống khả dụng</Text>
                    )}

                    <View style={styles.spacer} />

                    {/* SHOP discount section */}
                    <Text style={styles.sectionTitle}>VOUCHER TỪ SHOP</Text>
                    <Text style={styles.sectionSubtitle}>Có thể chọn 1 mã giảm giá của Shop</Text>

                    <View style={styles.spacer} />

                    {isLoadingDiscounts ? (
                        <ActivityIndicator color={COLORS.primary} size="small" />
                    ) : shopDiscounts.length > 0 ? (
                        shopDiscounts.map((discount) => (
                            <View key={discount.id} style={{ marginBottom: SPACING.md }}>
                                <VoucherTicket
                                    title={discount.name}
                                    type="shop"
                                    discount={discount}
                                    onRemove={() => handleSelectDiscount(discount)}
                                    color="#ee4d2d"
                                    icon="storefront-outline"
                                    selected={selectedShopDiscount?.code === discount.code}
                                />
                            </View>
                        ))
                    ) : (
                        <Text style={styles.ticketDescEmpty}>Không có voucher shop khả dụng</Text>
                    )}
                </View>
            </ScrollView>

            {/* BOTTOM BAR - with safe area insets to avoid device nav bar */}
            <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
                <View style={styles.bottomInfo}>
                    <Text style={styles.bottomLabel}>Đã chọn:</Text>
                    <Text style={styles.bottomValue}>{totalSelected} Voucher</Text>
                </View>
                <TouchableOpacity
                    style={styles.confirmBtn}
                    onPress={handleConfirm}
                    disabled={isApplying}
                >
                    {isApplying ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.confirmBtnText}>ĐỒNG Ý</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f1f1' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: SPACING.md,
        paddingVertical: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        zIndex: 10,
    },
    backBtn: { padding: SPACING.xs, marginRight: SPACING.sm },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: COLORS.text.primary },
    helpBtn: { padding: SPACING.xs },
    helpText: { fontSize: 14, color: COLORS.text.secondary },

    content: { flex: 1 },

    inputSection: {
        backgroundColor: '#fff',
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    inputWrapper: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: BORDER_RADIUS.sm,
        padding: SPACING.sm,
    },
    inputLabel: {
        fontSize: 12,
        color: COLORS.text.secondary,
        marginBottom: 4,
        fontWeight: '500',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text.primary,
        paddingVertical: 4,
        paddingHorizontal: 0,
    },
    applyBtn: {
        backgroundColor: '#ee4d2d',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    applyBtnDisabled: {
        backgroundColor: '#e0e0e0',
    },
    applyBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    applyBtnTextDisabled: {
        color: '#999',
    },

    listSection: {
        padding: SPACING.md,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.text.secondary,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: COLORS.text.muted,
        marginTop: 2,
        marginBottom: SPACING.md,
    },
    spacer: {
        height: 12,
    },

    /* Ticket Styles */
    ticketContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        position: 'relative',
        height: 100,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    ticketEmpty: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        elevation: 0,
        backgroundColor: '#fafafa',
    },
    ticketLeft: {
        width: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ticketLeftText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    ticketRight: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        paddingLeft: SPACING.md,
    },
    ticketDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    ticketCode: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginBottom: 4,
    },
    ticketAmount: {
        fontSize: 14,
        color: '#ee4d2d',
        fontWeight: '600',
        marginBottom: 4,
    },
    ticketExpiry: {
        fontSize: 11,
        color: COLORS.text.secondary,
    },
    ticketTitleEmpty: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text.secondary,
        marginBottom: 4,
    },
    ticketDescEmpty: {
        fontSize: 12,
        color: COLORS.text.muted,
    },
    ticketAction: {
        paddingLeft: SPACING.sm,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        marginLeft: SPACING.xs,
        width: 30, // Keep space for circle icon
    },
    removeBtn: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeText: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: '500',
    },

    /* Cutouts to make it look like a real ticket */
    cutout: {
        position: 'absolute',
        left: 93, // Center it over the line (100 width - 7 radius)
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#f1f1f1',
    },
    cutoutTop: {
        top: -7,
    },
    cutoutBottom: {
        bottom: -7,
    },
    dashedLineContainer: {
        position: 'absolute',
        top: 7,
        bottom: 7,
        left: 100,
        width: 1,
        overflow: 'hidden',
    },
    dashedLine: {
        height: '100%',
        width: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },

    /* Bottom Bar */
    bottomBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingHorizontal: SPACING.md,
        paddingVertical: 12,
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    bottomInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    bottomLabel: {
        fontSize: 14,
        color: COLORS.text.secondary,
        marginRight: SPACING.sm,
    },
    bottomValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ee4d2d',
    },
    confirmBtn: {
        backgroundColor: '#ee4d2d',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 4,
    },
    confirmBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default DiscountSelectionScreen;
