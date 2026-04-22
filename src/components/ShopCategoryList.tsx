import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { LayoutGrid } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../theme';

interface Category {
    _id: string;
    name: string;
    count: number;
    image?: string;
}

interface ShopCategoryListProps {
    categories: Category[];
    isLoading: boolean;
    onCategoryPress: (id: string, name: string) => void;
}

const ShopCategoryList = ({ categories, isLoading, onCategoryPress }: ShopCategoryListProps) => {
    if (isLoading) {
        return (
            <View style={styles.tabLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    if (categories.length === 0) {
        return (
            <View style={styles.emptyTab}>
                <LayoutGrid size={48} color={COLORS.text.muted} />
                <Text style={styles.emptyText}>Chưa có danh mục nào</Text>
            </View>
        );
    }

    return (
        <View style={styles.categoryList}>
            {categories.map((cat) => (
                <TouchableOpacity
                    key={cat._id}
                    style={styles.categoryCard}
                    onPress={() => onCategoryPress(cat._id, cat.name)}
                    activeOpacity={0.8}
                >
                    <Image
                        source={{ uri: cat.image || 'https://via.placeholder.com/80' }}
                        style={styles.categoryImage}
                    />
                    <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
                        <Text style={styles.categoryCount}>{cat.count} sản phẩm</Text>
                    </View>
                    <Icon name="chevron-right" size={20} color={COLORS.text.muted} />
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
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
    // ── Category List ──
    categoryList: {
        gap: SPACING.sm,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    categoryImage: {
        width: 56,
        height: 56,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.divider,
    },
    categoryInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    categoryName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    categoryCount: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        marginTop: 2,
    },
});

export default ShopCategoryList;
