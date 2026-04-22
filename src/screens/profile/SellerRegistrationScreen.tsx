import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerShop, updateShop, fetchMyShop, resetRegistrationStatus, clearShopError } from '../../store/shopSlice';
import { ChevronLeft, Store, Image as ImageIcon } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SellerRegistration'>;

const SellerRegistrationScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useAppDispatch();

    const { isLoading, error, registrationSuccess, myShop } = useAppSelector(state => state.shop);
    const { user } = useAppSelector(state => state.auth);

    const isSeller = user?.role === 'seller';

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        phone: '',
        email: '',
        street: '',
        city: '',
    });

    const [logo, setLogo] = useState<any>(null);
    const [banner, setBanner] = useState<any>(null);

    // Initial fetch if seller
    useEffect(() => {
        if (isSeller && !myShop) {
            dispatch(fetchMyShop());
        }
    }, [isSeller, myShop, dispatch]);

    // Populate form data if shop exists
    useEffect(() => {
        if (isSeller && myShop) {
            setFormData({
                name: myShop.name || '',
                description: myShop.description || '',
                phone: myShop.phone || '',
                email: myShop.email || '',
                street: myShop.address?.street || '',
                city: myShop.address?.city || '',
            });
            // We don't populate local file objects, we'll just display the URL if they don't pick a new one
        }
    }, [isSeller, myShop]);

    useEffect(() => {
        if (registrationSuccess) {
            Alert.alert(
                'Thành công',
                isSeller
                    ? 'Thông tin cửa hàng đã được cập nhật thành công.'
                    : 'Đăng ký cửa hàng của bạn đã được gửi. Quản trị viên sẽ phê duyệt trong thời gian sớm nhất.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            dispatch(resetRegistrationStatus());
                            navigation.goBack();
                        }
                    }
                ]
            );
        }
    }, [registrationSuccess, navigation, dispatch, isSeller]);

    useEffect(() => {
        if (error) {
            Alert.alert('Lỗi', error, [
                { text: 'OK', onPress: () => dispatch(clearShopError()) }
            ]);
        }
    }, [error, dispatch]);

    const handleSelectImage = async (type: 'logo' | 'banner') => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.assets && result.assets.length > 0) {
            if (type === 'logo') {
                setLogo(result.assets[0]);
            } else {
                setBanner(result.assets[0]);
            }
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.description.trim()) {
            Alert.alert('Lỗi', 'Vui lòng nhập tên và mô tả cửa hàng');
            return;
        }

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        if (formData.phone) data.append('phone', formData.phone);
        if (formData.email) data.append('email', formData.email);

        // Construct address safely. For simplicity, we just send top-level fields 
        // if the backend handles flat address object differently, or send object if parsing properly.
        // Assuming backend can parse 'address.street' or we just send it as street and city and update Backend later if needed.
        // Actually, in shop.controller.js we send it as an object from the frontend in standard JSON.
        // With FormData, nested objects need to be stringified.
        data.append('address', JSON.stringify({
            street: formData.street,
            city: formData.city,
            country: 'Vietnam'
        }));

        if (logo) {
            data.append('logo', {
                uri: logo.uri,
                type: logo.type || 'image/jpeg',
                name: logo.fileName || 'logo.jpg',
            } as any);
        }

        if (banner) {
            data.append('banner', {
                uri: banner.uri,
                type: banner.type || 'image/jpeg',
                name: banner.fileName || 'banner.jpg',
            } as any);
        }

        if (isSeller && myShop) {
            try {
                // For updateShop, dispatching the action and unwrap it 
                // because we manual handle success via unwrapping or checking the state
                await dispatch(updateShop({ id: myShop._id, data })).unwrap();
                Alert.alert('Thành công', 'Cập nhật cửa hàng thành công!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } catch (err: any) {
                // Handled by error useEffect usually, but catch here just in case
            }
        } else {
            dispatch(registerShop(data));
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <ChevronLeft size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isSeller ? 'Sửa thông tin Cửa hàng' : 'Đăng Ký Bán Hàng'}</Text>
                <View style={{ width: 40 }} />
            </View>

            {isLoading && !myShop ? (
                <View style={{ flex: 1, justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {!isSeller && (
                        <View style={styles.iconContainer}>
                            <Store size={64} color={COLORS.primary} />
                            <Text style={styles.subtitle}>
                                Trở thành đối tác bán hàng của chúng tôi ngay hôm nay!
                            </Text>
                        </View>
                    )}

                    <Text style={styles.sectionTitle}>Hình ảnh Cửa Hàng</Text>

                    <View style={styles.imagePickersContainer}>
                        <View style={styles.imagePickerWrapper}>
                            <Text style={styles.label}>Logo</Text>
                            <TouchableOpacity style={styles.imagePicker} onPress={() => handleSelectImage('logo')}>
                                {logo ? (
                                    <Image source={{ uri: logo.uri }} style={styles.imagePreview} />
                                ) : myShop?.logo ? (
                                    <Image source={{ uri: myShop.logo }} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <ImageIcon size={32} color={COLORS.text.muted} />
                                        <Text style={styles.imagePlaceholderText}>Chọn Logo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>

                        <View style={styles.imagePickerWrapper}>
                            <Text style={styles.label}>Ảnh Bìa (Banner)</Text>
                            <TouchableOpacity style={[styles.imagePicker, styles.bannerPicker]} onPress={() => handleSelectImage('banner')}>
                                {banner ? (
                                    <Image source={{ uri: banner.uri }} style={styles.imagePreview} />
                                ) : myShop?.banner ? (
                                    <Image source={{ uri: myShop.banner }} style={styles.imagePreview} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <ImageIcon size={32} color={COLORS.text.muted} />
                                        <Text style={styles.imagePlaceholderText}>Chọn Banner</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Tên cửa hàng *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="VD: Fashion Store 99"
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Mô tả cửa hàng *</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Cửa hàng của bạn bán những gì?"
                            value={formData.description}
                            onChangeText={(text) => setFormData({ ...formData, description: text })}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Số điện thoại liên hệ</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0912345678"
                            keyboardType="phone-pad"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="store@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.sm }]}>
                            <Text style={styles.label}>Đường/Phố</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Số 1, Ngõ 2"
                                value={formData.street}
                                onChangeText={(text) => setFormData({ ...formData, street: text })}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: SPACING.sm }]}>
                            <Text style={styles.label}>Tỉnh/Thành phố</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Hà Nội"
                                value={formData.city}
                                onChangeText={(text) => setFormData({ ...formData, city: text })}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color={COLORS.text.inverse} />
                        ) : (
                            <Text style={styles.submitButtonText}>{isSeller ? 'Cập nhật Cửa Hàng' : 'Gửi yêu cầu đăng ký'}</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
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
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: '#fff',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
        marginTop: SPACING.md,
    },
    subtitle: {
        fontSize: FONT_SIZE.md,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginTop: SPACING.sm,
        paddingHorizontal: SPACING.xl,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        marginBottom: SPACING.md,
    },
    imagePickersContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.xl,
    },
    imagePickerWrapper: {
        flex: 1,
        marginRight: SPACING.sm,
    },
    imagePicker: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed',
    },
    bannerPicker: {
        aspectRatio: 2, // Wider for banner
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePlaceholderText: {
        marginTop: SPACING.xs,
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.muted,
    },
    formGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.md,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
    },
    textArea: {
        minHeight: 100,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        marginTop: SPACING.md,
        marginBottom: SPACING.xxl,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: COLORS.text.inverse,
        fontSize: FONT_SIZE.md,
        fontWeight: 'bold',
    },
});

export default SellerRegistrationScreen;
