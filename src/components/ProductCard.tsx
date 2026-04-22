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
        borderRadius: 14,
        marginBottom: SPACING.sm + 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EEEEF3',
        // No shadow as requested
    },

    /* Image */
    imageContainer: {
        position: 'relative',
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#F4F4F8',
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
        top: 8,
        left: 0,
        backgroundColor: COLORS.error,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderTopRightRadius: 6,
        borderBottomRightRadius: 6,
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
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outOfStockPill: {
        backgroundColor: 'rgba(30,30,30,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    outOfStockText: {
        color: '#fff',
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    /* Favorite */
    favoriteBtn: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.92)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },

    /* Info Section */
    info: {
        padding: 10,
        gap: 5,
    },
    name: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.primary,
        lineHeight: 19,
        fontWeight: '500',
    },
    priceContainer: {},
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 6,
        flexWrap: 'wrap',
    },
    price: {
        fontSize: FONT_SIZE.md,
        fontWeight: '800',
        color: COLORS.error,
        letterSpacing: -0.3,
    },
    priceSeparator: {
        fontWeight: '400',
        color: COLORS.error + 'AA',
    },
    originalPrice: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
        textDecorationLine: 'line-through',
    },

    /* Bottom */
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 1,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#FFFBEB',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    ratingText: {
        fontSize: 10,
        color: '#92400E',
        fontWeight: '700',
    },
    soldText: {
        fontSize: 10,
        color: COLORS.text.muted,
    },
});

export default ProductCard;