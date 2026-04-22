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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../../navigation/types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCategories } from '../../store/categorySlice';

type CategoryDetailRouteProp = RouteProp<RootStackParamList, 'CategoryDetail'>;
type CategoryDetailNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<RootStackParamList, 'CategoryDetail'>,
    BottomTabNavigationProp<MainTabParamList>
>;

interface CategoryItem {
    id: string;
    name: string;
    image?: string;
    children?: CategoryItem[];
}

const CategoryDetailScreen = () => {
    const navigation = useNavigation<CategoryDetailNavigationProp>();
    const route = useRoute<CategoryDetailRouteProp>();
    const dispatch = useAppDispatch();
    const { categories } = useAppSelector((state) => state.category);

    const { categoryId, categoryName } = route.params || {};

    const currentCategory = categories.find((c: any) => c.id === categoryId || c._id === categoryId);
    const subCategories = currentCategory?.children || [];

    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    const handleCategoryPress = (category: CategoryItem) => {
        if (category.children && category.children.length > 0) {
            navigation.push('CategoryDetail', { 
                categoryId: category.id, 
                categoryName: category.name 
            });
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
                <Icon name="chevron-right" size={20} color={COLORS.text.muted} style={styles.chevron} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>{categoryName}</Text>
                <View style={styles.headerRight} />
            </View>

            {subCategories.length > 0 ? (
                <FlatList
                    data={subCategories}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    numColumns={4}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.columnWrapper}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không có danh mục con</Text>
                        </View>
                    }
                />
            ) : (
                <View style={styles.noSubCategory}>
                    <Text style={styles.noSubCategoryText}>Danh mục này chưa có danh mục con</Text>
                    <TouchableOpacity 
                        style={styles.viewProductsBtn}
                        onPress={() => navigation.navigate('ProductList', { categoryId, categoryName })}
                    >
                        <Text style={styles.viewProductsText}>Xem sản phẩm</Text>
                    </TouchableOpacity>
                </View>
            )}
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
    listContent: {
        padding: SPACING.sm,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    categoryItem: {
        width: '25%',
        alignItems: 'center',
        padding: SPACING.xs,
    },
    imageContainer: {
        width: 56,
        height: 56,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
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
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    categoryName: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.primary,
        textAlign: 'center',
    },
    chevron: {
        position: 'absolute',
        top: 20,
        right: 0,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: SPACING.xl,
    },
    emptyText: {
        color: COLORS.text.muted,
        fontSize: FONT_SIZE.md,
    },
    noSubCategory: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.lg,
    },
    noSubCategoryText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.muted,
        marginBottom: SPACING.md,
    },
    viewProductsBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
    },
    viewProductsText: {
        color: '#fff',
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
});

export default CategoryDetailScreen;
