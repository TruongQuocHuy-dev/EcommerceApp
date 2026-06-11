import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../theme';

interface ProductCardProps {
    product: any;
    onPress: () => void;
    fullWidth?: boolean;
}

const formatPrice = (price: number) => {
    return price?.toLocaleString('vi-VN') || '0';
};

import { useAppSelector } from '../store/hooks';
import { profileApi } from '../api/profileApi';

const ProductCard = ({ product, onPress, fullWidth = false }: ProductCardProps) => {
    const [liked, setLiked] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const { isAuthenticated } = useAppSelector(state => state.auth);

    useEffect(() => {
        const productId = product?._id || product?.id;
        if (isAuthenticated && productId) {
            profileApi.getFavorites().then(favs => {
                if (favs.some((f: any) => (f.product._id === productId || f.product.id === productId))) {
                    setLiked(true);
                }
            }).catch(() => { });
        }
    }, [isAuthenticated, product?._id, product?.id]);

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) return;
        if (isToggling) return;

        const productId = product?._id || product?.id;
        if (!productId) {
            console.error('Cannot find product ID');
            return;
        }

        setIsToggling(true);
        try {
            if (liked) {
                await profileApi.removeFavorite(productId);
                setLiked(false);
            } else {
                await profileApi.addFavorite(productId);
                setLiked(true);
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật danh sách yêu thích:', error);
        } finally {
            setIsToggling(false);
        }
    };

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
        : 0;
    const hasPriceRange = product.priceRange?.max && product.priceRange.max > product.priceRange.min;
    const isOutOfStock = product.stock === 0;

    return (
        <TouchableOpacity
            style={[styles.card, fullWidth && { width: '100%' }]}
            onPress={onPress}
            activeOpacity={0.92}
        >
            {/* Image Container */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: product.images?.[0] || 'https://via.placeholder.com/200' }}
                    style={[styles.image, isOutOfStock && styles.imageGray]}
                    resizeMode="cover"
                />

                {/* Discount Badge */}
                {discountPercent > 0 && !isOutOfStock && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>-{discountPercent}%</Text>
                    </View>
                )}

                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                    <View style={styles.outOfStockOverlay}>
                        <View style={styles.outOfStockPill}>
                            <Text style={styles.outOfStockText}>Hết hàng</Text>
                        </View>
                    </View>
                )}

                {/* Favorite Button */}
                <TouchableOpacity
                    style={styles.favoriteBtn}
                    onPress={handleToggleFavorite}
                    disabled={isToggling}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                    <Icon
                        name={liked ? 'heart' : 'heart-outline'}
                        size={16}
                        color={liked ? COLORS.error : COLORS.text.muted}
                    />
                </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.info}>
                {/* Product Name */}
                <Text style={styles.name} numberOfLines={2}>
                    {product.name}
                </Text>

                {/* Price */}
                <View style={styles.priceContainer}>
                    {hasPriceRange ? (
                        <Text style={styles.price}>
                            {formatPrice(product.priceRange.min)}đ
                            <Text style={styles.priceSeparator}> – </Text>
                            {formatPrice(product.priceRange.max)}đ
                        </Text>
                    ) : (
                        <View style={styles.priceRow}>
                            <Text style={styles.price}>{formatPrice(product.price)}đ</Text>
                            {hasDiscount && (
                                <Text style={styles.originalPrice}>
                                    {formatPrice(product.originalPrice)}đ
                                </Text>
                            )}
                        </View>
                    )}
                </View>

                {/* Bottom Row: Rating + Sold */}
                <View style={styles.bottomRow}>
                    <View style={styles.ratingBadge}>
                        <Icon name="star" size={10} color="#F59E0B" />
                        <Text style={styles.ratingText}>
                            {product.averageRating?.toFixed(1) || '0'}
                        </Text>
                    </View>
                    <Text style={styles.soldText}>
                        {(product.totalSold || product.sold || 0).toLocaleString('vi-VN')} đã bán
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '49%',
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: SPACING.sm + 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },

    /* Image */
    imageContainer: {
        position: 'relative',
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#F4F4F8',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imageGray: {
        opacity: 0.5,
    },

    /* Discount Badge */
    discountBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#f43f5e',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderTopLeftRadius: 16,
        borderBottomRightRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
        elevation: 1,
    },
    discountText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    /* Out of Stock */
    outOfStockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStockPill: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    outOfStockText: {
        color: '#1e293b',
        fontSize: FONT_SIZE.xs,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    /* Favorite */
    favoriteBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },

    /* Info Section */
    info: {
        padding: 12,
        gap: 6,
    },
    name: {
        fontSize: 13,
        color: '#1e293b',
        lineHeight: 18,
        fontWeight: '600',
    },
    priceContainer: {},
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
        flexWrap: 'wrap',
    },
    price: {
        fontSize: 15,
        fontWeight: '800',
        color: '#16a34a',
        letterSpacing: -0.3,
    },
    priceSeparator: {
        fontWeight: '400',
        color: '#16a34aAA',
    },
    originalPrice: {
        fontSize: 11,
        color: '#94a3b8',
        textDecorationLine: 'line-through',
    },

    /* Bottom */
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 6,
        paddingVertical: 2.5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    ratingText: {
        fontSize: 10,
        color: '#D97706',
        fontWeight: '700',
    },
    soldText: {
        fontSize: 10.5,
        color: '#64748b',
    },
});

export default ProductCard;