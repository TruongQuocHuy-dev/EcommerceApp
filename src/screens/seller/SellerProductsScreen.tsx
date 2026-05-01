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

const FILTER_TABS = [
    { key: 'all', label: 'Tất cả', icon: 'view-grid-outline' },
    { key: 'active', label: 'Đang bán', icon: 'check-circle-outline' },
    { key: 'low_stock', label: 'Sắp hết', icon: 'alert-outline' },
];

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
                    {isLowStock && (
                        <View style={styles.lowStockBadge}>
                            <Text style={styles.lowStockText}>
                                {item.stock === 0 ? 'Hết hàng' : `Còn ${item.stock}`}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.productPrice}>${Number(item.price).toLocaleString()}</Text>
                    <Text style={[styles.productStock, isLowStock && { color: COLORS.error }]}>
                        Kho: {item.stock}
                    </Text>
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity onPress={() => onEdit(item._id || item.id)}>
                        <Icon name="pencil-outline" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDelete(item._id || item.id)}>
                        <Icon name="delete-outline" size={18} color={COLORS.error} />
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
            <Text style={styles.title}>Sản phẩm của tôi</Text>
            <View style={styles.searchBar}>
                <Icon name="magnify" size={20} color={COLORS.text.muted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm sản phẩm..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>
            <View style={styles.filterContainer}>
                {FILTER_TABS.map((tab) => (
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
                            size={16} 
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
        <View style={[styles.container, { paddingTop: insets.top }]}>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { padding: SPACING.md, backgroundColor: COLORS.surface },
    title: { fontSize: FONT_SIZE.xxl, fontWeight: '700', color: COLORS.text.primary, marginBottom: SPACING.md },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.sm,
        marginBottom: SPACING.md,
    },
    searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 10, fontSize: FONT_SIZE.md },
    filterContainer: { flexDirection: 'row', gap: SPACING.sm },
    filterTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: '#f1f5f9',
        gap: 6,
    },
    filterTabActive: { backgroundColor: COLORS.primary },
    filterTabText: { fontSize: FONT_SIZE.xs, color: COLORS.text.secondary, fontWeight: '600' },
    filterTabTextActive: { color: '#fff' },
    listContent: { paddingBottom: 100 },
    row: { flexDirection: 'row', paddingHorizontal: SPACING.md, gap: SPACING.md, marginBottom: SPACING.md },
    productCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    imageContainer: { width: '100%', height: CARD_WIDTH * 0.8, position: 'relative' },
    image: { width: '100%', height: '100%' },
    imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    lowStockBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: COLORS.error,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.sm,
    },
    lowStockText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    productInfo: { padding: SPACING.sm },
    productName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text.primary, marginBottom: 2 },
    productPrice: { fontSize: FONT_SIZE.md, fontWeight: '700', color: COLORS.primary },
    productStock: { fontSize: FONT_SIZE.xs, color: COLORS.text.muted, marginTop: 2 },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.md,
        padding: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    empty: { alignItems: 'center', paddingVertical: 100 },
    emptyText: { marginTop: SPACING.md, fontSize: FONT_SIZE.md, color: COLORS.text.muted },
});

export default SellerProductsScreen;
