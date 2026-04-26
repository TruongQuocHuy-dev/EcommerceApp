import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, CompositeNavigationProp, useRoute, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts, fetchHomeProducts } from '../../store/productSlice';
import { fetchCategories } from '../../store/categorySlice';
import { fetchBanners } from '../../store/bannerSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { MainTabParamList, RootStackParamList } from '../../navigation/types';
import ProductCard from '../../components/ProductCard';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';
import BannerCarousel from '../../components/BannerCarousel';
import BannerCarouselSkeleton from '../../components/BannerCarouselSkeleton';
import HomeCategoryList from '../../components/HomeCategoryList';
import HomeCategoryListSkeleton from '../../components/HomeCategoryListSkeleton';

type HomeScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Home'>,
    NativeStackNavigationProp<RootStackParamList>
>;

const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();
    const route = useRoute<RouteProp<MainTabParamList, 'Home'>>();
    const { homeProducts, isLoading, pagination } = useAppSelector((state) => state.product);
    const { categories, isLoading: isCategoryLoading } = useAppSelector((state) => state.category);
    const { banners, isLoading: isBannerLoading } = useAppSelector((state) => state.banners);
    const { user } = useAppSelector((state) => state.auth);

    const loadProducts = useCallback((page = 1) => {
        const params: any = { page, limit: 20 };
        if (route.params?.categoryId) {
            params.category = route.params.categoryId;
        }
        dispatch(fetchHomeProducts(params));
    }, [dispatch, route.params]);

    const loadData = useCallback(() => {
        loadProducts(1);
        dispatch(fetchCategories());
        dispatch(fetchBanners());
    }, [loadProducts, dispatch]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleProductPress = (product: any) => {
        navigation.navigate('ProductDetail', { productId: product.id || product._id });
    };

    const handleCategoryPress = (category: any) => {
        navigation.navigate('CategoryDetail', { categoryId: category.id || category._id, categoryName: category.name });
    };

    const handleBannerPress = async (banner: any) => {
        if (banner.link) {
            try {
                const supported = await Linking.canOpenURL(banner.link);
                if (supported) {
                    await Linking.openURL(banner.link);
                } else {
                    console.log("Don't know how to open URI: " + banner.link);
                }
            } catch (error) {
                console.error('An error occurred opening banner link', error);
            }
        }
    };

    const handleRefresh = () => {
        loadData();
    };

    const handleLoadMore = () => {
        if (pagination && pagination.currentPage < pagination.totalPages) {
            loadProducts(pagination.currentPage + 1);
        }
    };

    // Active category label from route params
    const activeCategoryName = route.params?.categoryName;

    const renderHeader = () => (
        <View style={styles.headerContent}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <View>
                    <Text style={styles.greeting}>
                        Xin chào, <Text style={styles.greetingName}>{user?.name || 'Khách'}!</Text>
                    </Text>
                    <Text style={styles.subtitle}>Bạn muốn tìm gì hôm nay?</Text>
                </View>
                <TouchableOpacity style={styles.notificationBtn}>
                    <Icon name="bell-outline" size={22} color={COLORS.text.primary} />
                </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
                <Icon name="magnify" size={20} color={COLORS.text.muted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm sản phẩm..."
                    placeholderTextColor={COLORS.text.muted}
                />
                <View style={styles.searchDivider} />
                <TouchableOpacity style={styles.filterBtn}>
                    <Icon name="tune-variant" size={18} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Banner carousel */}
            {isBannerLoading && banners.length === 0 ? (
                <BannerCarouselSkeleton key="banner_skeleton" />
            ) : banners.length > 0 ? (
                <BannerCarousel key="banner_carousel" banners={banners} onBannerPress={handleBannerPress} />
            ) : null}

            {/* Category list */}
            {isCategoryLoading && categories.length === 0 ? (
                <HomeCategoryListSkeleton key="cat_skeleton" />
            ) : (
                <HomeCategoryList
                    key="cat_list"
                    categories={categories}
                    onCategoryPress={handleCategoryPress}
                />
            )}

            {/* Section header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {activeCategoryName ? `Danh mục: ${activeCategoryName}` : 'Gợi ý cho bạn'}
                </Text>
                {activeCategoryName && (
                    <TouchableOpacity onPress={() => navigation.navigate('Home', {} as any)}>
                        <Text style={styles.clearFilter}>Xoá bộ lọc</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const feedData = isLoading && homeProducts.length === 0
        ? Array.from({ length: 6 }).map((_, i) => ({ id: `skeleton-${i}`, isSkeleton: true }))
        : homeProducts;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <FlatList
                ListHeaderComponent={renderHeader}
                data={feedData}
                keyExtractor={(item, index) => (item.id || item._id || `product-${index}`) as string}
                numColumns={2}
                renderItem={({ item }) => (
                    item.isSkeleton ? (
                        <ProductCardSkeleton />
                    ) : (
                        <ProductCard product={item} onPress={() => handleProductPress(item)} />
                    )
                )}
                contentContainerStyle={styles.productList}
                columnWrapperStyle={styles.row}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading || isCategoryLoading}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconWrap}>
                                <Icon name="package-variant-closed" size={42} color={COLORS.text.muted} />
                            </View>
                            <Text style={styles.emptyTitle}>Chưa có sản phẩm</Text>
                            <Text style={styles.emptyText}>Thử tìm kiếm với từ khoá khác nhé</Text>
                        </View>
                    ) : null
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    /* Header wrapper */
    headerContent: {
        backgroundColor: COLORS.background,
    },

    /* Top bar */
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.md,
    },
    greeting: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '600',
        color: COLORS.text.secondary,
    },
    greetingName: {
        fontWeight: '800',
        color: COLORS.text.primary,
    },
    subtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.muted,
        marginTop: 2,
    },
    notificationBtn: {
        width: 42,
        height: 42,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },

    /* Search */
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        marginHorizontal: SPACING.md,
        marginBottom: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.xl,
        height: 48,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
    },
    searchDivider: {
        width: 1,
        height: 20,
        backgroundColor: COLORS.divider,
        marginHorizontal: SPACING.sm,
    },
    filterBtn: {
        padding: 4,
    },

    /* Section header */
    sectionHeader: {
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
        letterSpacing: -0.2,
    },
    clearFilter: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: '600',
    },

    /* Products */
    productList: {
        paddingHorizontal: SPACING.sm,
        paddingBottom: SPACING.sm,
    },
    row: {
        justifyContent: 'space-between',
    },

    /* Empty state */
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: SPACING.xl,
    },
    emptyIconWrap: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    emptyTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    emptyText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.muted,
    },
});

export default HomeScreen;
