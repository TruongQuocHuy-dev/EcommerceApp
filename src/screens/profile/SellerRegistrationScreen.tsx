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
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { registerShop, updateShop, fetchMyShop, resetRegistrationStatus, clearShopError } from '../../store/shopSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchImageLibrary } from 'react-native-image-picker';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SellerRegistration'>;

interface InputFieldProps {
    label: string;
    icon: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: any;
    multiline?: boolean;
    numberOfLines?: number;
    autoCapitalize?: any;
    required?: boolean;
}

const InputField = ({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    multiline,
    numberOfLines,
    autoCapitalize,
    required,
}: InputFieldProps) => {
    const [focused, setFocused] = useState(false);

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
                {label}
                {required && <Text style={{ color: COLORS.error }}> *</Text>}
            </Text>
            <View style={[
                styles.inputWrapper,
                multiline && styles.inputWrapperMultiline,
                focused && styles.inputWrapperFocused
            ]}>
                <View style={[styles.inputIconWrap, multiline && { marginTop: 12 }]}>
                    <Icon 
                        name={icon} 
                        size={20} 
                        color={focused ? COLORS.primary : COLORS.text.muted} 
                    />
                </View>
                <TextInput
                    style={[styles.textInput, multiline && styles.textInputMultiline]}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.text.muted}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    textAlignVertical={multiline ? 'top' : 'center'}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                />
            </View>
        </View>
    );
};

const SellerRegistrationScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const dispatch = useAppDispatch();

    const { isLoading, error, registrationSuccess, myShop } = useAppSelector(state => state.shop);
    const { user } = useAppSelector(state => state.auth);

    const isSeller = user?.role === 'seller' || user?.role === 'admin';

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
    const [isInitialized, setIsInitialized] = useState(false);

    // Initial fetch if seller
    useEffect(() => {
        if (isSeller) {
            dispatch(fetchMyShop());
        }
    }, [isSeller, dispatch]);

    // Populate form data if shop exists
    useEffect(() => {
        if (isSeller && myShop && !isInitialized) {
            let street = '';
            let city = '';
            
            if (myShop.address) {
                if (typeof myShop.address === 'string') {
                    try {
                        const parsed = JSON.parse(myShop.address);
                        street = parsed.street || '';
                        city = parsed.city || '';
                    } catch (e) {
                        console.error('Error parsing shop address string:', e);
                        street = myShop.address;
                    }
                } else if (typeof myShop.address === 'object') {
                    street = myShop.address.street || '';
                    city = myShop.address.city || '';
                }
            }

            setFormData({
                name: myShop.name || '',
                description: myShop.description || '',
                phone: myShop.phone || '',
                email: myShop.email || '',
                street: street,
                city: city,
            });
            setIsInitialized(true);
        }
    }, [isSeller, myShop, isInitialized]);

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

        if (!formData.city.trim() || !formData.street.trim()) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin địa chỉ (Tỉnh/Thành phố và Tên đường)');
            return;
        }

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        if (formData.phone) data.append('phone', formData.phone);
        if (formData.email) data.append('email', formData.email);

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
                await dispatch(updateShop({ id: myShop._id, data })).unwrap();
                Alert.alert('Thành công', 'Cập nhật cửa hàng thành công!', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } catch (err: any) {
                // Handled by error useEffect usually
            }
        } else {
            dispatch(registerShop(data));
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="chevron-left" size={28} color={COLORS.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {isSeller ? 'Hồ sơ Cửa hàng' : 'Đăng Ký Bán Hàng'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {isLoading && !myShop ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : (
                    <ScrollView 
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* If registering, show a header message */}
                        {!isSeller && (
                            <View style={styles.infoBanner}>
                                <Icon name="storefront" size={28} color={COLORS.primary} />
                                <Text style={styles.infoBannerText}>
                                    Điền thông tin bên dưới để mở gian hàng bán sản phẩm của bạn!
                                </Text>
                            </View>
                        )}

                        {/* Interactive Store Header Preview Card */}
                        <Text style={styles.sectionHeaderTitle}>Giao diện hiển thị cửa hàng</Text>
                        <View style={styles.previewContainer}>
                            {/* Banner container */}
                            <TouchableOpacity 
                                style={styles.bannerContainer}
                                onPress={() => handleSelectImage('banner')}
                                activeOpacity={0.8}
                            >
                                {banner ? (
                                    <Image source={{ uri: banner.uri }} style={styles.bannerImage} />
                                ) : myShop?.banner ? (
                                    <Image source={{ uri: myShop.banner }} style={styles.bannerImage} />
                                ) : (
                                    <View style={styles.bannerPlaceholder}>
                                        <Icon name="image-plus" size={32} color={COLORS.text.muted} />
                                        <Text style={styles.bannerPlaceholderText}>Chọn ảnh bìa cửa hàng (Banner)</Text>
                                    </View>
                                )}
                                <View style={styles.bannerEditBadge}>
                                    <Icon name="camera" size={16} color="#fff" />
                                </View>
                            </TouchableOpacity>

                            {/* Logo container overlapping the banner */}
                            <TouchableOpacity 
                                style={styles.logoContainer}
                                onPress={() => handleSelectImage('logo')}
                                activeOpacity={0.8}
                            >
                                <View style={styles.logoWrapper}>
                                    {logo ? (
                                        <Image source={{ uri: logo.uri }} style={styles.logoImage} />
                                    ) : myShop?.logo ? (
                                        <Image source={{ uri: myShop.logo }} style={styles.logoImage} />
                                    ) : (
                                        <View style={styles.logoPlaceholder}>
                                            <Icon name="storefront" size={32} color="#fff" />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.logoEditBadge}>
                                    <Icon name="camera" size={13} color="#fff" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Section 1: Thông tin cơ bản */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
                            <View style={styles.sectionContent}>
                                <InputField
                                    label="Tên cửa hàng"
                                    icon="storefront-outline"
                                    placeholder="VD: Fashion Store 99"
                                    value={formData.name}
                                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                                    required
                                />

                                <InputField
                                    label="Mô tả cửa hàng"
                                    icon="text-subject"
                                    placeholder="Cửa hàng của bạn bán những gì?"
                                    value={formData.description}
                                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                                    multiline
                                    numberOfLines={4}
                                    required
                                />
                            </View>
                        </View>

                        {/* Section 2: Thông tin liên hệ */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                            <View style={styles.sectionContent}>
                                <InputField
                                    label="Số điện thoại liên hệ"
                                    icon="phone-outline"
                                    placeholder="VD: 0912345678"
                                    keyboardType="phone-pad"
                                    value={formData.phone}
                                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                />

                                <InputField
                                    label="Địa chỉ Email"
                                    icon="email-outline"
                                    placeholder="VD: store@example.com"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={formData.email}
                                    onChangeText={(text) => setFormData({ ...formData, email: text })}
                                />
                            </View>
                        </View>

                        {/* Section 3: Địa chỉ kinh doanh */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Địa chỉ kinh doanh</Text>
                            <View style={styles.sectionContent}>
                                <InputField
                                    label="Tỉnh/Thành phố, Quận/Huyện, Phường/Xã"
                                    icon="city-variant-outline"
                                    placeholder="VD: TP. Hồ Chí Minh, Quận 1, Phường Bến Nghé"
                                    value={formData.city}
                                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                                    required
                                />

                                <InputField
                                    label="Tên đường, Tòa nhà, Số nhà"
                                    icon="home-map-marker"
                                    placeholder="VD: Số 10, Lý Tự Trọng"
                                    value={formData.street}
                                    onChangeText={(text) => setFormData({ ...formData, street: text })}
                                    required
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, styles.submitButtonGreen, isLoading && styles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Icon name="content-save-outline" size={20} color="#fff" />
                                    <Text style={styles.submitButtonText}>
                                        {isSeller ? 'Cập nhật Hồ Sơ' : 'Gửi yêu cầu đăng ký'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: '#fff',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: 'bold',
        color: COLORS.text.primary,
    },
    scrollContent: {
        padding: SPACING.md,
        paddingBottom: 40,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary + '10',
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
        borderRadius: 16,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
        gap: 12,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.text.primary,
        fontWeight: '600',
        lineHeight: 18,
    },
    sectionHeaderTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: SPACING.xs,
        marginLeft: SPACING.xs,
    },
    previewContainer: {
        position: 'relative',
        height: 185,
        marginBottom: SPACING.xl,
        marginTop: SPACING.xs,
    },
    bannerContainer: {
        height: 130,
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    bannerPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    bannerPlaceholderText: {
        marginTop: 6,
        fontSize: 12,
        color: COLORS.text.muted,
        fontWeight: '500',
        textAlign: 'center',
    },
    bannerEditBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(30, 41, 59, 0.65)',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    logoContainer: {
        position: 'absolute',
        bottom: 10,
        left: 20,
        zIndex: 10,
    },
    logoWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        borderWidth: 3,
        borderColor: '#fff',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 4,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    logoPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
    },
    logoEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.text.primary,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    section: {
        marginBottom: SPACING.lg,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: SPACING.xs,
        marginLeft: SPACING.xs,
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    inputGroup: {
        marginBottom: SPACING.md,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.text.primary,
        marginBottom: 6,
        marginLeft: 2,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    inputWrapperMultiline: {
        height: 110,
        alignItems: 'flex-start',
    },
    inputWrapperFocused: {
        borderColor: COLORS.primary,
        backgroundColor: '#fff',
    },
    inputIconWrap: {
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        height: '100%',
        fontSize: 14,
        color: COLORS.text.primary,
        padding: 0,
    },
    textInputMultiline: {
        height: '100%',
        paddingTop: 10,
        paddingBottom: 10,
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: BORDER_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: SPACING.md,
        marginBottom: 40,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonGreen: {
        backgroundColor: '#22c55e',
        shadowColor: '#22c55e',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SellerRegistrationScreen;
