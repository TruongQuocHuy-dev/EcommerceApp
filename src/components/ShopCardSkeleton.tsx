import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SPACING, BORDER_RADIUS, COLORS } from '../theme';

const ShopCardSkeleton = () => {
    return (
        <View style={styles.shopCard}>
            {/* Banner Placeholder */}
            <View style={styles.shopBanner} />

            <View style={styles.shopInfoContent}>
                {/* Logo Placeholder */}
                <View style={styles.shopLogoContainer}>
                    <View style={styles.shopLogo} />
                </View>

                {/* Details Placeholder */}
                <View style={styles.shopDetails}>
                    <View style={styles.shopNameRow}>
                        <View style={styles.titleFull} />
                    </View>

                    <View style={styles.descriptionLine} />
                    <View style={styles.descriptionLineShort} />

                    <View style={styles.shopStats}>
                        <View style={styles.statBox} />
                        <View style={styles.statBox} />
                        <View style={styles.statBoxShort} />
                    </View>
                </View>

                {/* Arrow Placeholder */}
                <View style={styles.arrowPlaceholder} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    shopCard: {
        backgroundColor: COLORS.surface,
        marginBottom: SPACING.md,
        marginHorizontal: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 2,
    },
    shopBanner: {
        width: '100%',
        height: 100,
        backgroundColor: '#E2E8F0',
    },
    shopInfoContent: {
        flexDirection: 'row',
        padding: SPACING.md,
        alignItems: 'center',
    },
    shopLogoContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#fff',
        padding: 2,
        elevation: 4,
        marginTop: -30,
        marginRight: SPACING.md,
        borderWidth: 2,
        borderColor: '#fff',
    },
    shopLogo: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        backgroundColor: '#E2E8F0',
    },
    shopDetails: {
        flex: 1,
        justifyContent: 'center',
        gap: 6,
    },
    shopNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleFull: {
        width: '70%',
        height: 16,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    descriptionLine: {
        width: '100%',
        height: 12,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    descriptionLineShort: {
        width: '80%',
        height: 12,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    shopStats: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    statBox: {
        width: 40,
        height: 14,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    statBoxShort: {
        width: 60,
        height: 14,
        borderRadius: 4,
        backgroundColor: '#E2E8F0',
    },
    arrowPlaceholder: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#E2E8F0',
        marginLeft: 8,
    },
});

export default ShopCardSkeleton;
