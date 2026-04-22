import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Star } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProductReviews, clearReviews } from '../../store/reviewSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type ReviewsScreenRouteProp = RouteProp<RootStackParamList, 'ProductReviews'>;
type ReviewsNavProp = NativeStackNavigationProp<RootStackParamList>;

// Skeleton Item component
const ReviewSkeleton = () => (
    <View style={styles.reviewItem}>
        <View style={styles.reviewHeader}>
            <View style={styles.reviewerInfo}>
                <View style={[styles.skeletonBlock, { width: 32, height: 32, borderRadius: 16 }]} />
                <View style={{ gap: 4 }}>
                    <View style={[styles.skeletonBlock, { width: 100, height: 16 }]} />
                    <View style={[styles.skeletonBlock, { width: 60, height: 12 }]} />
                </View>
            </View>
            <View style={[styles.skeletonBlock, { width: 50, height: 12 }]} />
        </View>
        <View style={[styles.skeletonBlock, { width: 80, height: 16, marginBottom: 8 }]} />
        <View style={[styles.skeletonBlock, { width: '100%', height: 14, marginBottom: 4 }]} />
        <View style={[styles.skeletonBlock, { width: '80%', height: 14 }]} />
    </View>
);

const ProductReviewsScreen = () => {
    const route = useRoute<ReviewsScreenRouteProp>();
    const navigation = useNavigation<ReviewsNavProp>();
    const { productId, productName } = route.params;
    const dispatch = useAppDispatch();

    const { reviews, isLoading, pagination, error } = useAppSelector(state => state.review);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        dispatch(fetchProductReviews({ productId, page: 1 }));

        return () => {
            // We do not clear reviews on unmount here in case they go back to detail screen,
            // depending on preference. If they should stay fresh, we clear them.
            // We'll leave them to populate the detail screen memory instead.
        };
    }, [dispatch, productId]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await dispatch(fetchProductReviews({ productId, page: 1 }));
        setIsRefreshing(false);
    };

    const handleLoadMore = () => {
        if (!pagination) return;

        if (pagination.hasNextPage && !isLoadingMore && !isLoading && !isRefreshing) {
            setIsLoadingMore(true);
            dispatch(fetchProductReviews({ productId, page: pagination.currentPage + 1 }))
                .finally(() => setIsLoadingMore(false));
        }
    };

    const renderReview = ({ item: review }: { item: any }) => (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerInitial}>
                            {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View>
                        <Text style={styles.reviewerName}>
                            {review.user?.name || 'Người dùng'}
                        </Text>
                        <View style={styles.ratingRow}>
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={12}
                                    color={i < review.rating ? '#f59e0b' : COLORS.border}
                                    fill={i < review.rating ? '#f59e0b' : 'transparent'}
                                />
                            ))}
                        </View>
                    </View>
                </View>
                <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </Text>
            </View>

            {review.isVerifiedPurchase && (
                <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>Đã mua hàng</Text>
                </View>
            )}

            <Text style={styles.reviewTitle}>{review.title}</Text>
            <Text style={styles.reviewContent}>{review.comment}</Text>
        </View>
    );

    // Initial load state
    if (isLoading && (!reviews || reviews.length === 0)) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
                        <ChevronLeft size={24} color={COLORS.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Đánh giá sản phẩm</Text>
                    <View style={styles.headerPlaceholder} />
                </View>
                <View style={styles.listContent}>
                    {[1, 2, 3, 4, 5].map(key => <ReviewSkeleton key={key} />)}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
                    <ChevronLeft size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {productName ? `Đánh giá ${productName}` : 'Đánh giá sản phẩm'}
                </Text>
                <View style={styles.headerPlaceholder} />
            </View>

            {error && !reviews.length ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            ) : reviews.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>Sản phẩm này chưa có đánh giá nào.</Text>
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={(item: any) => item.id}
                    renderItem={renderReview}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshing={isRefreshing}
                    onRefresh={handleRefresh}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={() =>
                        isLoadingMore ? (
                            <ActivityIndicator size="small" color={COLORS.primary} style={styles.footerLoader} />
                        ) : null
                    }
                />
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
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerButton: {
        padding: SPACING.xs,
    },
    headerTitle: {
        flex: 1,
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        textAlign: 'center',
        marginHorizontal: SPACING.md,
    },
    headerPlaceholder: {
        width: 32,
    },
    listContent: {
        padding: SPACING.lg,
        gap: SPACING.md,
    },
    reviewItem: {
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.sm,
    },
    reviewerInfo: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    reviewerAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewerInitial: {
        fontSize: FONT_SIZE.sm,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    reviewerName: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 2,
    },
    reviewDate: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
    },
    verifiedBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#dcfce7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: SPACING.sm,
    },
    verifiedText: {
        fontSize: 10,
        color: '#166534',
        fontWeight: '500',
    },
    reviewTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginBottom: 2,
    },
    reviewContent: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        lineHeight: 20,
    },
    footerLoader: {
        paddingVertical: SPACING.md,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    errorText: {
        color: COLORS.error,
        textAlign: 'center',
        marginBottom: SPACING.md,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
    },
    retryText: {
        color: COLORS.text.inverse,
        fontWeight: 'bold',
    },
    emptyText: {
        color: COLORS.text.secondary,
        fontSize: FONT_SIZE.md,
    },
    skeletonBlock: {
        backgroundColor: '#E1E9EE',
        borderRadius: 4,
    }
});

export default ProductReviewsScreen;
