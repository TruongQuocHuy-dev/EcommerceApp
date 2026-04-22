import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Package } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import api from '../../api/client';
import ProductCard from '../../components/ProductCard';
import ShopHeader from '../../components/ShopHeader';
import ShopCategoryList from '../../components/ShopCategoryList';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type ShopDetailRouteProp = RouteProp<RootStackParamList, 'ShopDetail'>;
type ShopDetailNavProp = NativeStackNavigationProp<RootStackParamList>;

const ShopDetailScreen = () => {
    const navigation = useNavigation<ShopDetailNavProp>();
    const route = useRoute<ShopDetailRouteProp>();
    const insets = useSafeAreaInsets();
    const { shopId } = route.params;

    const [shop, setShop] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoadingShop, setIsLoadingShop] = useState(true);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

    // Fetch shop details
    useEffect(() => {
        const fetchShop = async () => {
            try {
                const response = await api.get(`/shops/public`);
                const found = response.data.data.shops.find((s: any) => s._id === shopId);
                if (found) {
                    setShop(found);
                    // After getting shop, fetch products by seller (owner)
                    fetchShopProducts(found.owner);
                }
            } catch (error) {
                console.error('Error fetching shop:', error);
            } finally {
                setIsLoadingShop(false);
            }
        };
        fetchShop();
    }, [shopId]);

    const fetchShopProducts = async (sellerId: string) => {
        setIsLoadingProducts(true);
        try {
            const response = await api.get(`/products?seller=${sellerId}&limit=50`);
            const fetchedProducts = response.data.data.products || [];
            setProducts(fetchedProducts);

            // Extract unique categories from products
            const categoryMap = new Map();
            fetchedProducts.forEach((p: any) => {
                if (p.category) {
                    const catId = p.category._id || p.category;
                    const catName = p.category.name || 'Khác';
                    if (!categoryMap.has(catId)) {
                        categoryMap.set(catId, {
                            _id: catId,
                            name: catName,
                            count: 0,
                            image: p.images?.[0],
                        });
                    }
                    categoryMap.get(catId).count += 1;
                }
            });
            setCategories(Array.from(categoryMap.values()));
        } catch (error) {
            console.error('Error fetching shop products:', error);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    const handleProductPress = (productId: string) => {
        navigation.navigate('ProductDetail', { productId });
    };

    const handleCategoryPress = (categoryId: string, categoryName: string) => {
        // Navigate to home with category filter
        navigation.navigate('Main', {
            screen: 'Home',
            params: { categoryId, categoryName },
        });
    };

    if (isLoadingShop) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (!shop) {
        return (
            <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.surface} />
                <Text style={styles.errorText}>Không tìm thấy thông tin shop</Text>
                <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.goBackText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Products Tab ──
    const renderProductsTab = () => {
        if (isLoadingProducts) {
            return (
                <View style={styles.tabLoading}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            );
        }

        if (products.length === 0) {
            return (
                <View style={styles.emptyTab}>
                    <Package size={48} color={COLORS.text.muted} />
                    <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
                </View>
            );
        }

        return (
            <View style={styles.productGrid}>
                {products.map((product) => (
                    <ProductCard
                        key={product._id || product.id}
                        product={product}
                        onPress={() => handleProductPress(product._id || product.id)}
                    />
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
            >
                <ShopHeader
                    shop={shop}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    insetsTop={insets.top}
                    onBackPress={() => navigation.goBack()}
                />
                <View style={styles.tabContent}>
                    {activeTab === 'products' ? (
                        renderProductsTab()
                    ) : (
                        <ShopCategoryList
                            categories={categories}
                            isLoading={isLoadingProducts}
                            onCategoryPress={handleCategoryPress}
                        />
                    )}
                </View>
                <View style={{ height: insets.bottom + SPACING.lg }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    errorText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.muted,
        marginBottom: SPACING.md,
    },
    goBackBtn: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
    },
    goBackText: {
        color: COLORS.text.inverse,
        fontWeight: '600',
    },
    tabContent: {
        padding: SPACING.md,
    },
    tabLoading: {
        paddingVertical: SPACING.xxl,
        alignItems: 'center',
    },
    emptyTab: {
        alignItems: 'center',
        paddingVertical: SPACING.xxl,
    },
    emptyText: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.muted,
    },
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
});

export default ShopDetailScreen;
