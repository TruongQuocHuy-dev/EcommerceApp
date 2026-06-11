import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Image, Modal, FlatList, KeyboardAvoidingView, Platform,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createProduct, updateProduct, fetchProductById } from '../../store/productSlice';
import { fetchCategories } from '../../store/categorySlice';
import { fetchMyShop } from '../../store/shopSlice';
import api from '../../api/client';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type AddEditProductScreenRouteProp = RouteProp<RootStackParamList, 'AddEditProduct'>;
type AddEditProductScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const getFlattenedCategories = (cats: any[], prefix = ''): any[] => {
    let list: any[] = [];
    cats.forEach((cat) => {
        const displayName = prefix ? `${prefix} ➔ ${cat.name}` : cat.name;
        const flatCat = { ...cat, displayName };
        list.push(flatCat);
        if (cat.children && cat.children.length > 0) {
            list = list.concat(getFlattenedCategories(cat.children, displayName));
        }
    });
    return list;
};

const AddEditProductScreen = () => {
    const navigation = useNavigation<AddEditProductScreenNavigationProp>();
    const route = useRoute<AddEditProductScreenRouteProp>();
    const dispatch = useAppDispatch();

    const { productId, isEdit } = route.params || {};
    const { isLoading, currentProduct } = useAppSelector((state) => state.product);
    const { categories, isLoading: isCategoriesLoading } = useAppSelector((state) => state.category);
    const { myShop } = useAppSelector((state) => state.shop);

    const [activeTab, setActiveTab] = useState<'general' | 'variants' | 'seo'>('general');
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
    const [isBrandModalVisible, setBrandModalVisible] = useState(false);
    const [isSupplierModalVisible, setSupplierModalVisible] = useState(false);

    const [categorySearch, setCategorySearch] = useState('');
    const [modalCategoryPath, setModalCategoryPath] = useState<any[]>([]);

    const flatCategories = getFlattenedCategories(categories);
    const filteredFlatCategories = flatCategories.filter(cat =>
        cat.displayName.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const [brands, setBrands] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [isBrandsLoading, setIsBrandsLoading] = useState(false);
    const [isSuppliersLoading, setIsSuppliersLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        categoryName: '',
        brand: '',
        brandName: '',
        supplier: '',
        supplierName: '',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        isFeatured: false,
    });

    const [images, setImages] = useState<Asset[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]); // URLs of existing images for edit mode

    // Variants State
    const [tierVariations, setTierVariations] = useState<{ name: string; options: string[] }[]>([]);
    const [skus, setSkus] = useState<any[]>([]);
    const [optionInputs, setOptionInputs] = useState<{ [key: number]: string }>({}); // Track option inputs per tier

    // Generate SKUs when tierVariations change
    useEffect(() => {
        if (tierVariations.length === 0) {
            setSkus([]);
            return;
        }

        const validTiers = tierVariations.filter(t => t.name && t.options.length > 0);
        if (validTiers.length === 0) {
            setSkus([]);
            return;
        }

        const generateCombinations = (tiers: any[], currentCombo: string[] = [], currentIndices: number[] = []): any[] => {
            if (tiers.length === 0) {
                return [{ options: currentCombo, indices: currentIndices }];
            }
            const [firstTier, ...restTiers] = tiers;
            let results: any[] = [];
            firstTier.options.forEach((opt: string, idx: number) => {
                results = results.concat(generateCombinations(restTiers, [...currentCombo, opt], [...currentIndices, idx]));
            });
            return results;
        };

        const combinations = generateCombinations(validTiers);
        setSkus(prevSkus => {
            return combinations.map(combo => {
                const tierIndex = combo.indices;
                const existing = prevSkus.find(s =>
                    s.tierIndex?.length === tierIndex.length &&
                    s.tierIndex.every((val: number, i: number) => Number(val) === Number(tierIndex[i]))
                );

                if (existing) {
                    return { ...existing, tierIndex };
                }

                return {
                    tierIndex,
                    skuCode: `${validTiers.map((t, i) => combo.options[i]?.toUpperCase().slice(0, 3)).join('-')}-${Date.now().toString().slice(-4)}`,
                    price: Number(form.price) || 0,
                    stock: Number(form.stock) || 0,
                    isActive: true
                };
            });
        });

    }, [tierVariations]);

    // Fetch initial data
    useEffect(() => {
        dispatch(fetchCategories());

        // Fetch my shop if not already loaded
        if (!myShop) {
            dispatch(fetchMyShop());
        }
        
        const fetchBrandsAndSuppliers = async () => {
            try {
                setIsBrandsLoading(true);
                const brandRes = await api.get('/brands');
                setBrands(brandRes.data.data?.brands || []);
            } catch (error) {
                console.error('Failed to fetch brands', error);
            } finally {
                setIsBrandsLoading(false);
            }

            try {
                setIsSuppliersLoading(true);
                const supplierRes = await api.get('/suppliers');
                setSuppliers(supplierRes.data.data?.suppliers || []);
            } catch (error) {
                console.error('Failed to fetch suppliers', error);
            } finally {
                setIsSuppliersLoading(false);
            }
        };

        fetchBrandsAndSuppliers();

        if (isEdit && productId) {
            dispatch(fetchProductById(productId));
        }
    }, [isEdit, productId, dispatch, myShop]);

    // Populate form data when currentProduct is ready
    useEffect(() => {
        if (isEdit && currentProduct && currentProduct.id === productId) {
            const catId = typeof currentProduct.category === 'object' ? (currentProduct.category?._id || currentProduct.category?.id) : currentProduct.category;
            
            const flatCats = getFlattenedCategories(categories);
            const catName = flatCats.find((c: any) => (c._id || c.id) === catId)?.displayName || '';

            const brandId = typeof currentProduct.brand === 'object' ? (currentProduct.brand?._id || currentProduct.brand?.id) : currentProduct.brand;
            const brandName = brands.find((b: any) => (b._id || b.id) === brandId)?.name || '';

            const supplierId = typeof currentProduct.supplier === 'object' ? (currentProduct.supplier?._id || currentProduct.supplier?.id) : currentProduct.supplier;
            const supplierName = suppliers.find((s: any) => (s._id || s.id) === supplierId)?.name || '';

            setForm({
                name: currentProduct.name || '',
                description: currentProduct.description || '',
                price: currentProduct.price?.toString() || '',
                stock: currentProduct.stock?.toString() || '',
                category: catId || '',
                categoryName: catName || 'Chọn danh mục',
                brand: brandId || '',
                brandName: brandName || 'Chọn thương hiệu',
                supplier: supplierId || '',
                supplierName: supplierName || 'Chọn nhà cung cấp',
                metaTitle: currentProduct.metaTitle || '',
                metaDescription: currentProduct.metaDescription || '',
                metaKeywords: currentProduct.metaKeywords || '',
                isFeatured: currentProduct.isFeatured || false,
            });
            setExistingImages(currentProduct.images || []);
            setTierVariations(currentProduct.tierVariations || []);
            setSkus(currentProduct.skus || []);
        }
    }, [isEdit, currentProduct, productId, categories, brands, suppliers]);

    const handleChange = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSelectCategory = (cat: any) => {
        setForm(prev => ({ ...prev, category: cat._id || cat.id, categoryName: cat.displayName }));
        setCategoryModalVisible(false);
    };

    const handleSelectBrand = (brand: any) => {
        setForm(prev => ({ ...prev, brand: brand._id || brand.id, brandName: brand.name }));
        setBrandModalVisible(false);
    };

    const handleSelectSupplier = (supplier: any) => {
        setForm(prev => ({ ...prev, supplier: supplier._id || supplier.id, supplierName: supplier.name }));
        setSupplierModalVisible(false);
    };

    const handlePickImage = async () => {
        const totalImages = images.length + existingImages.length;
        if (totalImages >= 5) {
            Alert.alert('Đạt giới hạn', 'Bạn chỉ có thể tải lên tối đa 5 hình ảnh sản phẩm.');
            return;
        }

        const result = await launchImageLibrary({
            mediaType: 'photo',
            selectionLimit: 5 - totalImages,
        });

        if (result.assets) {
            setImages(prev => [...prev, ...result.assets!]);
        }
    };

    const handlePickSkuImage = async (index: number) => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            selectionLimit: 1,
        });

        if (result.assets && result.assets.length > 0) {
            const newSkus = [...skus];
            newSkus[index].imageAsset = result.assets[0];
            setSkus(newSkus);
        }
    };

    const handleRemoveNewImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExistingImage = (index: number) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (myShop?.status === 'suspended') {
            Alert.alert('Thông báo', 'Cửa hàng của bạn đang bị tạm khóa. Không thể thực hiện thao tác này.');
            return;
        }

        if (!form.name || !form.price || !form.stock || !form.category) {
            Alert.alert('Lỗi nhập liệu', 'Vui lòng điền đầy đủ các trường thông tin bắt buộc (Tên, Giá, Kho hàng, Danh mục).');
            return;
        }

        if (images.length === 0 && existingImages.length === 0) {
            Alert.alert('Lỗi tải ảnh', 'Vui lòng chọn ít nhất một hình ảnh sản phẩm.');
            return;
        }

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('description', form.description || '');
        formData.append('price', form.price);
        formData.append('stock', form.stock);
        formData.append('category', form.category);
        formData.append('brand', form.brand || '');
        formData.append('supplier', form.supplier || '');
        formData.append('metaTitle', form.metaTitle || '');
        formData.append('metaDescription', form.metaDescription || '');
        formData.append('metaKeywords', form.metaKeywords || '');
        formData.append('isFeatured', String(form.isFeatured));

        // Clean up UI-only properties from skus before stringifying
        const cleanedSkus = skus.map(sku => {
            const { imageAsset, ...rest } = sku;
            return rest;
        });

        // Variants
        formData.append('tierVariations', JSON.stringify(tierVariations));
        formData.append('skus', JSON.stringify(cleanedSkus));

        // Append SKU images
        skus.forEach((sku, index) => {
            if (sku.imageAsset) {
                formData.append(`skuImages_${index}`, {
                    uri: sku.imageAsset.uri,
                    type: sku.imageAsset.type || 'image/jpeg',
                    name: sku.imageAsset.fileName || `sku_image_${index}.jpg`,
                } as any);
            }
        });

        // Append new images
        images.forEach((img, index) => {
            formData.append('images', {
                uri: img.uri,
                type: img.type || 'image/jpeg',
                name: img.fileName || `product_image_${index}.jpg`,
            } as any);
        });

        try {
            if (isEdit && productId) {
                await dispatch(updateProduct({ id: productId, data: formData })).unwrap();
                Alert.alert('Thành công', 'Cập nhật sản phẩm thành công');
            } else {
                await dispatch(createProduct(formData)).unwrap();
                Alert.alert('Thành công', 'Đăng sản phẩm mới thành công');
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Lỗi hệ thống', typeof error === 'string' ? error : 'Thao tác thất bại');
        }
    };

    if (isEdit && isLoading && !currentProduct) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor="#16a34a" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? 'Cập nhật sản phẩm' : 'Đăng sản phẩm mới'}</Text>
                <View style={styles.headerButton} />
            </View>

            {/* Tab Header */}
            <View style={styles.tabWrapper}>
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'general' && styles.activeTabButton]}
                        onPress={() => setActiveTab('general')}
                    >
                        <Icon name="package-variant-closed" size={18} color={activeTab === 'general' ? '#FFF' : COLORS.text.secondary} />
                        <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>Thông tin</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'variants' && styles.activeTabButton]}
                        onPress={() => setActiveTab('variants')}
                    >
                        <Icon name="tag-multiple" size={18} color={activeTab === 'variants' ? '#FFF' : COLORS.text.secondary} />
                        <Text style={[styles.tabText, activeTab === 'variants' && styles.activeTabText]}>Phân loại</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'seo' && styles.activeTabButton]}
                        onPress={() => setActiveTab('seo')}
                    >
                        <Icon name="search-web" size={18} color={activeTab === 'seo' ? '#FFF' : COLORS.text.secondary} />
                        <Text style={[styles.tabText, activeTab === 'seo' && styles.activeTabText]}>SEO</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>

                    {activeTab === 'general' && (
                        <View style={styles.section}>
                            <View style={styles.formCard}>
                                <Text style={styles.cardTitle}>Thông tin cơ bản</Text>
                                <Text style={styles.cardSubtitle}>Điền các thông tin cơ bản cho sản phẩm mới</Text>
                                
                                <View style={styles.formGroup}>
                                    <View style={styles.labelRow}>
                                        <Icon name="pencil-box-outline" size={18} color={COLORS.primary} />
                                        <Text style={styles.label}>Tên sản phẩm *</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={form.name}
                                        onChangeText={(text) => handleChange('name', text)}
                                        placeholder="Nhập tên sản phẩm..."
                                        placeholderTextColor={COLORS.text.muted}
                                    />
                                </View>

                                <View style={styles.formGroup}>
                                    <View style={styles.labelRow}>
                                        <Icon name="folder-outline" size={18} color={COLORS.primary} />
                                        <Text style={styles.label}>Danh mục sản phẩm *</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.dropdownButton}
                                        onPress={() => setCategoryModalVisible(true)}
                                    >
                                        <Text style={form.categoryName && form.categoryName !== 'Select Category' ? styles.dropdownText : styles.dropdownPlaceholder}>
                                            {form.categoryName && form.categoryName !== 'Select Category' ? form.categoryName : 'Chọn danh mục'}
                                        </Text>
                                        <Icon name="chevron-down" size={20} color={COLORS.text.secondary} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.row}>
                                    <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.sm }]}>
                                        <View style={styles.labelRow}>
                                            <Icon name="tag-outline" size={18} color={COLORS.primary} />
                                            <Text style={styles.label}>Thương hiệu</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.dropdownButton}
                                            onPress={() => setBrandModalVisible(true)}
                                        >
                                            <Text style={form.brandName && form.brandName !== 'Select Brand' ? styles.dropdownText : styles.dropdownPlaceholder} numberOfLines={1}>
                                                {form.brandName && form.brandName !== 'Select Brand' ? form.brandName : 'Chọn thương hiệu'}
                                            </Text>
                                            <Icon name="chevron-down" size={20} color={COLORS.text.secondary} />
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[styles.formGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                                        <View style={styles.labelRow}>
                                            <Icon name="truck-delivery-outline" size={18} color={COLORS.primary} />
                                            <Text style={styles.label}>Nhà cung cấp</Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.dropdownButton}
                                            onPress={() => setSupplierModalVisible(true)}
                                        >
                                            <Text style={form.supplierName && form.supplierName !== 'Select Supplier' ? styles.dropdownText : styles.dropdownPlaceholder} numberOfLines={1}>
                                                {form.supplierName && form.supplierName !== 'Select Supplier' ? form.supplierName : 'Chọn nhà cung cấp'}
                                            </Text>
                                            <Icon name="chevron-down" size={20} color={COLORS.text.secondary} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.xs }]}>
                                    <View style={styles.labelRow}>
                                        <Icon name="star-outline" size={18} color={COLORS.primary} />
                                        <Text style={styles.label}>Đặt làm sản phẩm nổi bật</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.checkboxButton, form.isFeatured && styles.checkboxActive]}
                                        onPress={() => handleChange('isFeatured', !form.isFeatured as any)}
                                    >
                                        {form.isFeatured && <Icon name="check" size={16} color="#FFF" />}
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.formGroup}>
                                    <View style={styles.labelRow}>
                                        <Icon name="text-box-outline" size={18} color={COLORS.primary} />
                                        <Text style={styles.label}>Mô tả sản phẩm</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={form.description}
                                        onChangeText={(text) => handleChange('description', text)}
                                        placeholder="Nhập mô tả chi tiết của sản phẩm..."
                                        placeholderTextColor={COLORS.text.muted}
                                        multiline
                                    />
                                </View>
                            </View>

                            <View style={styles.formCard}>
                                <Text style={styles.cardTitle}>Giá bán & Kho hàng</Text>
                                <Text style={styles.cardSubtitle}>Thiết lập giá và số lượng tồn kho sản phẩm</Text>
                                <View style={styles.row}>
                                    <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.sm }]}>
                                        <View style={styles.labelRow}>
                                            <Icon name="currency-usd" size={18} color={COLORS.primary} />
                                            <Text style={styles.label}>Giá bán *</Text>
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            value={form.price}
                                            onChangeText={(text) => handleChange('price', text)}
                                            placeholder="0.00"
                                            placeholderTextColor={COLORS.text.muted}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={[styles.formGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                                        <View style={styles.labelRow}>
                                            <Icon name="archive-outline" size={18} color={COLORS.primary} />
                                            <Text style={styles.label}>Kho hàng *</Text>
                                        </View>
                                        <TextInput
                                            style={[styles.input, skus.length > 0 && { backgroundColor: COLORS.divider, color: COLORS.text.muted }]}
                                            value={form.stock}
                                            onChangeText={(text) => handleChange('stock', text)}
                                            placeholder="0"
                                            placeholderTextColor={COLORS.text.muted}
                                            keyboardType="number-pad"
                                            editable={skus.length === 0}
                                        />
                                        {skus.length > 0 && (
                                            <Text style={[styles.helperText, { color: COLORS.secondaryDark, fontWeight: '500' }]}>⚠️ Quản lý theo phân loại</Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formCard}>
                                <Text style={styles.cardTitle}>Hình ảnh sản phẩm</Text>
                                <Text style={styles.cardSubtitle}>Đăng tải tối đa 5 hình ảnh chất lượng cao</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                                    {/* Existing Images */}
                                    {existingImages.map((img, index) => (
                                        <View key={`existing-${index}`} style={styles.imageWrapper}>
                                            <Image source={{ uri: img }} style={styles.thumbnail} />
                                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemoveExistingImage(index)}>
                                                <Icon name="close" size={14} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    {/* New Images */}
                                    {images.map((img, index) => (
                                        <View key={`new-${index}`} style={styles.imageWrapper}>
                                            <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemoveNewImage(index)}>
                                                <Icon name="close" size={14} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    {/* Add Button */}
                                    {images.length + existingImages.length < 5 && (
                                        <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage}>
                                            <Icon name="camera-plus-outline" size={26} color={COLORS.primary} />
                                            <Text style={styles.addImageText}>Tải ảnh</Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    )}

                    {activeTab === 'variants' && (
                        <View style={styles.section}>
                            <View style={styles.formCard}>
                                <Text style={styles.cardTitle}>Nhóm phân loại</Text>
                                <Text style={styles.cardSubtitle}>Thêm các nhóm phân loại (Tối đa 2 nhóm, ví dụ: Màu sắc, Kích thước)</Text>

                                {tierVariations.map((tier, tIndex) => (
                                    <View key={tIndex} style={styles.tierContainer}>
                                        <View style={styles.tierHeader}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <Icon name="layers-outline" size={18} color={COLORS.primary} />
                                                <Text style={styles.tierTitle}>Nhóm phân loại {tIndex + 1}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => {
                                                const newTiers = tierVariations.filter((_, i) => i !== tIndex);
                                                setTierVariations(newTiers);
                                            }}>
                                                <Icon name="trash-can-outline" size={20} color={COLORS.error} />
                                            </TouchableOpacity>
                                        </View>
                                        <TextInput
                                            style={styles.input}
                                            value={tier.name}
                                            onChangeText={(text) => {
                                                const newTiers = [...tierVariations];
                                                newTiers[tIndex].name = text;
                                                setTierVariations(newTiers);
                                            }}
                                            placeholder="Tên nhóm (ví dụ: Màu sắc, Kích cỡ)"
                                            placeholderTextColor={COLORS.text.muted}
                                        />

                                        <Text style={[styles.label, { marginTop: SPACING.md, fontSize: 13, color: COLORS.text.secondary }]}>Các tùy chọn:</Text>
                                        <View style={styles.optionsContainer}>
                                            {tier.options.map((opt, oIndex) => (
                                                <View key={oIndex} style={styles.optionTag}>
                                                    <Text style={styles.optionTagText}>{opt}</Text>
                                                    <TouchableOpacity onPress={() => {
                                                        const newTiers = [...tierVariations];
                                                        newTiers[tIndex].options = newTiers[tIndex].options.filter((_, i) => i !== oIndex);
                                                        setTierVariations(newTiers);
                                                    }}>
                                                        <Icon name="close" size={14} color={COLORS.primaryDark} />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>

                                        <View style={styles.addOptionRow}>
                                            <TextInput
                                                style={[styles.input, { flex: 1, marginRight: SPACING.sm }]}
                                                value={optionInputs[tIndex] || ''}
                                                onChangeText={(text) => setOptionInputs(prev => ({ ...prev, [tIndex]: text }))}
                                                placeholder="Nhập giá trị tùy chọn (ví dụ: Đỏ, L) rồi nhấn thêm"
                                                placeholderTextColor={COLORS.text.muted}
                                                onSubmitEditing={() => {
                                                    const val = optionInputs[tIndex]?.trim();
                                                    if (val && !tier.options.includes(val)) {
                                                        const newTiers = [...tierVariations];
                                                        newTiers[tIndex].options.push(val);
                                                        setTierVariations(newTiers);
                                                        setOptionInputs(prev => ({ ...prev, [tIndex]: '' }));
                                                    }
                                                }}
                                            />
                                            <TouchableOpacity
                                                style={styles.addOptionBtn}
                                                onPress={() => {
                                                    const val = optionInputs[tIndex]?.trim();
                                                    if (val && !tier.options.includes(val)) {
                                                        const newTiers = [...tierVariations];
                                                        newTiers[tIndex].options.push(val);
                                                        setTierVariations(newTiers);
                                                        setOptionInputs(prev => ({ ...prev, [tIndex]: '' }));
                                                    }
                                                }}
                                            >
                                                <Icon name="plus" size={22} color={COLORS.text.inverse} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}

                                {tierVariations.length < 2 && (
                                    <TouchableOpacity
                                        style={styles.addTierBtn}
                                        onPress={() => setTierVariations([...tierVariations, { name: '', options: [] }])}
                                    >
                                        <Icon name="plus-circle-outline" size={20} color={COLORS.primary} />
                                        <Text style={styles.addTierText}>Thêm nhóm phân loại</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {skus.length > 0 && (
                                <View style={styles.formCard}>
                                    <Text style={styles.cardTitle}>Danh sách phân loại hàng</Text>
                                    <Text style={styles.cardSubtitle}>Cập nhật giá và số lượng kho hàng riêng cho từng phân loại</Text>
                                    <View style={styles.skusContainer}>
                                        {skus.map((sku, sIndex) => {
                                            const skuName = sku.tierIndex.map((idx: number, tierIdx: number) => tierVariations[tierIdx]?.options[idx]).join(' - ');
                                            return (
                                                <View key={sIndex} style={styles.skuCard}>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
                                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                                                            <Icon name="cube-outline" size={18} color={COLORS.primary} />
                                                            <Text style={styles.skuName} numberOfLines={1}>{skuName}</Text>
                                                        </View>
                                                        <TouchableOpacity onPress={() => handlePickSkuImage(sIndex)} style={styles.skuImageBtn}>
                                                            {sku.imageAsset ? (
                                                                <Image source={{ uri: sku.imageAsset.uri }} style={styles.skuThumbnail} />
                                                            ) : (sku.images && sku.images[0]) ? (
                                                                <Image source={{ uri: sku.images[0] }} style={styles.skuThumbnail} />
                                                            ) : (
                                                                <Icon name="camera-plus" size={18} color={COLORS.text.muted} />
                                                            )}
                                                        </TouchableOpacity>
                                                    </View>
                                                    <View style={styles.skuRow}>
                                                        <View style={styles.skuInputWrapper}>
                                                            <Text style={styles.skuLabel}>Giá bán ($)</Text>
                                                            <TextInput
                                                                style={styles.skuInput}
                                                                value={sku.price?.toString()}
                                                                onChangeText={(text) => {
                                                                    const newSkus = [...skus];
                                                                    newSkus[sIndex].price = Number(text);
                                                                    setSkus(newSkus);
                                                                }}
                                                                keyboardType="numeric"
                                                                placeholder="0.00"
                                                                placeholderTextColor={COLORS.text.muted}
                                                            />
                                                        </View>
                                                        <View style={styles.skuInputWrapper}>
                                                            <Text style={styles.skuLabel}>Kho hàng</Text>
                                                            <TextInput
                                                                style={styles.skuInput}
                                                                value={sku.stock?.toString()}
                                                                onChangeText={(text) => {
                                                                    const newSkus = [...skus];
                                                                    newSkus[sIndex].stock = Number(text);
                                                                    setSkus(newSkus);
                                                                }}
                                                                keyboardType="number-pad"
                                                                placeholder="0"
                                                                placeholderTextColor={COLORS.text.muted}
                                                            />
                                                        </View>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'seo' && (
                        <View style={styles.section}>
                            <View style={styles.formCard}>
                                <Text style={styles.cardTitle}>Tối ưu hóa SEO</Text>
                                <Text style={styles.cardSubtitle}>Thiết lập thông tin tìm kiếm để tối ưu lượt hiển thị trên Google</Text>

                                <View style={styles.formGroup}>
                                    <View style={styles.labelRow}>
                                        <Icon name="google" size={18} color={COLORS.primary} />
                                        <Text style={styles.label}>Tiêu đề Meta</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={form.metaTitle}
                                        onChangeText={(text) => handleChange('metaTitle', text)}
                                        placeholder="Tiêu đề SEO hiển thị trên kết quả tìm kiếm..."
                                        placeholderTextColor={COLORS.text.muted}
                                    />
                                    <Text style={styles.helperText}>Khuyến nghị: 50-60 ký tự (Hiện tại: {form.metaTitle?.length || 0})</Text>
                                </View>

                                <View style={styles.formGroup}>
                                    <View style={styles.labelRow}>
                                        <Icon name="text-short" size={18} color={COLORS.primary} />
                                        <Text style={styles.label}>Mô tả Meta</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, styles.textArea, { height: 100 }]}
                                        value={form.metaDescription}
                                        onChangeText={(text) => handleChange('metaDescription', text)}
                                        placeholder="Tóm tắt ngắn gọn hiển thị dưới tiêu đề tìm kiếm..."
                                        placeholderTextColor={COLORS.text.muted}
                                        multiline
                                    />
                                    <Text style={styles.helperText}>Khuyến nghị: 150-160 ký tự (Hiện tại: {form.metaDescription?.length || 0})</Text>
                                </View>

                                <View style={styles.formGroup}>
                                    <View style={styles.labelRow}>
                                        <Icon name="key-outline" size={18} color={COLORS.primary} />
                                        <Text style={styles.label}>Từ khóa Meta</Text>
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        value={form.metaKeywords}
                                        onChangeText={(text) => handleChange('metaKeywords', text)}
                                        placeholder="tu-khoa-1, tu-khoa-2, tu-khoa-3..."
                                        placeholderTextColor={COLORS.text.muted}
                                    />
                                    <Text style={styles.helperText}>Danh sách các từ khóa, phân tách bằng dấu phẩy</Text>
                                </View>
                            </View>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Fix Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.submitButton, (isLoading || myShop?.status === 'suspended') && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={isLoading || myShop?.status === 'suspended'}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.text.inverse} />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {myShop?.status === 'suspended' ? 'Cửa hàng đang bị khóa' : isEdit ? 'Cập nhật sản phẩm' : 'Đăng sản phẩm mới'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Category selection Modal */}
            <Modal visible={isCategoryModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn Danh mục</Text>
                            <TouchableOpacity onPress={() => {
                                setCategoryModalVisible(false);
                                setCategorySearch('');
                                setModalCategoryPath([]);
                            }}>
                                <Icon name="close" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalSearchBar}>
                            <Icon name="magnify" size={20} color={COLORS.text.muted} />
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Tìm danh mục..."
                                value={categorySearch}
                                onChangeText={setCategorySearch}
                                placeholderTextColor={COLORS.text.muted}
                            />
                            {categorySearch ? (
                                <TouchableOpacity onPress={() => setCategorySearch('')}>
                                    <Icon name="close-circle" size={18} color={COLORS.text.muted} />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {isCategoriesLoading ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                        ) : categorySearch ? (
                            // Search Mode: Flat list with structured main name & parent path below
                            <FlatList
                                data={filteredFlatCategories}
                                keyExtractor={(item: any) => item._id || item.id}
                                renderItem={({ item }) => {
                                    const parts = item.displayName.split(' ➔ ');
                                    const parentPath = parts.slice(0, -1).join(' ➔ ');
                                    const name = parts[parts.length - 1];
                                    return (
                                        <TouchableOpacity style={styles.categoryItem} onPress={() => handleSelectCategory(item)}>
                                            <View>
                                                <Text style={styles.categoryMainName}>{name}</Text>
                                                {parentPath ? <Text style={styles.categoryParentPath}>{parentPath}</Text> : null}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        ) : (
                            // Drill-down hierarchy mode
                            <View style={{ flex: 1 }}>
                                {/* Breadcrumbs path & back action */}
                                {modalCategoryPath.length > 0 && (
                                    <View style={styles.breadcrumbRow}>
                                        <TouchableOpacity 
                                            style={styles.backButton}
                                            onPress={() => setModalCategoryPath(modalCategoryPath.slice(0, -1))}
                                        >
                                            <Icon name="arrow-left" size={16} color={COLORS.primary} />
                                            <Text style={styles.backButtonText}>Quay lại</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.breadcrumbText} numberOfLines={1}>
                                            {modalCategoryPath.map(c => c.name).join(' ➔ ')}
                                        </Text>
                                    </View>
                                )}

                                <FlatList
                                    data={[
                                        // Option to select current parent level category
                                        ...(modalCategoryPath.length > 0 ? [{
                                            _id: 'select-current',
                                            id: 'select-current',
                                            name: `✓ Chọn danh mục này: ${modalCategoryPath[modalCategoryPath.length - 1].name}`,
                                            isSelectCurrentAction: true
                                        }] : []),
                                        // Child categories at current path level
                                        ...(modalCategoryPath.length === 0 
                                            ? categories 
                                            : (modalCategoryPath[modalCategoryPath.length - 1].children || []))
                                    ]}
                                    keyExtractor={(item: any) => item._id || item.id}
                                    renderItem={({ item }) => {
                                        const hasChildren = item.children && item.children.length > 0;
                                        const isAction = item.isSelectCurrentAction;
                                        
                                        return (
                                            <TouchableOpacity 
                                                style={[styles.categoryItem, isAction && styles.categoryItemAction]} 
                                                onPress={() => {
                                                    if (isAction) {
                                                        const currentCat = modalCategoryPath[modalCategoryPath.length - 1];
                                                        const catId = currentCat._id || currentCat.id;
                                                        const found = flatCategories.find(c => (c._id || c.id) === catId);
                                                        if (found) {
                                                            handleSelectCategory(found);
                                                        }
                                                    } else if (hasChildren) {
                                                        setModalCategoryPath([...modalCategoryPath, item]);
                                                    } else {
                                                        const catId = item._id || item.id;
                                                        const found = flatCategories.find(c => (c._id || c.id) === catId);
                                                        if (found) {
                                                            handleSelectCategory(found);
                                                        }
                                                    }
                                                }}
                                            >
                                                <View style={styles.categoryItemContent}>
                                                    <Text style={[
                                                        styles.categoryName, 
                                                        isAction && { color: COLORS.primaryDark, fontWeight: '700' }
                                                    ]}>
                                                        {item.name}
                                                    </Text>
                                                    {!isAction && hasChildren && (
                                                        <Icon name="chevron-right" size={20} color={COLORS.text.muted} />
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    }}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Brand selection Modal */}
            <Modal visible={isBrandModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn Thương hiệu</Text>
                            <TouchableOpacity onPress={() => setBrandModalVisible(false)}>
                                <Icon name="close" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>
                        {isBrandsLoading ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={brands}
                                keyExtractor={(item: any) => item._id || item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.categoryItem} onPress={() => handleSelectBrand(item)}>
                                        <Text style={styles.categoryName}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={() => (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>Không tìm thấy thương hiệu nào</Text>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Supplier selection Modal */}
            <Modal visible={isSupplierModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn Nhà cung cấp</Text>
                            <TouchableOpacity onPress={() => setSupplierModalVisible(false)}>
                                <Icon name="close" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>
                        {isSuppliersLoading ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={suppliers}
                                keyExtractor={(item: any) => item._id || item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.categoryItem} onPress={() => handleSelectSupplier(item)}>
                                        <Text style={styles.categoryName}>{item.name}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={() => (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>Không tìm thấy nhà cung cấp nào</Text>
                                    </View>
                                )}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        backgroundColor: '#16a34a',
    },
    headerButton: {
        padding: SPACING.xs,
        minWidth: 40,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: '#FFF',
    },
    tabWrapper: {
        padding: SPACING.md,
        backgroundColor: COLORS.background,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderRadius: BORDER_RADIUS.lg,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: BORDER_RADIUS.md,
        gap: 6,
    },
    activeTabButton: {
        backgroundColor: '#16a34a',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
    },
    tabText: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text.secondary,
    },
    activeTabText: {
        color: '#FFF',
    },
    content: {
        paddingHorizontal: SPACING.md,
        paddingBottom: 120, // space for bottomBar
    },
    section: {
        gap: SPACING.md,
    },
    formCard: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    cardTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '800',
        color: COLORS.text.primary,
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.secondary,
        marginBottom: SPACING.md,
    },
    formGroup: {
        gap: 6,
        marginBottom: SPACING.md,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 10,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
        backgroundColor: '#f8fafc',
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: 10,
        backgroundColor: '#f8fafc',
    },
    dropdownText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
    },
    dropdownPlaceholder: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.muted,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        marginBottom: SPACING.xs,
    },
    imagesScroll: {
        flexDirection: 'row',
        paddingVertical: SPACING.xs,
    },
    imageWrapper: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.md,
        marginRight: SPACING.md,
        position: 'relative',
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: BORDER_RADIUS.full,
        padding: 3,
        zIndex: 10,
    },
    addImageBtn: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        gap: 2,
    },
    addImageText: {
        fontSize: 10,
        fontWeight: '700',
        color: COLORS.primary,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 10,
    },
    submitButton: {
        backgroundColor: '#16a34a',
        paddingVertical: 12,
        borderRadius: BORDER_RADIUS.full,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: COLORS.text.muted,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: BORDER_RADIUS.xl,
        borderTopRightRadius: BORDER_RADIUS.xl,
        height: '65%',
        padding: SPACING.md,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    categoryItem: {
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    categoryName: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
    },
    tierContainer: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        marginBottom: SPACING.md,
    },
    tierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    tierTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: SPACING.xs,
        marginBottom: SPACING.md,
    },
    optionTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(34, 197, 94, 0.12)',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 5,
        borderRadius: BORDER_RADIUS.md,
        gap: 4,
    },
    optionTagText: {
        fontSize: 12,
        color: COLORS.primaryDark,
        fontWeight: '700',
    },
    addOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addOptionBtn: {
        backgroundColor: '#16a34a',
        width: 42,
        height: 42,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.md,
    },
    addTierBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        borderRadius: BORDER_RADIUS.md,
        marginTop: SPACING.sm,
        gap: 6,
    },
    addTierText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '700',
    },
    skusContainer: {
        marginTop: SPACING.sm,
        gap: SPACING.sm,
    },
    skuCard: {
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
    },
    skuName: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text.primary,
        flex: 1,
    },
    skuRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    skuInputWrapper: {
        flex: 1,
    },
    skuLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.text.secondary,
        marginBottom: 4,
    },
    skuInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 6,
        fontSize: 13,
        color: COLORS.text.primary,
        backgroundColor: COLORS.surface,
    },
    checkboxButton: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
    },
    checkboxActive: {
        backgroundColor: '#16a34a',
        borderColor: '#16a34a',
    },
    skuImageBtn: {
        width: 38,
        height: 38,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    skuThumbnail: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    helperText: {
        fontSize: 11,
        color: COLORS.text.secondary,
        marginTop: 2,
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.secondary,
    },
    modalSearchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.sm,
        marginBottom: SPACING.md,
        gap: 4,
    },
    modalSearchInput: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 6,
        fontSize: 14,
        color: COLORS.text.primary,
    },
    breadcrumbRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingVertical: 8,
        paddingHorizontal: SPACING.sm,
        borderRadius: BORDER_RADIUS.md,
        marginBottom: SPACING.md,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: SPACING.sm,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    backButtonText: {
        fontSize: 12,
        color: COLORS.primaryDark,
        fontWeight: '700',
        marginLeft: 2,
    },
    breadcrumbText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.text.secondary,
        fontWeight: '600',
    },
    categoryItemAction: {
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
        paddingLeft: SPACING.sm - 3,
    },
    categoryItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    categoryMainName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: 2,
    },
    categoryParentPath: {
        fontSize: 11,
        color: COLORS.text.secondary,
    },
});

export default AddEditProductScreen;
