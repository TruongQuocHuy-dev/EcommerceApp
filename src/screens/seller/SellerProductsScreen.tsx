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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts, deleteProduct } from '../../store/productSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type SellerProductsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.md * 3) / 2;

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

    const isOutOfStock = item.stock === 0;
    const isLowStock = item.stock > 0 && item.stock <= 5;
    const isInactive = item.isActive === false;
    const thumbnail = item.images?.[0];

    return (
        <Animated.View style={{ transform: [{ scale }], width: CARD_WIDTH }}>
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                onPress={() => onEdit(item._id || item.id)}
                style={styles.productCard}
            >
                <View style={styles.imageContainer}>
                    {thumbnail ? (
                        <Image source={{ uri: thumbnail }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Icon name="image-outline" size={32} color={COLORS.text.muted} />
                        </View>
                    )}
                    {isInactive ? (
                        <View style={[styles.stockBadge, styles.inactiveBadge]}>
                            <Text style={styles.badgeText}>Đang ẩn</Text>
                        </View>
                    ) : isOutOfStock ? (
                        <View style={[styles.stockBadge, styles.outOfStockBadge]}>
                            <Text style={styles.badgeText}>Hết hàng</Text>
                        </View>
                    ) : isLowStock ? (
                        <View style={[styles.stockBadge, styles.lowStockBadge]}>
                            <Text style={styles.badgeText}>{`Còn ${item.stock}`}</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.productPrice}>{Number(item.price).toLocaleString()}đ</Text>
                    <Text style={[styles.productStock, isOutOfStock && { color: COLORS.error }]}>
                        Kho: {item.stock}
                    </Text>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity 
                        style={styles.actionBtnEdit}
                        onPress={() => onEdit(item._id || item.id)}
                    >
                        <Icon name="pencil" size={14} color="#16a34a" />
                        <Text style={styles.actionBtnEditText}>Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.actionBtnDelete}
                        onPress={() => onDelete(item._id || item.id)}
                    >
                        <Icon name="trash-can-outline" size={16} color={COLORS.error} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const SellerProductsScreen = () => {
    const navigation = useNavigation<SellerProductsNavigationProp>();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { user } = useAppSelector((state) => state.auth);
    const { products, isLoading } = useAppSelector((state) => state.product);

    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    const loadSellerProducts = useCallback(() => {
        if (user?.id) {
            dispatch(fetchProducts({ seller: user.id }));
        }
    }, [dispatch, user?.id]);

    useEffect(() => {
        loadSellerProducts();
    }, [loadSellerProducts]);

    const countAll = products.length;
    const countActive = products.filter((p: any) => p.isActive !== false).length;
    const countLowStock = products.filter((p: any) => p.stock <= 5).length;

    const filterTabs = [
        { key: 'all', label: `Tất cả (${countAll})`, icon: 'view-grid-outline' },
        { key: 'active', label: `Đang bán (${countActive})`, icon: 'check-circle-outline' },
        { key: 'low_stock', label: `Sắp hết (${countLowStock})`, icon: 'alert-outline' },
    ];

    const filteredProducts = products.filter((p: any) => {
        const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        switch (activeFilter) {
            case 'active':
                return p.isActive !== false;
            case 'low_stock':
                return p.stock <= 5;
            default:
                return true;
        }
    });

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
        <View style={styles.header}>
            <View style={styles.searchBar}>
                <Icon name="magnify" size={20} color={COLORS.text.muted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm sản phẩm..."
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={COLORS.text.muted}
                />
            </View>
            <View style={styles.filterContainer}>
                {filterTabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.filterTab,
                            activeFilter === tab.key && styles.filterTabActive,
                        ]}
                        onPress={() => setActiveFilter(tab.key)}
                    >
                        <Icon 
                            name={tab.icon} 
                            size={14} 
                            color={activeFilter === tab.key ? '#fff' : COLORS.text.secondary} 
                        />
                        <Text style={[
                            styles.filterTabText,
                            activeFilter === tab.key && styles.filterTabTextActive,
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderItem = ({ item }: { item: any[] }) => (
        <View style={styles.row}>
            {item.map((p) => (
                <ProductCard
                    key={p._id || p.id}
                    item={p}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            ))}
            {item.length === 1 && <View style={{ width: CARD_WIDTH }} />}
        </View>
    );

    const groupProducts = () => {
        const groups = [];
        for (let i = 0; i < filteredProducts.length; i += 2) {
            groups.push(filteredProducts.slice(i, i + 2));
        }
        return groups;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#16a34a" />
            
            {/* Custom Header Bar */}
            <View style={styles.headerBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
                    <Icon name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sản phẩm của tôi</Text>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={groupProducts()}
                keyExtractor={(_, i) => String(i)}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={loadSellerProducts} />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.empty}>
                            <Icon name="package-variant" size={64} color={COLORS.text.muted} />
                            <Text style={styles.emptyText}>Không tìm thấy sản phẩm</Text>
                        </View>
                    ) : null
                }
            />
            
            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: insets.bottom + 20 }]}
                onPress={() => navigation.navigate('AddEditProduct', { isEdit: false })}
            >
                <Icon name="plus" size={30} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: COLORS.background 
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        backgroundColor: '#16a34a',
    },
    headerBackButton: {
        padding: SPACING.xs,
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: '#fff',
    },
    header: { 
        padding: SPACING.md, 
        backgroundColor: COLORS.background 
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.sm,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
    },
    searchInput: { 
        flex: 1, 
        paddingVertical: 10, 
        paddingHorizontal: 10, 
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
    },
    filterContainer: { 
        flexDirection: 'row', 
        gap: SPACING.xs,
    },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        gap: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
    },
    filterTabActive: { 
        backgroundColor: '#16a34a',
        borderColor: '#16a34a',
    },
    filterTabText: { 
        fontSize: 11, 
        color: COLORS.text.secondary, 
        fontWeight: '700' 
    },
    filterTabTextActive: { 
        color: '#fff' 
    },
    listContent: { 
        paddingBottom: 100 
    },
    row: { 
        flexDirection: 'row', 
        paddingHorizontal: SPACING.md, 
        gap: SPACING.md, 
        marginBottom: SPACING.md 
    },
    productCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    imageContainer: { 
        width: '100%', 
        height: CARD_WIDTH * 0.8, 
        position: 'relative',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        overflow: 'hidden',
    },
    image: { 
        width: '100%', 
        height: '100%' 
    },
    imagePlaceholder: { 
        width: '100%', 
        height: '100%', 
        backgroundColor: '#f1f5f9', 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    stockBadge: {
        position: 'absolute',
        top: 0,
        left: 0,
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
    outOfStockBadge: {
        backgroundColor: COLORS.error,
    },
    lowStockBadge: {
        backgroundColor: '#f97316',
    },
    inactiveBadge: {
        backgroundColor: '#64748b',
    },
    badgeText: { 
        color: '#fff', 
        fontSize: 9.5, 
        fontWeight: '800' 
    },
    productInfo: { 
        padding: 12,
        gap: 5,
    },
    productName: { 
        fontSize: 13, 
        fontWeight: '600', 
        color: '#1e293b', 
        lineHeight: 18,
        marginBottom: 2 
    },
    productPrice: { 
        fontSize: 15, 
        fontWeight: '800', 
        color: '#16a34a' 
    },
    productStock: { 
        fontSize: 11, 
        color: '#64748b', 
        marginTop: 2 
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 12,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        gap: SPACING.sm,
    },
    actionBtnEdit: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
        flex: 1,
        justifyContent: 'center',
    },
    actionBtnEditText: {
        fontSize: 12,
        color: '#16a34a',
        fontWeight: '700',
    },
    actionBtnDelete: {
        backgroundColor: '#fef2f2',
        padding: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#16a34a',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    empty: { 
        alignItems: 'center', 
        paddingVertical: 100 
    },
    emptyText: { 
        marginTop: SPACING.md, 
        fontSize: FONT_SIZE.md, 
        color: COLORS.text.muted 
    },
});

export default SellerProductsScreen;
