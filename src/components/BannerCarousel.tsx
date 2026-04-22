import React, { useState, useRef } from 'react';
import {
    View,
    FlatList,
    Image,
    StyleSheet,
    Dimensions,
    NativeSyntheticEvent,
    NativeScrollEvent,
    TouchableOpacity,
    Text,
} from 'react-native';
import { COLORS, BORDER_RADIUS, SPACING, FONT_SIZE } from '../theme';

import { Banner } from '../store/bannerSlice';
import { API_BASE_URL } from '../utils/constants';

const { width } = Dimensions.get('window');
const HORIZONTAL_PADDING = SPACING.md;
const ITEM_WIDTH = width - HORIZONTAL_PADDING * 2;
const ITEM_SPACING = SPACING.sm;
const ITEM_HEIGHT = ITEM_WIDTH * 0.46;

const getImageUrl = (imagePath: string) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;

    const baseUrl = API_BASE_URL.replace('/api/v1', '');
    const cleanPath = imagePath.replace(/\\/g, '/');
    return `${baseUrl}/${cleanPath}`;
};

const DEFAULT_BANNERS: Banner[] = [
    {
        _id: '1',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop',
        title: 'Flash Sale hôm nay',
        link: '',
        isActive: true,
        order: 1
    },
    {
        _id: '2',
        image: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?q=80&w=2070&auto=format&fit=crop',
        title: 'Ưu đãi cuối tuần',
        link: '',
        isActive: true,
        order: 2
    },
    {
        _id: '3',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
        title: 'Thời trang mới nhất',
        link: '',
        isActive: true,
        order: 3
    },
];

interface BannerCarouselProps {
    banners?: Banner[];
    onBannerPress?: (banner: Banner) => void;
}

const BannerCarousel: React.FC<BannerCarouselProps> = ({
    banners = DEFAULT_BANNERS,
    onBannerPress,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideSize = ITEM_WIDTH + ITEM_SPACING;
        const index = event.nativeEvent.contentOffset.x / slideSize;
        const roundIndex = Math.round(index);
        if (activeIndex !== roundIndex && roundIndex >= 0 && roundIndex < banners.length) {
            setActiveIndex(roundIndex);
        }
    };

    return (
        <View style={styles.wrapper}>
            <FlatList
                data={banners}
                keyExtractor={(item, index) => item._id || String(index)}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_WIDTH + ITEM_SPACING}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        activeOpacity={0.92}
                        style={[
                            styles.slide,
                            { marginRight: index === banners.length - 1 ? 0 : ITEM_SPACING }
                        ]}
                        onPress={() => onBannerPress?.(item)}
                    >
                        <Image
                            source={{ uri: getImageUrl(item.image) }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                        {/* Dark gradient overlay */}
                        <View style={styles.overlay} />

                        {/* Label bottom-left (using title) */}
                        {item.title && (
                            <View style={styles.labelContainer}>
                                <Text style={styles.labelText} numberOfLines={1}>
                                    {item.title}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}
            />

            {/* Pagination dots */}
            {banners.length > 1 && (
                <View style={styles.pagination}>
                    {banners.map((item, index) => (
                        <View
                            key={item._id || `dot-${index}`}
                            style={[
                                styles.dot,
                                activeIndex === index ? styles.activeDot : styles.inactiveDot,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: SPACING.md,
    },
    slide: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        backgroundColor: '#E2E8F0',
        borderWidth: 1,
        borderColor: '#EEEEF3',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10,15,30,0.28)',
        borderRadius: BORDER_RADIUS.xl,
    },
    badgeContainer: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: COLORS.error,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.md,
    },
    badgeText: {
        color: '#fff',
        fontSize: FONT_SIZE.xs,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    labelContainer: {
        position: 'absolute',
        bottom: 14,
        left: 14,
        right: 70,
    },
    labelText: {
        color: '#fff',
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        letterSpacing: 0.2,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
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
        backgroundColor: COLORS.primary,
    },
    inactiveDot: {
        width: 6,
        backgroundColor: COLORS.border,
    },
});

export default BannerCarousel;
