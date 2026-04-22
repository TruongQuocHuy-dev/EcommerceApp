import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme';

interface ProductCardSkeletonProps {
    fullWidth?: boolean;
}

const ProductCardSkeleton = ({ fullWidth = false }: ProductCardSkeletonProps) => {
    return (
        <View style={[styles.card, fullWidth && { width: '100%' }]}>
            {/* Image Placeholder */}
            <View style={styles.imageContainer}>
                <View style={styles.imagePlaceholder} />
            </View>

            {/* Info Placeholder */}
            <View style={styles.info}>
                {/* Title (2 lines) */}
                <View style={styles.titleLineFull} />
                <View style={styles.titleLineShort} />

                {/* Price Row */}
                <View style={styles.priceContainer}>
                    <View style={styles.priceBox} />
                    <View style={styles.originalPriceBox} />
                </View>

                {/* Bottom Row */}
                <View style={styles.bottomRow}>
                    <View style={styles.ratingBox} />
                    <View style={styles.soldBox} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '49%',
        backgroundColor: '#fff',
        borderRadius: 14,
        marginBottom: SPACING.sm + 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EEEEF3',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: COLORS.surface,
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E2E8F0', // Shimmer base color
    },
    info: {
        padding: 10,
        gap: 8,
    },
    titleLineFull: {
        width: '100%',
        height: 14,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    titleLineShort: {
        width: '70%',
        height: 14,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    priceBox: {
        width: '45%',
        height: 18,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    originalPriceBox: {
        width: '30%',
        height: 12,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingBox: {
        width: 40,
        height: 16,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    soldBox: {
        width: 50,
        height: 12,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
});

export default ProductCardSkeleton;
