import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    RefreshControl,
    TextInput,
    Image,
    Animated,
    Dimensions,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts, deleteProduct } from '../../store/productSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type SellerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.md * 3) / 2;

const FILTER_TABS = [
    { key: 'all', label: 'Tất cả', icon: 'view-grid-outline' },
    { key: 'active', label: 'Đang bán', icon: 'check-circle-outline' },
    { key: 'low_stock', label: 'Sắp hết', icon: 'alert-outline' },
    { key: 'featured', label: 'Nổi bật', icon: 'star-outline' },
];

// ────────────────────────── Stat Card ──────────────────────────
const StatCard = ({
    icon,
    label,
    value,
    color,
    bg,
    delay = 0,
}: {
    icon: string;
    label: string;
    value: string | number;
    color: string;
    bg: string;
    delay?: number;
}) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            delay,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <Animated.View
            style={[
                statCardStyles.container,
                {
                    opacity: anim,
                    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                },
            ]}
        >
            <View style={[statCardStyles.iconWrap, { backgroundColor: bg }]}>
                <Icon name={icon} size={22} color={color} />
            </View>
            <Text style={statCardStyles.value}>{value}</Text>
            <Text style={statCardStyles.label}>{label}</Text>
        </Animated.View>
    );
};

const statCardStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
        alignItems: 'flex-start',
    },
    iconWrap: {
        width: 42,
        height: 42,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    value: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '800',
        color: COLORS.text.primary,
        letterSpacing: -0.5,
    },
    label: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
        fontWeight: '500',
        marginTop: 2,
    },
});

