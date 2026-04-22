import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts } from '../../store/productSlice';
import ProductCard from '../../components/ProductCard';
import ProductCardSkeleton from '../../components/ProductCardSkeleton';

type ProductListRouteProp = RouteProp<RootStackParamList, 'ProductList'>;
type ProductListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductList'>;

const ProductListScreen = () => {
    const navigation = useNavigation<ProductListNavigationProp>();
    const route = useRoute<ProductListRouteProp>();
    const dispatch = useAppDispatch();
    const { products, isLoading, pagination } = useAppSelector((state) => state.product);

    const { categoryId, categoryName } = route.params || {};

    const loadProducts = useCallback((page = 1) => {
        dispatch(fetchProducts({ page, limit: 20, category: categoryId }));
    }, [dispatch, categoryId]);

    useEffect(() => {
        loadProducts(1);
    }, [loadProducts]);

    const handleProductPress = (product: any) => {
        navigation.navigate('ProductDetail', { productId: product.id || product._id });
    };

    const handleRefresh = () => {
        loadProducts(1);
    };

    const handleLoadMore = () => {
        if (pagination && pagination.currentPage < pagination.totalPages) {
            loadProducts(pagination.currentPage + 1);
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title} numberOfLines={1}>{categoryName}</Text>
            <View style={styles.headerRight} />
        </View>
    );

    const feedData = isLoading && products.length === 0
        ? Array.from({ length: 6 }).map((_, i) => ({ id: `skeleton-${i}`, isSkeleton: true }))
        : products;

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            <FlatList
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
                        refreshing={isLoading}
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
                            <Text style={styles.emptyText}>Chưa có sản phẩm trong danh mục này</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.background,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        flex: 1,
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
    },
    productList: {
        paddingHorizontal: SPACING.sm,
        paddingTop: SPACING.sm,
    },
    row: {
        justifyContent: 'space-between',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingTop: 60,
    },
    emptyText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.muted,
    },
});

export default ProductListScreen;