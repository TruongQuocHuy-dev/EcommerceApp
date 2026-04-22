import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Image, Modal, FlatList, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, Asset } from 'react-native-image-picker';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createProduct, updateProduct, fetchProductById } from '../../store/productSlice';
import { fetchCategories } from '../../store/categorySlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type AddEditProductScreenRouteProp = RouteProp<RootStackParamList, 'AddEditProduct'>;
type AddEditProductScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AddEditProductScreen = () => {
    const navigation = useNavigation<AddEditProductScreenNavigationProp>();
    const route = useRoute<AddEditProductScreenRouteProp>();
    const dispatch = useAppDispatch();

    const { productId, isEdit } = route.params || {};
    const { isLoading, currentProduct } = useAppSelector((state) => state.product);
    const { categories, isLoading: isCategoriesLoading } = useAppSelector((state) => state.category);

    const [activeTab, setActiveTab] = useState<'general' | 'variants'>('general');
    const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

    const [form, setForm] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        categoryName: '',
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
        if (isEdit && productId) {
            dispatch(fetchProductById(productId));
        }
    }, [isEdit, productId, dispatch]);

    // Populate form data when currentProduct is ready
    useEffect(() => {
        if (isEdit && currentProduct && currentProduct.id === productId) {
            const catId = typeof currentProduct.category === 'object' ? (currentProduct.category?._id || currentProduct.category?.id) : currentProduct.category;
            const catName = categories.find((c: any) => c._id === catId || c.id === catId)?.name || '';

            setForm({
                name: currentProduct.name || '',
                description: currentProduct.description || '',
                price: currentProduct.price?.toString() || '',
                stock: currentProduct.stock?.toString() || '',
                category: catId || '',
                categoryName: catName || 'Select Category',
                isFeatured: currentProduct.isFeatured || false,
            });
            setExistingImages(currentProduct.images || []);
            setTierVariations(currentProduct.tierVariations || []);
            setSkus(currentProduct.skus || []);
        }
    }, [isEdit, currentProduct, productId, categories]);

    const handleChange = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSelectCategory = (cat: any) => {
        setForm(prev => ({ ...prev, category: cat._id || cat.id, categoryName: cat.name }));
        setCategoryModalVisible(false);
    };

    const handlePickImage = async () => {
        const totalImages = images.length + existingImages.length;
        if (totalImages >= 5) {
            Alert.alert('Limit Reached', 'You can only upload up to 5 images.');
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
        if (!form.name || !form.price || !form.stock || !form.category) {
            Alert.alert('Error', 'Please fill in all required fields (Name, Price, Stock, Category).');
            return;
        }

        if (images.length === 0 && existingImages.length === 0) {
            Alert.alert('Error', 'Please provide at least one product image.');
            return;
        }

        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('description', form.description || '');
        formData.append('price', form.price);
        formData.append('stock', form.stock);
        formData.append('category', form.category);
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

        // Note: For existing images, the API might not support retaining them if new images are uploaded via FormData 
        // without a specific protocol, but we'll leave it simple for now, as standard multipart usually overwrites 
        // or expects all assets. This strictly follows standard React Native multi-part.

        try {
            if (isEdit && productId) {
                await dispatch(updateProduct({ id: productId, data: formData })).unwrap();
                Alert.alert('Success', 'Product updated successfully');
            } else {
                await dispatch(createProduct(formData)).unwrap();
                Alert.alert('Success', 'Product created successfully');
            }
            navigation.goBack();
        } catch (error: any) {
            Alert.alert('Error', typeof error === 'string' ? error : 'Operation failed');
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
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? 'Edit Product' : 'Add New Product'}</Text>
                <View style={styles.headerButton} />
            </View>

            {/* Tab Header */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'general' && styles.activeTabButton]}
                    onPress={() => setActiveTab('general')}
                >
                    <Icon name="package-variant-closed" size={20} color={activeTab === 'general' ? COLORS.primary : COLORS.text.secondary} />
                    <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>General Info</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'variants' && styles.activeTabButton]}
                    onPress={() => setActiveTab('variants')}
                >
                    <Icon name="tag-multiple" size={20} color={activeTab === 'variants' ? COLORS.primary : COLORS.text.secondary} />
                    <Text style={[styles.tabText, activeTab === 'variants' && styles.activeTabText]}>Variants</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>

                    {activeTab === 'general' && (
                        <View style={styles.section}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Product Name *</Text>
                                <TextInput
                                    style={styles.input}
                                    value={form.name}
                                    onChangeText={(text) => handleChange('name', text)}
                                    placeholder="Enter product name"
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.xs }]}>
                                    <Text style={styles.label}>Price *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.price}
                                        onChangeText={(text) => handleChange('price', text)}
                                        placeholder="0.00"
                                        keyboardType="numeric"
                                    />
                                </View>
                                <View style={[styles.formGroup, { flex: 1, marginLeft: SPACING.xs }]}>
                                    <Text style={styles.label}>Stock *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.stock}
                                        onChangeText={(text) => handleChange('stock', text)}
                                        placeholder="0"
                                        keyboardType="number-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Category *</Text>
                                <TouchableOpacity
                                    style={styles.dropdownButton}
                                    onPress={() => setCategoryModalVisible(true)}
                                >
                                    <Text style={form.categoryName ? styles.dropdownText : styles.dropdownPlaceholder}>
                                        {form.categoryName || 'Select a Category'}
                                    </Text>
                                    <Icon name="chevron-down" size={20} color={COLORS.text.secondary} />
                                </TouchableOpacity>
                            </View>

                            <View style={[styles.formGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                                <Text style={styles.label}>Feature this product</Text>
                                <TouchableOpacity
                                    style={[styles.checkboxButton, form.isFeatured && styles.checkboxActive]}
                                    onPress={() => handleChange('isFeatured', !form.isFeatured as any)}
                                >
                                    {form.isFeatured && <Icon name="check" size={16} color="#FFF" />}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={form.description}
                                    onChangeText={(text) => handleChange('description', text)}
                                    placeholder="Product description..."
                                    multiline
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Images (Max 5) *</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                                    {/* Existing Images */}
                                    {existingImages.map((img, index) => (
                                        <View key={`existing-${index}`} style={styles.imageWrapper}>
                                            <Image source={{ uri: img }} style={styles.thumbnail} />
                                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemoveExistingImage(index)}>
                                                <Icon name="close" size={16} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    {/* New Images */}
                                    {images.map((img, index) => (
                                        <View key={`new-${index}`} style={styles.imageWrapper}>
                                            <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => handleRemoveNewImage(index)}>
                                                <Icon name="close" size={16} color="#FFF" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    {/* Add Button */}
                                    {images.length + existingImages.length < 5 && (
                                        <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage}>
                                            <Icon name="plus" size={30} color={COLORS.primary} />
                                            <Text style={styles.addImageText}>Upload</Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    )}

                    {activeTab === 'variants' && (
                        <View style={styles.section}>
                            {tierVariations.map((tier, tIndex) => (
                                <View key={tIndex} style={styles.tierContainer}>
                                    <View style={styles.tierHeader}>
                                        <Text style={styles.label}>Variation {tIndex + 1} Name</Text>
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
                                        placeholder="e.g. Color, Size"
                                    />

                                    <Text style={[styles.label, { marginTop: SPACING.md }]}>Options</Text>
                                    <View style={styles.optionsContainer}>
                                        {tier.options.map((opt, oIndex) => (
                                            <View key={oIndex} style={styles.optionTag}>
                                                <Text style={styles.optionTagText}>{opt}</Text>
                                                <TouchableOpacity onPress={() => {
                                                    const newTiers = [...tierVariations];
                                                    newTiers[tIndex].options = newTiers[tIndex].options.filter((_, i) => i !== oIndex);
                                                    setTierVariations(newTiers);
                                                }}>
                                                    <Icon name="close" size={16} color={COLORS.primaryDark} />
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.addOptionRow}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, marginRight: SPACING.sm }]}
                                            value={optionInputs[tIndex] || ''}
                                            onChangeText={(text) => setOptionInputs(prev => ({ ...prev, [tIndex]: text }))}
                                            placeholder="Type option (e.g. Red, XL)"
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
                                            <Icon name="plus" size={24} color={COLORS.text.inverse} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}

                            {tierVariations.length < 2 && (
                                <TouchableOpacity
                                    style={styles.addTierBtn}
                                    onPress={() => setTierVariations([...tierVariations, { name: '', options: [] }])}
                                >
                                    <Icon name="plus" size={20} color={COLORS.primary} />
                                    <Text style={styles.addTierText}>Add Variation</Text>
                                </TouchableOpacity>
                            )}

                            {skus.length > 0 && (
                                <View style={styles.skusContainer}>
                                    <Text style={styles.skusTitle}>SKU Combinations ({skus.length})</Text>
                                    {skus.map((sku, sIndex) => {
                                        const skuName = sku.tierIndex.map((idx: number, tierIdx: number) => tierVariations[tierIdx]?.options[idx]).join(' / ');
                                        return (
                                            <View key={sIndex} style={styles.skuCard}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm }}>
                                                    <Text style={styles.skuName}>{skuName}</Text>
                                                    <TouchableOpacity onPress={() => handlePickSkuImage(sIndex)} style={styles.skuImageBtn}>
                                                        {sku.imageAsset ? (
                                                            <Image source={{ uri: sku.imageAsset.uri }} style={styles.skuThumbnail} />
                                                        ) : (sku.images && sku.images[0]) ? (
                                                            <Image source={{ uri: sku.images[0] }} style={styles.skuThumbnail} />
                                                        ) : (
                                                            <Icon name="camera-plus" size={20} color={COLORS.text.muted} />
                                                        )}
                                                    </TouchableOpacity>
                                                </View>
                                                <View style={styles.skuRow}>
                                                    <View style={styles.skuInputWrapper}>
                                                        <Text style={styles.skuLabel}>Price ($)</Text>
                                                        <TextInput
                                                            style={styles.skuInput}
                                                            value={sku.price?.toString()}
                                                            onChangeText={(text) => {
                                                                const newSkus = [...skus];
                                                                newSkus[sIndex].price = Number(text);
                                                                setSkus(newSkus);
                                                            }}
                                                            keyboardType="numeric"
                                                        />
                                                    </View>
                                                    <View style={styles.skuInputWrapper}>
                                                        <Text style={styles.skuLabel}>Stock</Text>
                                                        <TextInput
                                                            style={styles.skuInput}
                                                            value={sku.stock?.toString()}
                                                            onChangeText={(text) => {
                                                                const newSkus = [...skus];
                                                                newSkus[sIndex].stock = Number(text);
                                                                setSkus(newSkus);
                                                            }}
                                                            keyboardType="number-pad"
                                                        />
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Fix Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={COLORS.text.inverse} />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            {isEdit ? 'Update Product' : 'Create Product'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Category selection Modal */}
            <Modal visible={isCategoryModalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Category</Text>
                            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                                <Icon name="close" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>
                        {isCategoriesLoading ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                        ) : (
                            <FlatList
                                data={categories}
                                keyExtractor={(item: any) => item._id || item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.categoryItem} onPress={() => handleSelectCategory(item)}>
                                        <Text style={styles.categoryName}>{item.name}</Text>
                                    </TouchableOpacity>
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
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    headerButton: {
        padding: SPACING.xs,
        minWidth: 40,
    },
    title: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    tabButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.md,
        gap: SPACING.sm,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.secondary,
    },
    activeTabText: {
        color: COLORS.primary,
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: 100, // Make room for bottom bar
    },
    section: {
        gap: SPACING.lg,
    },
    formGroup: {
        gap: SPACING.xs,
    },
    label: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
        backgroundColor: COLORS.surface,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
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
        height: 120,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
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
        top: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: BORDER_RADIUS.full,
        padding: 2,
    },
    addImageBtn: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight + '20',
    },
    addImageText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.primary,
        marginTop: 4,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: SPACING.md,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: COLORS.text.inverse,
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
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
        height: '70%',
        padding: SPACING.lg,
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
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    categoryItem: {
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    categoryName: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
    },
    tierContainer: {
        backgroundColor: COLORS.surface,
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
        marginBottom: SPACING.xs,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginTop: SPACING.xs,
        marginBottom: SPACING.sm,
    },
    optionTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight + '40',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
        gap: 4,
    },
    optionTagText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.primaryDark,
        fontWeight: '500',
    },
    addOptionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addOptionBtn: {
        backgroundColor: COLORS.primary,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: BORDER_RADIUS.md,
    },
    addTierBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    addTierText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.primary,
        fontWeight: '600',
        marginLeft: SPACING.xs,
    },
    skusContainer: {
        marginTop: SPACING.lg,
    },
    skusTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: SPACING.md,
    },
    skuCard: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.sm,
        padding: SPACING.md,
        marginBottom: SPACING.sm,
    },
    skuName: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.primary,
        flex: 1,
    },
    skuRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    skuInputWrapper: {
        flex: 1,
    },
    skuLabel: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        marginBottom: 4,
    },
    skuInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.sm,
        padding: SPACING.sm,
        fontSize: FONT_SIZE.md,
        backgroundColor: COLORS.background,
    },
    checkboxButton: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    skuImageBtn: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.sm,
        backgroundColor: COLORS.background,
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
});

export default AddEditProductScreen;
