import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
    ScrollView,
    StatusBar,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCart, updateCartItem, removeFromCart, clearCartAsync, addToCart } from '../../store/cartSlice';
import api from '../../api/client';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList, MainTabParamList } from '../../navigation/types';

type CartScreenNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<RootStackParamList, 'Cart'>,
    BottomTabNavigationProp<MainTabParamList>
>;

const formatPrice = (price: number) => {
    return price?.toLocaleString('vi-VN') || '0';
};

// ─────────────────────────────────────────────
// CartItem Component
// ─────────────────────────────────────────────
interface CartItemProps {
    item: any;
    isSelected: boolean;
    onToggleSelect: (itemId: string) => void;
    onUpdateQuantity: (itemId: string, quantity: number) => void;
    onRemove: (itemId: string) => void;
    onEditVariation?: (item: any) => void;
}

const CartItem = ({ item, isSelected, onToggleSelect, onUpdateQuantity, onRemove, onEditVariation }: CartItemProps) => {
    const itemId = item.id || item._id;

    return (
        <View style={styles.cartItem}>
            {/* Checkbox */}
            <TouchableOpacity
                style={styles.checkbox}
                onPress={() => onToggleSelect(itemId)}
                activeOpacity={0.7}
            >
                <View style={[styles.checkboxInner, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Icon name="check" size={14} color="#fff" />}
                </View>
            </TouchableOpacity>

            {/* Product Image */}
            <Image
                source={{ uri: item.product?.image || item.product?.images?.[0] || 'https://via.placeholder.com/80' }}
                style={styles.itemImage}
            />

            {/* Item Details */}
            <View style={styles.itemDetails}>
                <Text style={styles.itemName} numberOfLines={2}>
                    {item.product?.name || item.name}
                </Text>

                {item.variationText && (
                    <TouchableOpacity
                        style={styles.variationBadge}
                        onPress={() => onEditVariation && onEditVariation(item)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.variationText}>{item.variationText}</Text>
                        <Icon name="chevron-down" size={14} color={COLORS.text.secondary} style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                )}

                <View style={styles.itemBottom}>
                    <Text style={styles.itemPrice}>{formatPrice(item.price)}đ</Text>

                    {/* Quantity Controls */}
                    <View style={styles.quantityWrapper}>
                        <TouchableOpacity
                            style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]}
                            onPress={() => {
                                if (item.quantity <= 1) {
                                    Alert.alert(
                                        'Xóa sản phẩm',
                                        'Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?',
                                        [
                                            { text: 'Hủy', style: 'cancel' },
                                            { text: 'Xóa', style: 'destructive', onPress: () => onRemove(itemId) },
                                        ]
                                    );
                                } else {
                                    onUpdateQuantity(itemId, item.quantity - 1);
                                }
                            }}
                        >
                            <Icon
                                name={item.quantity <= 1 ? 'trash-can-outline' : 'minus'}
                                size={14}
                                color={item.quantity <= 1 ? COLORS.error : COLORS.text.primary}
                            />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => onUpdateQuantity(itemId, item.quantity + 1)}
                        >
                            <Icon name="plus" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

