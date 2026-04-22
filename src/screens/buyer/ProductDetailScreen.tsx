import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Alert,
    FlatList,
    Modal,
    Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ShoppingCart, Star, Minus, Plus, Store, ChevronRight, Heart } from 'lucide-react-native';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProductById, clearCurrentProduct } from '../../store/productSlice';
import { addToCart } from '../../store/cartSlice';
import { fetchProductReviews, clearReviews } from '../../store/reviewSlice';
import ShopCard from '../../components/ShopCard';
import ProductCard from '../../components/ProductCard';
import api from '../../api/client';
import { profileApi } from '../../api/profileApi';

const { width } = Dimensions.get('window');

type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailNavProp = NativeStackNavigationProp<RootStackParamList>;

const ProductDetailScreen = () => {
    const route = useRoute<ProductDetailScreenRouteProp>();
    const navigation = useNavigation<ProductDetailNavProp>();
    const { productId } = route.params;
    const dispatch = useAppDispatch();

    // Redux State
    const { currentProduct: product, isLoading, error } = useAppSelector(state => state.product);
    const { reviews, isLoading: isReviewsLoading } = useAppSelector(state => state.review);

    // Local UI State
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isBuyingNow, setIsBuyingNow] = useState(false);

    // Bottom Sheet State
    const [isBottomSheetVisible, setBottomSheetVisible] = useState(false);
    const [bottomSheetAction, setBottomSheetAction] = useState<'cart' | 'buy'>('cart');

    const [isFavorite, setIsFavorite] = useState(false);
    const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

    // Expandable Description
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    // Get Auth state to check if user is logged in
    const { isAuthenticated } = useAppSelector(state => state.auth);

    // Shop state
    const [shopInfo, setShopInfo] = useState<any>(null);
    const [shopProducts, setShopProducts] = useState<any[]>([]);
    const [isLoadingShop, setIsLoadingShop] = useState(false);

    const insets = useSafeAreaInsets();

    useEffect(() => {
        dispatch(fetchProductById(productId));
        dispatch(fetchProductReviews({ productId }));

        // Fetch favorites to check if this product is liked
        if (isAuthenticated) {
            profileApi.getFavorites().then(favs => {
                if (favs.some((f: any) => f.product._id === productId)) {
                    setIsFavorite(true);
                }
            }).catch(() => { });
        }

        return () => {
            dispatch(clearCurrentProduct());
            dispatch(clearReviews());
        };
    }, [dispatch, productId, isAuthenticated]);

    // Fetch shop info and other products when product loads
    useEffect(() => {
        if (!product) return;

        // product.seller is returned as { id, name, email } by the API
        const sellerId = product.seller?.id || product.seller?._id || (typeof product.seller === 'string' ? product.seller : null);
        // product.shop holds the shop ObjectId directly
        const shopId = product.shop || null;

        if (!sellerId && !shopId) return;

        const loadShopData = async () => {
            setIsLoadingShop(true);
            try {
                // Fetch shop info: use shop._id directly if available, otherwise search by owner
                if (shopId) {
                    try {
                        const shopRes = await api.get(`/shops/public`);
                        const shops: any[] = shopRes.data.data.shops || [];
                        const found = shops.find((s: any) => String(s._id) === String(shopId));
                        if (found) setShopInfo(found);
                    } catch { }
                } else if (sellerId) {
                    const shopsRes = await api.get('/shops/public');
                    const shops: any[] = shopsRes.data.data.shops || [];
                    const found = shops.find((s: any) => {
                        const ownerId = typeof s.owner === 'string' ? s.owner : s.owner?._id;
                        return String(ownerId) === String(sellerId);
                    });
                    if (found) setShopInfo(found);
                }

                // Fetch shop's other products (filter by seller id)
                if (sellerId) {
                    const productsRes = await api.get(`/products?seller=${sellerId}&limit=10`);
                    const all: any[] = productsRes.data.data.products || [];
                    setShopProducts(all.filter((p: any) => String(p._id || p.id) !== String(productId)));
                }
            } catch (e) {
                console.error('Error loading shop data:', e);
            } finally {
                setIsLoadingShop(false);
            }
        };
        loadShopData();
    }, [product, productId]);

    // Initialize default options when product loads
    useEffect(() => {
        if (product?.tierVariations) {
            const defaults: Record<string, string> = {};
            product.tierVariations.forEach((tier: any) => {
                if (tier.options.length > 0) {
                    defaults[tier.name] = tier.options[0];
                }
            });
            setSelectedOptions(defaults);
        }
    }, [product]);

    const handleOptionSelect = (tierName: string, option: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            [tierName]: option
        }));
        // Reset quantity if it exceeds new stock
        setQuantity(1);
    };

    const variationInfo = useMemo(() => {
        if (!product) return { stock: 0, price: 0, image: '', originalPrice: 0, skuId: undefined };

        if (product.skus && product.skus.length > 0 && product.tierVariations) {
            const tierIndex = product.tierVariations.map((tier: any) => {
                const selectedOption = selectedOptions[tier.name];
                const optionIndex = tier.options.indexOf(selectedOption);
                return optionIndex >= 0 ? optionIndex : 0;
            });

            const matchingSku = product.skus.find((sku: any) => {
                if (!sku.tierIndex || sku.tierIndex.length !== tierIndex.length) return false;
                return sku.tierIndex.every((val: number, idx: number) => val === tierIndex[idx]);
            });

            if (matchingSku) {
                return {
                    stock: matchingSku.stock,
                    price: matchingSku.price,
                    image: matchingSku.image || product.images?.[0] || 'https://via.placeholder.com/150',
                    originalPrice: matchingSku.originalPrice || matchingSku.price,
                    skuId: matchingSku._id
                };
            }
        }

        return {
            stock: product.stock || 0,
            price: product.price || 0,
            image: product.images?.[0] || 'https://via.placeholder.com/150',
            originalPrice: product.originalPrice || product.price,
            skuId: undefined
        };
    }, [product, selectedOptions]);

    const currentStock = variationInfo.stock;
    const currentPrice = variationInfo.price;
    const currentImage = variationInfo.image;
    const currentOriginalPrice = variationInfo.originalPrice;

    const handleAddToCart = async () => {
        if (!product) return;
        if (currentStock === 0) {
            Alert.alert('Thông báo', 'Phân loại sản phẩm này đã hết hàng');
            return;
        }

        if (bottomSheetAction === 'cart') {
            setIsAddingToCart(true);
        } else {
            setIsBuyingNow(true);
        }

        try {
            const skuId = variationInfo.skuId;

            if (product.skus && product.skus.length > 0 && !skuId) {
                Alert.alert('Lỗi', 'Không tìm thấy phiên bản sản phẩm này');
                setIsAddingToCart(false);
                setIsBuyingNow(false);
                return;
            }

            if (bottomSheetAction === 'buy') {
                await dispatch(addToCart({
                    productId: product._id || product.id,
                    quantity,
                    skuId,
                })).unwrap();
                setBottomSheetVisible(false);
                navigation.navigate('Cart' as never);
            } else {
                await dispatch(addToCart({
                    productId: product._id || product.id,
                    quantity,
                    skuId,
                })).unwrap();

                setBottomSheetVisible(false);
                const optionsString = Object.values(selectedOptions).join(', ');
                Alert.alert(
                    'Thành công',
                    `Đã thêm ${quantity} ${product.name} ${optionsString ? `(${optionsString})` : ''} vào giỏ hàng`,
                    [
                        { text: 'Tiếp tục mua sắm', style: 'cancel' },
                        { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('Cart' as never) },
                    ]
                );
            }
        } catch (err: any) {
            Alert.alert('Lỗi', err || 'Không thể thao tác');
        } finally {
            setIsAddingToCart(false);
            setIsBuyingNow(false);
        }
    };

    const openBottomSheet = (action: 'cart' | 'buy') => {
        setBottomSheetAction(action);
        setBottomSheetVisible(true);
    };

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            Alert.alert('Thông báo', 'Vui lòng đăng nhập để sử dụng tính năng này');
            return;
        }

        if (isTogglingFavorite) return;

        setIsTogglingFavorite(true);
        try {
            if (isFavorite) {
                await profileApi.removeFavorite(productId);
                setIsFavorite(false);
            } else {
                await profileApi.addFavorite(productId);
                setIsFavorite(true);
            }
        } catch (err: any) {
            Alert.alert('Lỗi', 'Không thể cập nhật danh sách yêu thích');
        } finally {
            setIsTogglingFavorite(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (error || !product) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <Text style={styles.errorText}>{typeof error === 'string' ? error : 'Không tìm thấy sản phẩm'}</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const images = product.images && product.images.length > 0
        ? product.images
        : ['https://via.placeholder.com/400'];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.headerButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleToggleFavorite}
                        disabled={isTogglingFavorite}
                    >
                        <Heart size={24} color={isFavorite ? COLORS.error : COLORS.text.primary} fill={isFavorite ? COLORS.error : 'transparent'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={() => navigation.navigate('Cart' as never)}
                    >
                        <ShoppingCart size={24} color={COLORS.text.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Carousel */}
                <View style={styles.carouselContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(e) => {
                            const slide = Math.ceil(e.nativeEvent.contentOffset.x / width);
                            if (slide !== activeImageIndex) {
                                setActiveImageIndex(slide);
                            }
                        }}
                        scrollEventThrottle={16}
                    >
                        {images.map((img: string, index: number) => (
                            <Image
                                key={index}
                                source={{ uri: img }}
                                style={styles.productImage}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>
                    {/* Pagination Dots */}
                    <View style={styles.pagination}>
                        {images.map((_: any, index: number) => (
                            <View
                                key={index}
                                style={[
                                    styles.paginationDot,
                                    index === activeImageIndex && styles.paginationDotActive
                                ]}
                            />
                        ))}
                    </View>
                </View>

                <View style={styles.contentContainer}>
                    {/* Category & Rating */}
                    <View style={styles.metaRow}>
                        <Text style={styles.category}>
                            {product.category?.name || 'Chưa phân loại'}
                        </Text>
                        <View style={styles.ratingContainer}>
                            <Star size={16} color="#FFD700" fill="#FFD700" />
                            <Text style={styles.ratingText}>
                                {product.averageRating?.toFixed(1) || '0.0'}
                                <Text style={styles.reviewCount}> ({product.numReviews} đánh giá)</Text>
                            </Text>
                        </View>
                        <Text style={styles.soldCount}>
                            Đã bán {product.totalSold || product.sold || 0}
                        </Text>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{product.name}</Text>

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={styles.price}>{currentPrice.toLocaleString()}đ</Text>
                        {!!currentOriginalPrice && currentOriginalPrice > currentPrice && (
                            <Text style={styles.originalPrice}>
                                {currentOriginalPrice.toLocaleString()}đ
                            </Text>
                        )}
                        {currentStock <= 5 && currentStock > 0 && (
                            // <Text style={styles.lowStock}>Chỉ còn {currentStock} sản phẩm!</Text>
                            <Text></Text>
                        )}
                    </View>

                    {/* Tier Variations and Description */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
                        <Text
                            style={styles.description}
                            numberOfLines={isDescriptionExpanded ? undefined : 3}
                        >
                            {product.description}
                        </Text>
                        {product.description && product.description.length > 100 && (
                            <TouchableOpacity onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}>
                                <Text style={styles.seeAllText}>
                                    {isDescriptionExpanded ? 'Thu gọn' : 'Xem thêm'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Reviews Preview (Placeholder) */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Đánh giá</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAllText}>Xem tất cả</Text>
                            </TouchableOpacity>
                        </View>
                        {product.numReviews === 0 ? (
                            <Text style={styles.noReviews}>Chưa có đánh giá nào.</Text>
                        ) : (
                            <View style={styles.reviewsList}>
                                {isReviewsLoading ? (
                                    <ActivityIndicator size="small" color={COLORS.primary} />
                                ) : (
                                    reviews.slice(0, 3).map((review, index) => (
                                        <View key={review.id || index} style={styles.reviewItem}>
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
                                    ))
                                )}
                            </View>
                        )}
                        {reviews.length > 3 && (
                            <TouchableOpacity
                                style={{ alignItems: 'center', marginTop: SPACING.md }}
                                onPress={() => navigation.navigate('ProductReviews', { productId: product._id || product.id, productName: product.name })}
                            >
                                <Text style={styles.seeAllText}>Xem tất cả {product.numReviews} đánh giá</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Shop Card */}
                    <View style={styles.shopSection}>
                        <View style={styles.shopSectionHeader}>
                            <Text style={styles.sectionTitle}>Thông tin shop</Text>
                            {shopInfo && (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('ShopDetail', { shopId: shopInfo._id })}
                                >
                                    <Text style={styles.seeAllText}>Xem shop</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {isLoadingShop ? (
                            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
                        ) : shopInfo ? (
                            <View style={styles.shopCardWrapper}>
                                <ShopCard
                                    shop={shopInfo}
                                    onPress={(shop) => navigation.navigate('ShopDetail', { shopId: shop._id })}
                                />
                            </View>
                        ) : (
                            <View style={styles.noShopContainer}>
                                <Store size={20} color={COLORS.text.muted} />
                                <Text style={styles.noShopText}>{product.seller?.name || 'Người bán không rõ'}</Text>
                            </View>
                        )}
                    </View>

                    {/* Other products from the same shop */}
                    {shopProducts.length > 0 && (
                        <View style={styles.shopProductsSection}>
                            <View style={styles.shopSectionHeader}>
                                <Text style={styles.sectionTitle}>Sản phẩm khác của shop</Text>
                                {shopInfo && (
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('ShopDetail', { shopId: shopInfo._id })}
                                    >
                                        <Text style={styles.seeAllText}>Xem tất cả</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <FlatList
                                data={shopProducts}
                                keyExtractor={(item) => item._id || item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.shopProductsList}
                                renderItem={({ item }) => {
                                    const hasDiscount = item.originalPrice && item.originalPrice > item.price;
                                    const discountPct = hasDiscount
                                        ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                                        : 0;
                                    return (
                                        <TouchableOpacity
                                            style={styles.shopProductItem}
                                            onPress={() => navigation.navigate('ProductDetail', { productId: item._id || item.id })}
                                            activeOpacity={0.85}
                                        >
                                            <View style={styles.shopProductImageWrap}>
                                                <Image
                                                    source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
                                                    style={styles.shopProductImage}
                                                    resizeMode="cover"
                                                />
                                                {discountPct > 0 && (
                                                    <View style={styles.shopProductBadge}>
                                                        <Text style={styles.shopProductBadgeText}>-{discountPct}%</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.shopProductInfo}>
                                                <Text style={styles.shopProductName} numberOfLines={2}>{item.name}</Text>
                                                <Text style={styles.shopProductPrice}>
                                                    {item.price?.toLocaleString('vi-VN')}đ
                                                </Text>
                                                {item.averageRating > 0 && (
                                                    <View style={styles.shopProductRating}>
                                                        <Star size={10} color="#f59e0b" fill="#f59e0b" />
                                                        <Text style={styles.shopProductRatingText}>{item.averageRating?.toFixed(1)}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View style={[styles.mainBottomBar, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
                <TouchableOpacity
                    style={styles.chatStoreBtn}
                    onPress={() => shopInfo && navigation.navigate('ShopDetail', { shopId: shopInfo._id })}
                >
                    <Store size={22} color={COLORS.text.secondary} />
                    <Text style={styles.chatStoreText}>Shop</Text>
                </TouchableOpacity>

                <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.outlineActionBtn, currentStock === 0 && styles.disabledBtnOutline]}
                        onPress={() => openBottomSheet('cart')}
                        disabled={currentStock === 0}
                    >
                        <Text style={[styles.outlineActionText, currentStock === 0 && styles.disabledText]}>
                            Thêm vào giỏ
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.solidActionBtn, currentStock === 0 && styles.disabledBtn]}
                        onPress={() => openBottomSheet('buy')}
                        disabled={currentStock === 0}
                    >
                        <Text style={styles.solidActionText}>
                            Mua ngay
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Variation Bottom Sheet */}
            <Modal
                visible={isBottomSheetVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setBottomSheetVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setBottomSheetVisible(false)}
                >
                    <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
                        {/* Prevent dismiss when touching bottom sheet */}
                        <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
                            <View style={styles.sheetHeader}>
                                <View style={styles.sheetProductSummary}>
                                    <Image
                                        source={{ uri: currentImage }}
                                        style={styles.sheetProductImage}
                                    />
                                    <View style={styles.sheetProductInfo}>
                                        <Text style={styles.sheetPrice}>{currentPrice.toLocaleString()}đ</Text>
                                        <Text style={styles.sheetStock}>Kho: {currentStock}</Text>
                                        <Text style={styles.sheetSelection} numberOfLines={1}>
                                            Phân loại: {Object.values(selectedOptions).join(', ') || 'Chưa chọn'}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => setBottomSheetVisible(false)} style={styles.sheetCloseBtn}>
                                    <View style={styles.sheetCloseIcon} />
                                    <View style={[styles.sheetCloseIcon, { transform: [{ rotate: '90deg' }], position: 'absolute' }]} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} style={styles.sheetScroll}>
                                {/* Tier Variations */}
                                {product.tierVariations?.map((tier: any) => (
                                    <View key={tier.name} style={styles.sheetSection}>
                                        <Text style={styles.sheetSectionTitle}>{tier.name}</Text>
                                        <View style={styles.sheetOptionsWrap}>
                                            {tier.options.map((option: string) => {
                                                const isSelected = selectedOptions[tier.name] === option;
                                                return (
                                                    <TouchableOpacity
                                                        key={option}
                                                        style={[
                                                            styles.sheetOptionBtn,
                                                            isSelected && styles.sheetOptionBtnActive
                                                        ]}
                                                        onPress={() => handleOptionSelect(tier.name, option)}
                                                    >
                                                        <Text style={[
                                                            styles.sheetOptionText,
                                                            isSelected && styles.sheetOptionTextActive
                                                        ]}>
                                                            {option}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                ))}

                                {/* Quantity Selector */}
                                <View style={[styles.sheetSection, styles.sheetQuantitySection]}>
                                    <Text style={styles.sheetSectionTitle}>Số lượng</Text>
                                    <View style={styles.sheetQuantityContainer}>
                                        <TouchableOpacity
                                            style={styles.sheetQuantityBtn}
                                            onPress={() => setQuantity(Math.max(1, quantity - 1))}
                                        >
                                            <Minus size={16} color={COLORS.text.primary} />
                                        </TouchableOpacity>
                                        <Text style={styles.sheetQuantityText}>{quantity}</Text>
                                        <TouchableOpacity
                                            style={styles.sheetQuantityBtn}
                                            onPress={() => setQuantity(Math.min(currentStock, quantity + 1))}
                                        >
                                            <Plus size={16} color={COLORS.text.primary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>

                            <TouchableOpacity
                                style={[
                                    styles.sheetConfirmBtn,
                                    (currentStock === 0 || isAddingToCart || isBuyingNow) && styles.disabledBtn
                                ]}
                                onPress={handleAddToCart}
                                disabled={currentStock === 0 || isAddingToCart || isBuyingNow}
                            >
                                {(isAddingToCart || isBuyingNow) ? (
                                    <ActivityIndicator size="small" color={COLORS.text.inverse} />
                                ) : (
                                    <Text style={styles.sheetConfirmText}>
                                        {currentStock === 0 ? 'Hết hàng' : bottomSheetAction === 'cart' ? 'Thêm vào giỏ hàng' : 'Mua ngay'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.xs,
        position: 'absolute',
        top: 40,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    carouselContainer: {
        width: width,
        height: width,
        position: 'relative',
    },
    productImage: {
        width: width,
        height: width,
    },
    pagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: SPACING.md,
        alignSelf: 'center',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: 4,
    },
    paginationDotActive: {
        backgroundColor: COLORS.primary,
        width: 20,
    },
    contentContainer: {
        padding: SPACING.lg,
        paddingBottom: 100,
        backgroundColor: COLORS.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -24,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    category: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.primary,
        fontWeight: 'bold',
    },
    reviewCount: {
        fontWeight: 'normal',
        color: COLORS.text.muted,
    },
    soldCount: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        fontWeight: '500',
    },
    title: {
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 12,
        marginBottom: SPACING.lg,
    },
    price: {
        fontSize: FONT_SIZE.xxl,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    originalPrice: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.muted,
        textDecorationLine: 'line-through',
    },
    lowStock: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.error,
        fontWeight: '600',
    },
    section: {
        marginBottom: SPACING.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    seeAllText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: '600',
    },
    description: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.secondary,
        lineHeight: 24,
    },
    optionButton: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.sm,
        minWidth: 40,
        alignItems: 'center',
    },
    optionButtonActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10', // 10% opacity
    },
    optionText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.primary,
    },
    optionTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    noReviews: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.muted,
        fontStyle: 'italic',
    },
    reviewPlaceholder: {
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
    },
    reviewText: {
        color: COLORS.text.secondary,
    },
    shopSection: {
        marginBottom: SPACING.lg,
        paddingTop: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    shopSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    noShopContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    noShopText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        fontWeight: '500',
    },
    shopProductsSection: {
        marginBottom: SPACING.lg,
    },
    shopProductsList: {
        paddingBottom: SPACING.sm,
    },
    shopProductItem: {
        width: 150,
        marginRight: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    shopCardWrapper: {
        // ShopCard has its own marginHorizontal: 16. Negate it so card fills full width
        marginHorizontal: -SPACING.md,
    },
    shopProductImageWrap: {
        width: '100%',
        height: 130,
        position: 'relative',
        backgroundColor: '#F4F4F8',
    },
    shopProductImage: {
        width: '100%',
        height: '100%',
    },
    shopProductBadge: {
        position: 'absolute',
        top: 6,
        left: 0,
        backgroundColor: COLORS.error,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    shopProductBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
    },
    shopProductInfo: {
        padding: 8,
        gap: 3,
    },
    shopProductName: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.primary,
        fontWeight: '500',
        lineHeight: 17,
    },
    shopProductPrice: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '800',
        color: COLORS.error,
    },
    shopProductRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    shopProductRatingText: {
        fontSize: 10,
        color: COLORS.text.secondary,
        fontWeight: '600',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.background,
        elevation: 8,
    },
    mainBottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.background,
        elevation: 10,
    },
    chatStoreBtn: {
        alignItems: 'center',
        marginRight: SPACING.lg,
    },
    chatStoreText: {
        fontSize: 10,
        color: COLORS.text.secondary,
        marginTop: 2,
    },
    actionButtonsContainer: {
        flex: 1,
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    outlineActionBtn: {
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    solidActionBtn: {
        flex: 1,
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.md,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledBtnOutline: {
        borderColor: COLORS.text.muted,
    },
    outlineActionText: {
        color: COLORS.primary,
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
    },
    solidActionText: {
        color: COLORS.text.inverse,
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
    },
    disabledText: {
        color: COLORS.text.muted,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        maxHeight: '80%',
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.md,
    },
    sheetProductSummary: {
        flexDirection: 'row',
        flex: 1,
        marginRight: SPACING.md,
    },
    sheetProductImage: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.md,
        marginRight: SPACING.md,
    },
    sheetProductInfo: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheetPrice: {
        fontSize: FONT_SIZE.xl,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    sheetStock: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        marginBottom: 2,
    },
    sheetSelection: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.primary,
    },
    sheetCloseBtn: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheetCloseIcon: {
        width: 16,
        height: 2,
        backgroundColor: COLORS.text.secondary,
        transform: [{ rotate: '45deg' }],
    },
    sheetScroll: {
        marginTop: SPACING.md,
    },
    sheetSection: {
        marginBottom: SPACING.lg,
    },
    sheetSectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginBottom: SPACING.sm,
    },
    sheetOptionsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
    },
    sheetOptionBtn: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sheetOptionBtnActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary + '10',
    },
    sheetOptionText: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.primary,
    },
    sheetOptionTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    sheetQuantitySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: SPACING.sm,
    },
    sheetQuantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
    },
    sheetQuantityBtn: {
        padding: SPACING.sm,
    },
    sheetQuantityText: {
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        width: 40,
        textAlign: 'center',
    },
    sheetConfirmBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.lg,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.md,
    },
    sheetConfirmText: {
        color: COLORS.text.inverse,
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        marginRight: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    quantityBtn: {
        padding: SPACING.md,
    },
    quantityText: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        minWidth: 30,
        textAlign: 'center',
    },
    addToCartBtn: {
        flex: 1,
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledBtn: {
        backgroundColor: COLORS.text.muted,
    },
    addToCartText: {
        color: COLORS.text.inverse,
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
    },
    errorText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.error,
        marginBottom: SPACING.md,
    },
    backButton: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    backButtonText: {
        color: COLORS.text.inverse,
        fontWeight: 'bold',
    },
    reviewsList: {
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
        backgroundColor: COLORS.primary + '20', // 20% opacity
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
        backgroundColor: '#dcfce7', // green-100
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: SPACING.sm,
    },
    verifiedText: {
        fontSize: 10,
        color: '#166534', // green-800
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
});

export default ProductDetailScreen;
