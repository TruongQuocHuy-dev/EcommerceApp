import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../../navigation/types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCategories } from '../../store/categorySlice';

type CategoriesScreenNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<RootStackParamList, 'Categories'>,
    BottomTabNavigationProp<MainTabParamList>
>;

interface CategoryItem {
    id: string;
    name: string;
    image?: string;
    children?: CategoryItem[];
}

const CategoriesScreen = () => {
    const navigation = useNavigation<CategoriesScreenNavigationProp>();
    const dispatch = useAppDispatch();
    const { categories, isLoading } = useAppSelector((state) => state.category);

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleCategoryPress = (category: CategoryItem) => {
        if (category.children && category.children.length > 0) {
            navigation.navigate('CategoryDetail', { categoryId: category.id, categoryName: category.name });
        } else {
            navigation.navigate('ProductList', { categoryId: category.id, categoryName: category.name });
        }
    };

    const renderItem = ({ item }: { item: CategoryItem }) => (
        <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
                    </View>
                )}
            </View>
            <Text style={styles.categoryName} numberOfLines={2}>
                {item.name}
            </Text>
            {item.children && item.children.length > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.children.length}</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    if (isLoading && categories.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Danh mục</Text>
            </View>

            <FlatList
                data={categories}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={() => dispatch(fetchCategories())} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Chưa có danh mục</Text>
                    </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.background,
    },
    title: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    listContent: {
        padding: SPACING.sm,
    },
    columnWrapper: {
        justifyContent: 'space-between',
    },
    categoryItem: {
        width: '47%',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        alignItems: 'center',
        marginBottom: SPACING.md,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    imageContainer: {
        width: 70,
        height: 70,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.background,
        marginBottom: SPACING.sm,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '20',
    },
    placeholderText: {
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    categoryName: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.primary,
        textAlign: 'center',
        fontWeight: '500',
    },
    badge: {
        position: 'absolute',
        top: SPACING.xs,
        right: SPACING.xs,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.full,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: SPACING.xl,
    },
    emptyText: {
        color: COLORS.text.muted,
        fontSize: FONT_SIZE.md,
    },
});

export default CategoriesScreen;
