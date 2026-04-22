import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Store, Search } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPublicShops, Shop } from '../../store/shopSlice';
import ShopCard from '../../components/ShopCard';
import ShopCardSkeleton from '../../components/ShopCardSkeleton';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type MailNavProp = NativeStackNavigationProp<RootStackParamList>;

const MailScreen = () => {
    const navigation = useNavigation<MailNavProp>();
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();
    const { publicShops, isLoading } = useAppSelector(state => state.shop);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadShops();
    }, []);

    const loadShops = () => {
        dispatch(fetchPublicShops({ search: searchQuery }));
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchPublicShops({ search: searchQuery }));
        setRefreshing(false);
    };

    const handleSearch = () => {
        loadShops();
    };

    const handleShopPress = (shop: Shop) => {
        navigation.navigate('ShopDetail', { shopId: shop._id });
    };

    const renderShopHeader = () => (
        <View style={styles.header}>
            <View style={styles.searchContainer}>
                <Search size={20} color={COLORS.text.muted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm cửa hàng..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
            </View>
            <View style={styles.featuredSection}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Cửa Hàng Nổi Bật</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllText}>Xem tất cả</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
            </View>
        </View>
    );

    const feedData = isLoading && publicShops.length === 0
        ? Array.from({ length: 4 }).map((_, i) => ({ _id: `shop-skeleton-${i}`, isSkeleton: true }))
        : publicShops;

    return (
        <View style={styles.container}>
            <FlatList
                data={feedData}
                keyExtractor={(item: any) => item._id}
                renderItem={({ item }: { item: any }) => (
                    item.isSkeleton ? (
                        <ShopCardSkeleton />
                    ) : (
                        <ShopCard shop={item} onPress={handleShopPress} />
                    )
                )}
                ListHeaderComponent={renderShopHeader}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Store size={48} color={COLORS.text.muted} />
                            <Text style={styles.emptyText}>Chưa có cửa hàng nào được duyệt</Text>
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    topBar: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
    },
    topBarTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text.inverse,
    },
    listContainer: {
        flexGrow: 1,
    },
    header: {
        padding: SPACING.md,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
    },
    featuredSection: {
        marginBottom: SPACING.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        textTransform: 'uppercase',
    },
    seeAllText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xxl,
        marginTop: 40,
    },
    emptyText: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.muted,
        textAlign: 'center',
    },
});

export default MailScreen;
