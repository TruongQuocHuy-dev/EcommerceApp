import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';
import { Store, MapPin, Star, ChevronRight } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../theme';
import { Shop } from '../store/shopSlice';

interface ShopCardProps {
    shop: Shop;
    onPress: (shop: Shop) => void;
}

const ShopCard = ({ shop, onPress }: ShopCardProps) => {
    return (
        <TouchableOpacity style={styles.shopCard} onPress={() => onPress(shop)} activeOpacity={0.92}>
            <Image
                source={{ uri: shop.banner || 'https://via.placeholder.com/800x200' }}
                style={styles.shopBanner}
            />
            <View style={styles.shopInfoContent}>
                <View style={styles.shopLogoContainer}>
                    <Image
                        source={{ uri: shop.logo || 'https://via.placeholder.com/150' }}
                        style={styles.shopLogo}
                    />
                </View>

                <View style={styles.shopDetails}>
                    <View style={styles.shopNameRow}>
                        <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
                        <View style={styles.mallBadge}>
                            <Text style={styles.mallText}>Mall</Text>
                        </View>
                    </View>

                    <Text style={styles.shopDescription} numberOfLines={2}>
                        {shop.description}
                    </Text>

                    <View style={styles.shopStats}>
                        <View style={styles.statItem}>
                            <Star size={14} color="#f59e0b" fill="#f59e0b" />
                            <Text style={styles.statText}>
                                {shop.rating?.toFixed(1) || '0.0'} ({shop.reviewCount || 0})
                            </Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Store size={14} color={COLORS.text.secondary} />
                            <Text style={styles.statText}>
                                {shop.totalProducts || 0} sản phẩm
                            </Text>
                        </View>
                        {shop.address?.city && (
                            <>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <MapPin size={14} color={COLORS.text.secondary} />
                                    <Text style={styles.statText} numberOfLines={1}>
                                        {shop.address.city}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                <ChevronRight size={20} color={COLORS.text.muted} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    shopCard: {
        backgroundColor: COLORS.surface,
        marginBottom: SPACING.md,
        marginHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
    },
    shopBanner: {
        width: '100%',
        height: 100,
        backgroundColor: '#e2e8f0',
    },
    shopInfoContent: {
        flexDirection: 'row',
        padding: SPACING.md,
        alignItems: 'center',
    },
    shopLogoContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        padding: 2,
        elevation: 4,
        marginTop: -30,
        marginRight: SPACING.md,
        borderWidth: 2,
        borderColor: '#fff',
    },
    shopLogo: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
    },
    shopDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    shopNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    shopName: {
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginRight: 8,
        flexShrink: 1,
    },
    mallBadge: {
        backgroundColor: '#d0011b',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    mallText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    shopDescription: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        marginBottom: SPACING.xs,
    },
    shopStats: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.secondary,
    },
    statDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.text.muted,
        marginHorizontal: 8,
    },
});

export default ShopCard;
