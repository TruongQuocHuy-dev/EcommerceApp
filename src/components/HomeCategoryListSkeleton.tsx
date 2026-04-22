import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

const HomeCategoryListSkeleton = () => {
    // Array of 6 items to fill the screen horizontally
    const skeletonItems = Array.from({ length: 6 }).map((_, i) => ({ id: `cat-skeleton-${i}` }));

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <View style={styles.titlePlaceholder} />
            </View>
            <FlatList
                horizontal
                data={skeletonItems}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={() => (
                    <View style={styles.categoryItem}>
                        <View style={styles.iconPlaceholder} />
                        <View style={styles.textPlaceholderFull} />
                        <View style={styles.textPlaceholderShort} />
                    </View>
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
    titlePlaceholder: {
        width: 100,
        height: 24,
        borderRadius: 6,
        backgroundColor: '#E2E8F0',
    },
    listContent: {
        paddingHorizontal: SPACING.md,
        gap: SPACING.sm,
    },
    categoryItem: {
        alignItems: 'center',
        width: 70,
    },
    iconPlaceholder: {
        width: 58,
        height: 58,
        borderRadius: BORDER_RADIUS.xl,
        marginBottom: 8,
        backgroundColor: '#E2E8F0',
    },
    textPlaceholderFull: {
        width: '90%',
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
        marginBottom: 4,
    },
    textPlaceholderShort: {
        width: '60%',
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
});

export default HomeCategoryListSkeleton;
