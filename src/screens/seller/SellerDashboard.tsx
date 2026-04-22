import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts, deleteProduct } from '../../store/productSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type SellerDashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SellerDashboard = () => {
    const navigation = useNavigation<SellerDashboardNavigationProp>();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const { products, isLoading } = useAppSelector((state) => state.product);

    const loadSellerProducts = useCallback(() => {
        if (user?.id) {
            // In a real app, strict filtering should happen on backend (e.g. /products/seller/me)
            // Here we use the general fetch with filter
            dispatch(fetchProducts({ seller: user.id }));
        }
    }, [dispatch, user?.id]);

    useEffect(() => {
        loadSellerProducts();
    }, [loadSellerProducts]);

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Product',
            'Are you sure you want to delete this product?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await dispatch(deleteProduct(id));
                        loadSellerProducts();
                    }
                }
            ]
        );
    };

    const handleEdit = (id: string) => {
        navigation.navigate('AddEditProduct', { productId: id, isEdit: true });
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>${item.price}</Text>
                <Text style={styles.productStock}>Stock: {item.stock}</Text>
            </View>
            <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleEdit(item._id || item.id)} style={styles.actionBtn}>
                    <Icon name="pencil" size={20} color={COLORS.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id || item.id)} style={styles.actionBtn}>
                    <Icon name="delete" size={20} color={COLORS.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Seller Dashboard</Text>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => navigation.navigate('AddEditProduct', { isEdit: false })}
                >
                    <Icon name="plus" size={24} color={COLORS.text.inverse} />
                    <Text style={styles.addBtnText}>Add Product</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={products}
                keyExtractor={(item) => item._id || item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={loadSellerProducts} />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>You haven't added any products yet.</Text>
                        </View>
                    ) : null
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        padding: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text.primary },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
    },
    addBtnText: {
        color: COLORS.text.inverse,
        fontWeight: '600',
        marginLeft: SPACING.xs,
    },
    list: { padding: SPACING.md },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: { flex: 1 },
    productName: { fontSize: FONT_SIZE.lg, fontWeight: '600', color: COLORS.text.primary, marginBottom: 4 },
    productPrice: { fontSize: FONT_SIZE.md, color: COLORS.primary, fontWeight: '700' },
    productStock: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary },
    cardActions: { flexDirection: 'row', gap: SPACING.sm },
    actionBtn: { padding: SPACING.sm },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: COLORS.text.muted, fontSize: FONT_SIZE.md },
});

export default SellerDashboard;
