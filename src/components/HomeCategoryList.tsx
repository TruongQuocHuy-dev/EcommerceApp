import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../theme';

// A palette of soft background colors for placeholders when no image is available
const PALETTE = [
    '#EDE9FE', '#DBEAFE', '#D1FAE5', '#FEF3C7', '#FFE4E6',
    '#F0ABFC', '#67E8F9', '#86EFAC', '#FCD34D', '#FCA5A5',
];

interface Category {
    id?: string;
    _id?: string;
    name: string;
    image?: string;
}

interface HomeCategoryListProps {
    categories: Category[];
    onCategoryPress: (category: Category) => void;
}

const getColorForIndex = (index: number) => PALETTE[index % PALETTE.length];

const HomeCategoryList: React.FC<HomeCategoryListProps> = ({ categories, onCategoryPress }) => {
    if (!categories || categories.length === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <Text style={styles.title}>Danh mục</Text>
            </View>
            <FlatList
                horizontal
                data={categories}
                keyExtractor={(item, index) => (item.id || item._id || String(index)) as string}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        style={styles.categoryItem}
                        onPress={() => onCategoryPress(item)}
                        activeOpacity={0.75}
                    >
                        <View
                            style={[
                                styles.iconContainer,
                                { backgroundColor: getColorForIndex(index) },
                            ]}
                        >
                            {item.image ? (
                                <Image
                                    source={{ uri: item.image }}
                                    style={styles.image}
                                    resizeMode="cover"
                                />
                            ) : (
                                <Text style={styles.placeholder}>
                                    {item.name.charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </View>
                        <Text style={styles.categoryName} numberOfLines={2}>
                            {item.name}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    sectionHeader: {
        paddingHorizontal: SPACING.md,
        marginBottom: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
        letterSpacing: -0.2,
    },
    listContent: {
        paddingHorizontal: SPACING.md,
        gap: SPACING.sm,
    },
    categoryItem: {
        alignItems: 'center',
        width: 70,
    },
    iconContainer: {
        width: 58,
        height: 58,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: 6,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '800',
        color: COLORS.text.primary,
    },
    categoryName: {
        fontSize: 11,
        color: COLORS.text.secondary,
        textAlign: 'center',
        lineHeight: 15,
        fontWeight: '500',
    },
});

export default HomeCategoryList;
