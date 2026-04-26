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
import { fetchCategories, Category } from '../../store/categorySlice';

type CategoryDetailRouteProp = RouteProp<RootStackParamList, 'CategoryDetail'>;
type CategoryDetailNavigationProp = CompositeNavigationProp<
    NativeStackNavigationProp<RootStackParamList, 'CategoryDetail'>,
    BottomTabNavigationProp<MainTabParamList>
>;


const CategoryDetailScreen = () => {
    const navigation = useNavigation<CategoryDetailNavigationProp>();
    const route = useRoute<CategoryDetailRouteProp>();
    const dispatch = useAppDispatch();
    const { categories } = useAppSelector((state) => state.category);

    const { categoryId, categoryName } = route.params || {};

    const currentCategory = categories.find((c) => (c.id || c._id) === categoryId);
    const subCategories = currentCategory?.children || [];

    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    const handleCategoryPress = (category: Category) => {
        if (category.children && category.children.length > 0) {
            navigation.push('CategoryDetail', { 
                categoryId: category.id || category._id, 
                categoryName: category.name 
            });
        } else {
            navigation.navigate('ProductList', { 
                categoryId: category.id || category._id, 
                categoryName: category.name 
            });
        }
    };

    const renderItem = ({ item }: { item: Category }) => (
        <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(item)}
            activeOpacity={0.8}
        >
            <View style={styles.cardImageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                    <View style={styles.cardPlaceholderImage}>
                        <Text style={styles.cardPlaceholderText}>{item.name.charAt(0)}</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardCategoryName} numberOfLines={2}>
                    {item.name}
                </Text>
                {item.children && item.children.length > 0 && (
                    <Text style={styles.subCatCount}>{item.children.length} danh mục</Text>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Icon name="chevron-left" size={28} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
                <TouchableOpacity style={styles.headerRight}>
                    <Icon name="dots-vertical" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.heroSection}>
                <View style={styles.heroContent}>
                    <Text style={styles.heroSubtitle}>Khám phá</Text>
                    <Text style={styles.heroTitle}>{categoryName}</Text>
                </View>
                <View style={styles.searchBarMock}>
                    <Icon name="magnify" size={20} color={COLORS.text.muted} />
                    <Text style={styles.searchPlaceholder}>Tìm trong {categoryName}...</Text>
                </View>
            </View>

            {subCategories.length > 0 ? (
                <View style={styles.content}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Danh mục con</Text>
                        <Text style={styles.sectionCount}>{subCategories.length} mục</Text>
                    </View>
                    <FlatList
                        data={subCategories}
                        keyExtractor={(item) => item.id || item._id}
                        renderItem={renderItem}
                        numColumns={3}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={styles.columnWrapper}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Icon name="folder-outline" size={64} color={COLORS.text.muted} />
                                <Text style={styles.emptyText}>Không có danh mục con</Text>
                            </View>
                        }
                    />
                </View>
            ) : (
                <View style={styles.noSubCategory}>
                    <View style={styles.emptyIllustration}>
                        <Icon name="package-variant" size={80} color={COLORS.primary + '40'} />
                    </View>
                    <Text style={styles.noSubCategoryTitle}>Chưa có danh mục con</Text>
                    <Text style={styles.noSubCategoryText}>
                        Bạn có thể xem trực tiếp tất cả sản phẩm trong danh mục {categoryName}
                    </Text>
                    <TouchableOpacity 
                        style={styles.viewProductsBtn}
                        onPress={() => navigation.navigate('ProductList', { categoryId, categoryName })}
                    >
                        <Text style={styles.viewProductsText}>Xem tất cả sản phẩm</Text>
                        <Icon name="arrow-right" size={18} color="#fff" style={{ marginLeft: 8 }} />
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
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        backgroundColor: COLORS.background,
    },
    backBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.primary,
        textAlign: 'center',
    },
    headerRight: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroSection: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.lg,
        backgroundColor: COLORS.background,
    },
    heroContent: {
        marginBottom: SPACING.md,
    },
    heroSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    heroTitle: {
        fontSize: FONT_SIZE.xxxl,
        fontWeight: '800',
        color: COLORS.text.primary,
    },
    searchBarMock: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchPlaceholder: {
        marginLeft: SPACING.sm,
        color: COLORS.text.muted,
        fontSize: FONT_SIZE.sm,
    },
    content: {
        flex: 1,
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: BORDER_RADIUS.xl * 2,
        borderTopRightRadius: BORDER_RADIUS.xl * 2,
        paddingTop: SPACING.lg,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    sectionCount: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
        backgroundColor: COLORS.background,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BORDER_RADIUS.full,
    },
    listContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.xl,
    },
    columnWrapper: {
        justifyContent: 'flex-start',
        gap: SPACING.md,
        marginBottom: SPACING.lg,
    },
    categoryCard: {
        width: '30%',
        alignItems: 'center',
    },
    cardImageContainer: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xs,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    cardPlaceholderImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '15',
    },
    cardPlaceholderText: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    cardInfo: {
        alignItems: 'center',
    },
    cardCategoryName: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.primary,
        textAlign: 'center',
        fontWeight: '600',
    },
    subCatCount: {
        fontSize: 10,
        color: COLORS.text.muted,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: SPACING.xxl,
    },
    emptyText: {
        color: COLORS.text.muted,
        fontSize: FONT_SIZE.md,
        marginTop: SPACING.md,
    },
    noSubCategory: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: BORDER_RADIUS.xl * 2,
        borderTopRightRadius: BORDER_RADIUS.xl * 2,
    },
    emptyIllustration: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    noSubCategoryTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    noSubCategoryText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginBottom: SPACING.xxl,
        lineHeight: 20,
    },
    viewProductsBtn: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    viewProductsText: {
        color: '#fff',
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
    },
});

export default CategoryDetailScreen;
