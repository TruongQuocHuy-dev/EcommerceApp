import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BORDER_RADIUS, SPACING } from '../theme';

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = SPACING.md;
const ITEM_WIDTH = width - HORIZONTAL_PADDING * 2;
const ITEM_HEIGHT = ITEM_WIDTH * 0.46;

const BannerCarouselSkeleton = () => {
    return (
        <View style={styles.wrapper}>
            <View style={styles.carouselContainer}>
                <View style={styles.slidePlaceholder} />
            </View>
            <View style={styles.pagination}>
                <View style={[styles.dot, styles.activeDot]} />
                <View style={[styles.dot, styles.inactiveDot]} />
                <View style={[styles.dot, styles.inactiveDot]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: SPACING.md,
    },
    carouselContainer: {
        paddingHorizontal: HORIZONTAL_PADDING,
    },
    slidePlaceholder: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        borderRadius: BORDER_RADIUS.xl,
        backgroundColor: '#E2E8F0',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    dot: {
        height: 6,
        borderRadius: 3,
        marginHorizontal: 3,
    },
    activeDot: {
        width: 20,
        backgroundColor: '#CBD5E1', // Slightly darker than base
    },
    inactiveDot: {
        width: 6,
        backgroundColor: '#E2E8F0',
    },
});

export default BannerCarouselSkeleton;