// ────────────────────────── Product Card ──────────────────────────
const ProductCard = ({
    item,
    onEdit,
    onDelete,
}: {
    item: any;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () =>
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
    const handlePressOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

    const isLowStock = item.stock <= 5;
    const isFeatured = item.isFeatured;
    const thumbnail = item.images?.[0];

    return (
        <Animated.View style={{ transform: [{ scale }], width: CARD_WIDTH }}>
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => onEdit(item._id || item.id)}
                style={productCardStyles.card}
            >
                {/* Image */}
                <View style={productCardStyles.imageContainer}>
                    {thumbnail ? (
                        <Image source={{ uri: thumbnail }} style={productCardStyles.image} resizeMode="cover" />
                    ) : (
                        <View style={productCardStyles.imagePlaceholder}>
                            <Icon name="image-outline" size={32} color={COLORS.text.muted} />
                        </View>
                    )}

                    {/* Badges */}
                    <View style={productCardStyles.badges}>
                        {isFeatured && (
                            <View style={productCardStyles.featuredBadge}>
                                <Icon name="star" size={9} color="#fff" />
                            </View>
                        )}
                        {isLowStock && (
                            <View style={productCardStyles.lowStockBadge}>
                                <Text style={productCardStyles.lowStockText}>
                                    {item.stock === 0 ? 'Hết' : `Còn ${item.stock}`}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Info */}
                <View style={productCardStyles.info}>
                    <Text style={productCardStyles.name} numberOfLines={2}>
                        {item.name}
                    </Text>
                    <Text style={productCardStyles.price}>${Number(item.price).toLocaleString()}</Text>
                    <View style={productCardStyles.stockRow}>
                        <Icon
                            name="package-variant"
                            size={12}
                            color={isLowStock ? COLORS.warning : COLORS.text.muted}
                        />
                        <Text
                            style={[
                                productCardStyles.stockText,
                                isLowStock && { color: COLORS.warning },
                            ]}
                        >
                            {item.stock} trong kho
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={productCardStyles.actions}>
                    <TouchableOpacity
                        style={productCardStyles.editBtn}
                        onPress={() => onEdit(item._id || item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                    >
                        <Icon name="pencil-outline" size={15} color={COLORS.primary} />
                        <Text style={productCardStyles.editText}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={productCardStyles.deleteBtn}
                        onPress={() => onDelete(item._id || item.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                    >
                        <Icon name="delete-outline" size={15} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const productCardStyles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        marginBottom: SPACING.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    imageContainer: {
        width: '100%',
        height: CARD_WIDTH * 0.85,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badges: {
        position: 'absolute',
        top: 8,
        left: 8,
        flexDirection: 'column',
        gap: 4,
    },
    featuredBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#f59e0b',
        alignItems: 'center',
        justifyContent: 'center',
    },
    lowStockBadge: {
        backgroundColor: COLORS.error,
        borderRadius: BORDER_RADIUS.sm,
        paddingHorizontal: 5,
        paddingVertical: 2,
    },
    lowStockText: {
        fontSize: 9,
        color: '#fff',
        fontWeight: '700',
    },
    info: {
        padding: SPACING.sm,
        paddingTop: SPACING.sm,
        paddingBottom: 4,
    },
    name: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text.primary,
        lineHeight: 18,
        marginBottom: 3,
    },
    price: {
        fontSize: FONT_SIZE.md,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: -0.3,
    },
    stockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 3,
    },
    stockText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        marginTop: 4,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    editText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.primary,
        fontWeight: '600',
    },
    deleteBtn: {
        padding: 2,
    },
});

// ────────────────────────── Main Screen ──────────────────────────
const SellerDashboard = () => {
    const navigation = useNavigation<SellerDashboardNavigationProp>();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { products, isLoading } = useAppSelector((state) => state.product);

    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const headerAnim = useRef(new Animated.Value(0)).current;

    const loadSellerProducts = useCallback(() => {
        if (user?.id) {
            dispatch(fetchProducts({ seller: user.id }));
        }
    }, [dispatch, user?.id]);

    useEffect(() => {
        loadSellerProducts();
        Animated.timing(headerAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, [loadSellerProducts]);

    const filteredProducts = products.filter((p: any) => {
        const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        switch (activeFilter) {
            case 'active':
                return p.isActive !== false;
            case 'low_stock':
                return p.stock <= 5;
            case 'featured':
                return p.isFeatured;
            default:
                return true;
        }
    });

    // Stats computed from products
    const totalRevenue = products.reduce((sum: number, p: any) => sum + (p.price || 0) * (p.sold || 0), 0);
    const totalProducts = products.length;
    const lowStockCount = products.filter((p: any) => p.stock <= 5).length;

    const handleDelete = (id: string) => {
        Alert.alert('Xóa sản phẩm', 'Bạn có chắc chắn muốn xóa sản phẩm này?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    await dispatch(deleteProduct(id));
                    loadSellerProducts();
                },
            },
        ]);
    };

    const handleEdit = (id: string) => {
        navigation.navigate('AddEditProduct', { productId: id, isEdit: true });
    };

    const renderHeader = () => (
        <>
            {/* Hero Header */}
            <Animated.View
                style={{
                    opacity: headerAnim,
                    transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
                }}
            >
                <View style={styles.heroGradient}>
                    <View style={styles.heroTop}>
                        <View>
                            <Text style={styles.greeting}>Xin chào 👋</Text>
                            <Text style={styles.heroName}>{user?.name || 'Seller'}</Text>
                            <Text style={styles.heroSub}>Quản lý gian hàng của bạn</Text>
                        </View>
                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={styles.quickBtn}
                                onPress={() => navigation.navigate('SellerOrdersTab' as never)}
                            >
                                <Icon name="clipboard-list-outline" size={18} color={COLORS.primary} />
                                <Text style={styles.quickBtnText}>Đơn hàng</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.quickBtn, { marginTop: 6 }]}
                                onPress={() => navigation.navigate('SellerVouchersTab' as never)}
                            >
                                <Icon name="ticket-percent-outline" size={18} color='#8b5cf6' />
                                <Text style={[styles.quickBtnText, { color: '#8b5cf6' }]}>Voucher</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <StatCard
                            icon="package-variant-closed"
                            label="Sản phẩm"
                            value={totalProducts}
                            color="#3b82f6"
                            bg="#dbeafe"
                            delay={100}
                        />
                        <StatCard
                            icon="alert-circle-outline"
                            label="Sắp hết"
                            value={lowStockCount}
                            color="#f59e0b"
                            bg="#fef3c7"
                            delay={200}
                        />
                        <StatCard
                            icon="trending-up"
                            label="Doanh thu"
                            value={totalRevenue > 0 ? `$${(totalRevenue / 1000).toFixed(1)}K` : '$0'}
                            color="#8b5cf6"
                            bg="#ede9fe"
                            delay={300}
                        />
                    </View>
                </View>
            </Animated.View>

            {/* Search Bar */}
            <View style={styles.searchWrap}>
                <View style={styles.searchBox}>
                    <Icon name="magnify" size={18} color={COLORS.text.muted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm sản phẩm..."
                        placeholderTextColor={COLORS.text.muted}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Icon name="close-circle" size={16} color={COLORS.text.muted} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.addFab}
                    onPress={() => navigation.navigate('AddEditProduct', { isEdit: false })}
                    activeOpacity={0.85}
                >
                    <Icon name="plus" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterTabs}
            >
                {FILTER_TABS.map((tab) => {
                    const isActive = activeFilter === tab.key;
                    return (
                        <TouchableOpacity
                            key={tab.key}
                            style={[styles.filterTab, isActive && styles.filterTabActive]}
                            onPress={() => setActiveFilter(tab.key)}
                            activeOpacity={0.75}
                        >
                            <Icon
                                name={tab.icon}
                                size={14}
                                color={isActive ? '#fff' : COLORS.text.secondary}
                            />
                            <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {filteredProducts.length} sản phẩm
                </Text>
            </View>
        </>
    );

    const renderEmpty = () => {
        if (isLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconWrap}>
                    <Icon name="store-off-outline" size={52} color={COLORS.text.muted} />
                </View>
                <Text style={styles.emptyTitle}>
                    {search || activeFilter !== 'all' ? 'Không tìm thấy' : 'Chưa có sản phẩm'}
                </Text>
                <Text style={styles.emptySubtitle}>
                    {search
                        ? `Không có kết quả cho "${search}"`
                        : 'Thêm sản phẩm đầu tiên để bắt đầu bán hàng'}
                </Text>
                {!search && activeFilter === 'all' && (
                    <TouchableOpacity
                        style={styles.emptyAction}
                        onPress={() => navigation.navigate('AddEditProduct', { isEdit: false })}
                    >
                        <Icon name="plus" size={16} color="#fff" />
                        <Text style={styles.emptyActionText}>Thêm sản phẩm</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    // Render 2-column grid
    const renderRow = ({ item }: { item: any[] }) => (
        <View style={styles.gridRow}>
            {item.map((product: any) => (
                <ProductCard
                    key={product._id || product.id}
                    item={product}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ))}
            {/* Placeholder if odd number */}
            {item.length === 1 && <View style={{ width: CARD_WIDTH }} />}
        </View>
    );

    // Group products into pairs for 2-column layout
    const gridData: any[][] = [];
    for (let i = 0; i < filteredProducts.length; i += 2) {
        gridData.push(filteredProducts.slice(i, i + 2));
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#16a34a" />
            <FlatList
                data={gridData}
                keyExtractor={(_, i) => String(i)}
                renderItem={renderRow}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={loadSellerProducts}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    listContent: {
        paddingBottom: 32,
    },

    // Hero
    heroGradient: {
        paddingTop: SPACING.lg,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xl + 8,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        backgroundColor: '#16a34a',
    },
    heroTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.lg,
    },
    greeting: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        marginBottom: 2,
    },
    heroName: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    heroSub: {
        fontSize: FONT_SIZE.sm,
        color: 'rgba(255,255,255,0.75)',
        marginTop: 2,
    },
    quickActions: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    quickBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: SPACING.md,
        paddingVertical: 7,
        borderRadius: BORDER_RADIUS.full,
        gap: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    quickBtnText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.primary,
    },
    statsRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },

    // Search
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
        gap: SPACING.sm,
        marginTop: -20,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        paddingHorizontal: SPACING.md,
        paddingVertical: 10,
        gap: SPACING.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
        padding: 0,
    },
    addFab: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },

    // Filters
    filterTabs: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        gap: SPACING.sm,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: 7,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 5,
    },
    filterTabActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterTabText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.secondary,
        fontWeight: '600',
    },
    filterTabTextActive: {
        color: '#fff',
    },

    // Section Header
    sectionHeader: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.text.secondary,
    },

    // Grid
    gridRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.md,
        gap: SPACING.md,
    },

    // Empty
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: SPACING.xl,
    },
    emptyIconWrap: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
    },
    emptyTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    emptySubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.muted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: SPACING.lg,
    },
    emptyAction: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.full,
        gap: SPACING.sm,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyActionText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: '#fff',
    },
});

export default SellerDashboard;