// ─────────────────────────────────────────────
// CartScreen Main Component
// ─────────────────────────────────────────────
const CartScreen = () => {
    const navigation = useNavigation<CartScreenNavigationProp>();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { items, totalAmount, discountedTotal, shopDiscount, systemDiscount, freeshippingDiscount, isLoading } = useAppSelector((state) => state.cart);
    const hasDiscount = !!(shopDiscount?.code || systemDiscount?.code || freeshippingDiscount?.code);
    const totalDiscountAmount = (shopDiscount?.amount || 0) + (systemDiscount?.amount || 0);

    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isEditMode, setIsEditMode] = useState(false);

    // Variation Modal State
    const [isVariationModalVisible, setVariationModalVisible] = useState(false);
    const [selectedItemForVariation, setSelectedItemForVariation] = useState<any>(null);
    const [productDetails, setProductDetails] = useState<any>(null);
    const [isFetchingVariations, setIsFetchingVariations] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [isUpdatingVariation, setIsUpdatingVariation] = useState(false);

    // Discount Modal State
    const [isDiscountModalVisible, setDiscountModalVisible] = useState(false);

    // ── Variation handlers ──
    const handleEditVariation = async (item: any) => {
        setSelectedItemForVariation(item);
        setVariationModalVisible(true);
        setIsFetchingVariations(true);
        setProductDetails(null);
        setSelectedOptions({});

        try {
            const response = await api.get(`/products/${item.product.id || item.product._id}`);
            const product = response.data.data.product;
            setProductDetails(product);

            if (product.tierVariations && item.tierIndex) {
                const initialOpts: Record<string, string> = {};
                product.tierVariations.forEach((tier: any, index: number) => {
                    const tierIndexVal = item.tierIndex[index];
                    if (tierIndexVal !== undefined && tier.options[tierIndexVal]) {
                        initialOpts[tier.name] = tier.options[tierIndexVal];
                    } else if (tier.options.length > 0) {
                        initialOpts[tier.name] = tier.options[0];
                    }
                });
                setSelectedOptions(initialOpts);
            } else if (product.tierVariations) {
                const initialOpts: Record<string, string> = {};
                product.tierVariations.forEach((tier: any) => {
                    if (tier.options.length > 0) {
                        initialOpts[tier.name] = tier.options[0];
                    }
                });
                setSelectedOptions(initialOpts);
            }
        } catch (error) {
            Alert.alert('Thông báo', 'Không thể tải thông tin biến thể');
            setVariationModalVisible(false);
        } finally {
            setIsFetchingVariations(false);
        }
    };

    const handleConfirmVariationChange = async () => {
        if (!productDetails || !selectedItemForVariation) return;

        let newSkuId: string | undefined;

        if (productDetails.skus && productDetails.skus.length > 0 && productDetails.tierVariations) {
            const tierIndex = productDetails.tierVariations.map((tier: any) => {
                const selectedOption = selectedOptions[tier.name];
                const optionIndex = tier.options.indexOf(selectedOption);
                return optionIndex >= 0 ? optionIndex : 0;
            });

            const matchingSku = productDetails.skus.find((sku: any) => {
                if (!sku.tierIndex || sku.tierIndex.length !== tierIndex.length) return false;
                return sku.tierIndex.every((val: number, idx: number) => val === tierIndex[idx]);
            });

            if (matchingSku) {
                newSkuId = matchingSku._id;
            } else {
                Alert.alert('Thông báo', 'Không tìm thấy phiên bản này');
                return;
            }
        }

        if (newSkuId === selectedItemForVariation.skuId) {
            setVariationModalVisible(false);
            return;
        }

        setIsUpdatingVariation(true);
        try {
            await dispatch(addToCart({
                productId: productDetails._id || productDetails.id,
                quantity: selectedItemForVariation.quantity,
                skuId: newSkuId
            })).unwrap();

            await dispatch(removeFromCart(selectedItemForVariation.id || selectedItemForVariation._id)).unwrap();

            setVariationModalVisible(false);
        } catch (error: any) {
            Alert.alert('Lỗi', error || 'Không thể cập nhật phân loại');
        } finally {
            setIsUpdatingVariation(false);
        }
    };

    const handleOptionSelect = (tierName: string, option: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            [tierName]: option
        }));
    };

    // ── Cart data ──
    useEffect(() => {
        dispatch(fetchCart());
    }, [dispatch]);

    // Auto-select all items when cart loads
    useEffect(() => {
        if (items.length > 0) {
            const allIds = new Set(items.map((item: any) => item.id || item._id));
            setSelectedItems(allIds);
        }
    }, [items]);

    const toggleSelectItem = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            const allIds = new Set(items.map((item: any) => item.id || item._id));
            setSelectedItems(allIds);
        }
    };

    const isAllSelected = items.length > 0 && selectedItems.size === items.length;

    const handleUpdateQuantity = (itemId: string, quantity: number) => {
        if (quantity < 1) return;
        dispatch(updateCartItem({ itemId, quantity }));
    };

    const handleRemove = (itemId: string) => {
        dispatch(removeFromCart(itemId));
        const newSelected = new Set(selectedItems);
        newSelected.delete(itemId);
        setSelectedItems(newSelected);
    };

    const handleDeleteSelected = () => {
        if (selectedItems.size === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn sản phẩm cần xóa');
            return;
        }

        const count = selectedItems.size;
        const isAll = count === items.length;

        Alert.alert(
            'Xóa sản phẩm',
            isAll
                ? 'Bạn có muốn xóa tất cả sản phẩm khỏi giỏ hàng?'
                : `Bạn có muốn xóa ${count} sản phẩm đã chọn?`,
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa',
                    style: 'destructive',
                    onPress: () => {
                        if (isAll) {
                            dispatch(clearCartAsync());
                        } else {
                            selectedItems.forEach((id) => dispatch(removeFromCart(id)));
                        }
                        setSelectedItems(new Set());
                    },
                },
            ]
        );
    };

    const handleCheckout = () => {
        if (selectedItems.size === 0) {
            Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán');
            return;
        }
        navigation.navigate('Checkout');
    };

    // Calculate selected total
    const selectedTotal = items
        .filter((item: any) => selectedItems.has(item.id || item._id))
        .reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);

    const finalTotal = hasDiscount ? discountedTotal : selectedTotal;

    // ── Group items by shop ──
    const groupedByShop = items.reduce((groups: any, item: any) => {
        const shopName = item.product?.sellerName || 'Shop';
        if (!groups[shopName]) {
            groups[shopName] = [];
        }
        groups[shopName].push(item);
        return groups;
    }, {});

    const shopGroups = Object.entries(groupedByShop).map(([shopName, shopItems]) => ({
        shopName,
        items: shopItems as any[],
    }));

    // ─────────── RENDER ───────────
    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.title}>Giỏ hàng</Text>
                    <Text style={styles.headerCount}>({items.length})</Text>
                </View>
                {items.length > 0 && (
                    <TouchableOpacity onPress={() => setIsEditMode(!isEditMode)}>
                        <Text style={[styles.editBtn, isEditMode && { color: COLORS.primary }]}>
                            {isEditMode ? 'Xong' : 'Sửa'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── Content ── */}
            {items.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                        <Icon name="cart-outline" size={64} color={COLORS.text.muted} />
                    </View>
                    <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
                    <Text style={styles.emptySubtitle}>Hãy khám phá và thêm sản phẩm yêu thích!</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Home')}
                        activeOpacity={0.8}
                    >
                        <Icon name="shopping" size={20} color={COLORS.text.inverse} />
                        <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList
                        data={shopGroups}
                        keyExtractor={(group) => group.shopName}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item: group }) => (
                            <View style={styles.shopGroup}>
                                {/* Shop Header */}
                                <View style={styles.shopHeader}>
                                    <Icon name="storefront-outline" size={18} color={COLORS.text.primary} />
                                    <Text style={styles.shopName}>{group.shopName}</Text>
                                    <Icon name="chevron-right" size={18} color={COLORS.text.muted} />
                                </View>

                                {/* Shop Items */}
                                {group.items.map((item: any, index: number) => (
                                    <View key={item.id || item._id}>
                                        {index > 0 && <View style={styles.separator} />}
                                        <CartItem
                                            item={item}
                                            isSelected={selectedItems.has(item.id || item._id)}
                                            onToggleSelect={toggleSelectItem}
                                            onUpdateQuantity={handleUpdateQuantity}
                                            onRemove={handleRemove}
                                            onEditVariation={handleEditVariation}
                                        />
                                    </View>
                                ))}
                            </View>
                        )}
                    />

                    {/* ── Voucher Row ── */}
                    <TouchableOpacity
                        style={styles.voucherRow}
                        onPress={() => navigation.navigate('DiscountSelection', {})}
                        activeOpacity={0.7}
                    >
                        <View style={styles.voucherRowLeft}>
                            <Icon name="ticket-percent-outline" size={18} color="#ee4d2d" />
                            <Text style={styles.voucherRowLabel}>Voucher</Text>
                        </View>
                        <View style={styles.voucherRowRight}>
                            {hasDiscount ? (
                                <Text style={styles.voucherAppliedText}>
                                    {[
                                        shopDiscount?.code,
                                        systemDiscount?.code,
                                        freeshippingDiscount?.code,
                                    ].filter(Boolean).join(' + ')}
                                </Text>
                            ) : (
                                <Text style={styles.voucherSelectText}>Chọn Voucher</Text>
                            )}
                            <Icon name="chevron-right" size={18} color={COLORS.text.muted} />
                        </View>
                    </TouchableOpacity>

                    {/* ── Bottom Checkout Bar ── */}
                    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
                        {/* Select All */}
                        <TouchableOpacity
                            style={styles.bottomSelectAll}
                            onPress={toggleSelectAll}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkboxInner, isAllSelected && styles.checkboxSelected]}>
                                {isAllSelected && <Icon name="check" size={14} color="#fff" />}
                            </View>
                            <Text style={styles.bottomSelectAllText}>Tất cả</Text>
                        </TouchableOpacity>

                        {/* Price Info */}
                        <View style={styles.bottomPriceSection}>
                            {hasDiscount ? (
                                <TouchableOpacity
                                    style={styles.priceWithDiscount}
                                    onPress={() => setDiscountModalVisible(true)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.priceRow}>
                                        <Text style={styles.bottomTotal}>{formatPrice(finalTotal)}đ</Text>
                                        <Icon name="chevron-down" size={16} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.savedText}>
                                        Tiết kiệm {formatPrice(totalDiscountAmount)}đ
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.bottomTotal}>{formatPrice(finalTotal)}đ</Text>
                            )}
                        </View>

                        {/* Checkout / Delete Button */}
                        {isEditMode ? (
                            <TouchableOpacity
                                style={[styles.deleteBtn, selectedItems.size === 0 && styles.checkoutBtnDisabled]}
                                onPress={handleDeleteSelected}
                                activeOpacity={0.8}
                                disabled={selectedItems.size === 0}
                            >
                                <Text style={styles.checkoutText}>Xóa ({selectedItems.size})</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.checkoutBtn, selectedItems.size === 0 && styles.checkoutBtnDisabled]}
                                onPress={handleCheckout}
                                activeOpacity={0.8}
                                disabled={selectedItems.size === 0}
                            >
                                <Text style={styles.checkoutText}>
                                    Mua hàng ({selectedItems.size})
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </>
            )}

            {/* ── Variation Modal ── */}
            <Modal
                visible={isVariationModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setVariationModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Phân loại hàng</Text>
                            <TouchableOpacity onPress={() => setVariationModalVisible(false)} style={styles.closeBtn}>
                                <Icon name="close" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>

                        {isFetchingVariations ? (
                            <View style={styles.modalLoader}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            </View>
                        ) : productDetails ? (
                            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
                                <View style={styles.modalProductInfo}>
                                    <Image
                                        source={{ uri: productDetails.images?.[0] || 'https://via.placeholder.com/80' }}
                                        style={styles.modalProductImage}
                                    />
                                    <View style={styles.modalProductDetails}>
                                        <Text style={styles.modalProductPrice}>{formatPrice(productDetails.price)}đ</Text>
                                        <Text style={styles.modalProductStock}>Kho: {productDetails.stock}</Text>
                                    </View>
                                </View>

                                {productDetails.tierVariations?.map((tier: any) => (
                                    <View key={tier.name} style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>{tier.name}</Text>
                                        <View style={styles.modalOptionsContainer}>
                                            {tier.options.map((option: string) => {
                                                const isSelected = selectedOptions[tier.name] === option;
                                                return (
                                                    <TouchableOpacity
                                                        key={option}
                                                        style={[
                                                            styles.modalOptionBtn,
                                                            isSelected && styles.modalOptionBtnActive
                                                        ]}
                                                        onPress={() => handleOptionSelect(tier.name, option)}
                                                    >
                                                        <Text style={[
                                                            styles.modalOptionText,
                                                            isSelected && styles.modalOptionTextActive
                                                        ]}>
                                                            {option}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                ))}

                                <TouchableOpacity
                                    style={[styles.confirmBtn, isUpdatingVariation && styles.checkoutBtnDisabled]}
                                    onPress={handleConfirmVariationChange}
                                    disabled={isUpdatingVariation}
                                >
                                    {isUpdatingVariation ? (
                                        <ActivityIndicator size="small" color={COLORS.text.inverse} />
                                    ) : (
                                        <Text style={styles.confirmBtnText}>Xác nhận</Text>
                                    )}
                                </TouchableOpacity>
                            </ScrollView>
                        ) : (
                            <View style={styles.modalLoader}>
                                <Text>Không thể tải thông tin sản phẩm</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ── Discount Details Modal ── */}
            <Modal
                visible={isDiscountModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setDiscountModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.discountSheet}>
                        {/* Handle bar */}
                        <View style={styles.handleBar} />

                        <View style={styles.discountSheetHeader}>
                            <Text style={styles.discountSheetTitle}>Chi tiết khuyến mãi</Text>
                            <TouchableOpacity onPress={() => setDiscountModalVisible(false)}>
                                <Icon name="close" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Tổng tiền hàng */}
                        <View style={styles.discountRow}>
                            <Text style={styles.discountRowLabel}>Tổng tiền hàng</Text>
                            <Text style={styles.discountRowValue}>{formatPrice(selectedTotal)}đ</Text>
                        </View>

                        {/* Shop Discount */}
                        {shopDiscount?.code && (
                            <View style={styles.discountRow}>
                                <Text style={styles.discountRowLabel}>Giảm giá của Shop</Text>
                                <Text style={styles.discountRowValueRed}>-{formatPrice(shopDiscount.amount)}đ</Text>
                            </View>
                        )}

                        {/* System Discount */}
                        {systemDiscount?.code && (
                            <View style={styles.discountRow}>
                                <Text style={styles.discountRowLabel}>Giảm giá hệ thống</Text>
                                <Text style={styles.discountRowValueRed}>-{formatPrice(systemDiscount.amount)}đ</Text>
                            </View>
                        )}

                        {/* Tiết kiệm */}
                        <View style={styles.discountRow}>
                            <Text style={styles.discountRowLabelBold}>Tiết kiệm</Text>
                            <Text style={styles.discountRowValueRed}>-{formatPrice(totalDiscountAmount)}đ</Text>
                        </View>

                        {/* Tổng số tiền */}
                        <View style={[styles.discountRow, styles.discountRowTotal]}>
                            <Text style={styles.discountRowLabelBold}>Tổng số tiền</Text>
                            <View>
                                <Text style={styles.discountTotalPrice}>{formatPrice(finalTotal)}đ</Text>
                                <Text style={styles.discountTotalSub}>Số tiền cuối cùng thanh toán</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    // ── Header ──
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    backBtn: {
        padding: SPACING.xs,
        marginRight: SPACING.sm,
    },
    headerCenter: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    title: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    headerCount: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '500',
        color: COLORS.text.secondary,
    },
    editBtn: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.secondary,
        fontWeight: '600',
    },

    // ── Shop Group ──
    shopGroup: {
        backgroundColor: COLORS.surface,
        marginTop: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        marginHorizontal: SPACING.sm,
        overflow: 'hidden',
    },
    shopHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 2,
        gap: SPACING.xs,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    shopName: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.text.primary,
    },

    // ── Cart Item ──
    list: {
        paddingBottom: SPACING.md,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginHorizontal: SPACING.md,
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        alignItems: 'flex-start',
    },
    checkbox: {
        padding: SPACING.xs,
    },
    checkboxInner: {
        width: 22,
        height: 22,
        borderRadius: BORDER_RADIUS.sm + 2,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
    },
    checkboxSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    itemImage: {
        width: 88,
        height: 88,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.divider,
        marginLeft: SPACING.sm,
    },
    itemDetails: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    itemName: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
        lineHeight: 20,
        fontWeight: '400',
    },
    variationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: COLORS.divider,
        borderRadius: BORDER_RADIUS.sm,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        marginTop: SPACING.xs,
    },
    variationText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.secondary,
    },
    itemBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    itemPrice: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.error,
    },

    // ── Quantity Controls ──
    quantityWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
    },
    qtyBtn: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.divider,
    },
    qtyBtnDisabled: {
        backgroundColor: COLORS.divider,
    },
    qtyText: {
        paddingHorizontal: SPACING.sm + 2,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.primary,
        minWidth: 36,
        textAlign: 'center',
    },

    // ── Empty State ──
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.divider,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    emptyTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    emptySubtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.muted,
        textAlign: 'center',
    },
    shopButton: {
        flexDirection: 'row',
        marginTop: SPACING.lg,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.full,
        gap: SPACING.sm,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    shopButtonText: {
        color: COLORS.text.inverse,
        fontWeight: '700',
        fontSize: FONT_SIZE.md,
    },

    // ── Bottom Bar (Shopee-style) ──
    bottomBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.sm,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 8,
    },
    bottomSelectAll: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.xs,
    },
    bottomSelectAllText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    bottomPriceSection: {
        flex: 1,
        alignItems: 'flex-end',
        paddingHorizontal: SPACING.sm,
    },
    priceWithDiscount: {
        alignItems: 'flex-end',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    bottomTotal: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.primary,
    },
    savedText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.success,
        fontWeight: '500',
    },
    checkoutBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm + 4,
    },
    deleteBtn: {
        backgroundColor: COLORS.error,
        borderRadius: BORDER_RADIUS.lg,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm + 4,
    },
    checkoutBtnDisabled: {
        backgroundColor: COLORS.text.muted,
        shadowOpacity: 0,
        elevation: 0,
    },
    checkoutText: {
        color: COLORS.text.inverse,
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },

    // ── Modal (Variation) ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        minHeight: '50%',
        maxHeight: '80%',
        paddingBottom: SPACING.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    closeBtn: {
        padding: SPACING.xs,
    },
    modalLoader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    modalScrollView: {
        padding: SPACING.md,
    },
    modalProductInfo: {
        flexDirection: 'row',
        marginBottom: SPACING.lg,
    },
    modalProductImage: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.divider,
    },
    modalProductDetails: {
        flex: 1,
        marginLeft: SPACING.md,
        justifyContent: 'flex-end',
    },
    modalProductPrice: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.error,
    },
    modalProductStock: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        marginTop: 4,
    },
    modalSection: {
        marginBottom: SPACING.lg,
    },
    modalSectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    modalOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    modalOptionBtn: {
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    modalOptionBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    modalOptionText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.primary,
    },
    modalOptionTextActive: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    confirmBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.md,
        marginBottom: SPACING.xl,
    },
    confirmBtnText: {
        color: COLORS.text.inverse,
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },

    // ── Discount Sheet (Shopee-style) ──
    discountSheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.xl,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.border,
        alignSelf: 'center',
        marginTop: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    discountSheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        marginBottom: SPACING.md,
    },
    discountSheetTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    discountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.sm + 2,
    },
    discountRowTotal: {
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        marginTop: SPACING.xs,
        paddingTop: SPACING.md,
    },
    discountRowLabel: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.secondary,
    },
    discountRowLabelBold: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
        fontWeight: '700',
    },
    discountRowValue: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
        fontWeight: '500',
    },
    discountRowValueRed: {
        fontSize: FONT_SIZE.md,
        color: COLORS.error,
        fontWeight: '600',
    },
    discountTotalPrice: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.error,
        textAlign: 'right',
    },
    discountTotalSub: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
        textAlign: 'right',
        marginTop: 2,
    },

    // ── Voucher Row ──
    voucherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 4,
        marginTop: SPACING.sm,
        marginHorizontal: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: '#ffe0d8',
    },
    voucherRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    voucherRowLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    voucherRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    voucherAppliedText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: '#ee4d2d',
    },
    voucherSelectText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.muted,
    },
});

export default CartScreen;
