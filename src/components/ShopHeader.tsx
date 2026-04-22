import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MapPin, Package, LayoutGrid } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../theme';

interface ShopHeaderProps {
    shop: any;
    activeTab: 'products' | 'categories';
    onTabChange: (tab: 'products' | 'categories') => void;
    insetsTop: number;
    onBackPress: () => void;
}

const ShopHeader = ({ shop, activeTab, onTabChange, insetsTop, onBackPress }: ShopHeaderProps) => {
    if (!shop) return null;

    return (
        <View>
            {/* Banner */}
            <View style={styles.bannerContainer}>
                <Image
                    source={{ uri: shop.banner || 'https://via.placeholder.com/800x200' }}
                    style={styles.banner}
                />
                {/* Back button overlay */}
                <TouchableOpacity
                    style={[styles.backBtn, { top: insetsTop + SPACING.xs }]}
                    onPress={onBackPress}
                >
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Shop Info Card */}
            <View style={styles.shopInfoCard}>
                <View style={styles.shopInfoRow}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={{ uri: shop.logo || 'https://via.placeholder.com/150' }}
                            style={styles.logo}
                        />
                    </View>
                    <View style={styles.shopMeta}>
                        <View style={styles.shopNameRow}>
                            <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
                            <View style={styles.mallBadge}>
                                <Text style={styles.mallText}>Mall</Text>
                            </View>
                        </View>
                        <Text style={styles.shopDesc} numberOfLines={2}>{shop.description}</Text>
                    </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{shop.totalProducts || 0}</Text>
                        <Text style={styles.statLabel}>Sản phẩm</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{shop.rating?.toFixed(1) || '0.0'}</Text>
                        <Text style={styles.statLabel}>Đánh giá</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statNumber}>{shop.reviewCount || 0}</Text>
                        <Text style={styles.statLabel}>Lượt đánh giá</Text>
                    </View>
                    {shop.address?.city && (
                        <>
                            <View style={styles.statDivider} />
                            <View style={styles.statBox}>
                                <MapPin size={16} color={COLORS.primary} />
                                <Text style={styles.statLabel}>{shop.address.city}</Text>
                            </View>
                        </>
                    )}
                </View>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'products' && styles.tabActive]}
                    onPress={() => onTabChange('products')}
                >
                    <Package size={16} color={activeTab === 'products' ? COLORS.primary : COLORS.text.muted} />
                    <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
                        Sản phẩm
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'categories' && styles.tabActive]}
                    onPress={() => onTabChange('categories')}
                >
                    <LayoutGrid size={16} color={activeTab === 'categories' ? COLORS.primary : COLORS.text.muted} />
                    <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>
                        Danh mục hàng
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    // ── Banner ──
    bannerContainer: {
        position: 'relative',
    },
    banner: {
        width: '100%',
        height: 180,
        backgroundColor: '#e2e8f0',
    },
    backBtn: {
        position: 'absolute',
        left: SPACING.md,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Shop Info Card ──
    shopInfoCard: {
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.md,
        marginTop: -30,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    shopInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#fff',
        padding: 2,
        borderWidth: 2,
        borderColor: COLORS.primary + '30',
        elevation: 3,
    },
    logo: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
    },
    shopMeta: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    shopNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    shopName: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
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
    shopDesc: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        lineHeight: 18,
    },

    // ── Stats Row ──
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginTop: SPACING.md,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    statBox: {
        alignItems: 'center',
        gap: 4,
    },
    statNumber: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.primary,
    },
    statLabel: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.secondary,
    },
    statDivider: {
        width: 1,
        height: 28,
        backgroundColor: COLORS.divider,
    },

    // ── Tab Bar ──
    tabBar: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        marginTop: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        gap: SPACING.xs,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text.muted,
    },
    tabTextActive: {
        color: COLORS.primary,
    },
});

export default ShopHeader;
