import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Switch } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppDispatch } from '../../store/hooks';
import { addAddress, updateAddress, fetchAddresses } from '../../store/orderSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type AddressFormNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FieldProps {
    label: string;
    icon: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder?: string;
    keyboardType?: any;
    required?: boolean;
}

const FormField = ({ label, icon, value, onChangeText, placeholder, keyboardType, required }: FieldProps) => (
    <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>
            {label}
            {required && <Text style={{ color: COLORS.error }}> *</Text>}
        </Text>
        <View style={styles.fieldInputRow}>
            <Icon name={icon} size={18} color={COLORS.text.muted} style={styles.fieldIcon} />
            <TextInput
                style={styles.fieldInput}
                placeholder={placeholder || label}
                placeholderTextColor={COLORS.text.muted}
                value={value}
                onChangeText={onChangeText}
                keyboardType={keyboardType}
            />
        </View>
    </View>
);

const AddressFormScreen = () => {
    const navigation = useNavigation<AddressFormNavigationProp>();
    const route = useRoute<any>();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();

    const existingAddress = route.params?.address;
    const isEdit = !!existingAddress;

    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: existingAddress?.name || '',
        phone: existingAddress?.phone || '',
        address: existingAddress?.address || '',
        city: existingAddress?.city || '',
        province: existingAddress?.province || '',
        postalCode: existingAddress?.postalCode || '',
        isDefault: existingAddress?.isDefault || false,
    });

    const updateField = (field: string, value: string | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const validate = () => {
        if (!form.name.trim()) return 'Vui lòng nhập họ tên';
        if (!form.phone.trim()) return 'Vui lòng nhập số điện thoại';
        if (!form.address.trim()) return 'Vui lòng nhập địa chỉ';
        if (!form.city.trim()) return 'Vui lòng nhập tỉnh/thành phố';
        return null;
    };

    const handleSubmit = async () => {
        const error = validate();
        if (error) {
            Alert.alert('Thiếu thông tin', error);
            return;
        }
        setLoading(true);
        try {
            if (isEdit) {
                await dispatch(updateAddress({ id: existingAddress.id, data: form })).unwrap();
            } else {
                await dispatch(addAddress(form)).unwrap();
            }
            await dispatch(fetchAddresses());
            navigation.goBack();
        } catch (err: any) {
            Alert.alert('Lỗi', err || 'Không thể lưu địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEdit ? 'Sửa địa chỉ' : 'Địa chỉ mới'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Contact Info Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="account-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
                        </View>
                        <FormField
                            label="Họ và tên"
                            icon="account-edit-outline"
                            value={form.name}
                            onChangeText={v => updateField('name', v)}
                            required
                        />
                        <FormField
                            label="Số điện thoại"
                            icon="phone-outline"
                            value={form.phone}
                            onChangeText={v => updateField('phone', v)}
                            keyboardType="phone-pad"
                            required
                        />
                    </View>

                    {/* Address Info Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Icon name="map-marker-outline" size={18} color={COLORS.primary} />
                            <Text style={styles.sectionTitle}>Địa chỉ</Text>
                        </View>
                        <FormField
                            label="Tỉnh/Thành phố, Quận/Huyện, Phường/Xã"
                            icon="city-variant-outline"
                            value={form.city}
                            onChangeText={v => updateField('city', v)}
                            placeholder="VD: TP. Hồ Chí Minh, Quận 1, Phường Bến Nghé"
                            required
                        />
                        <FormField
                            label="Tên đường, Tòa nhà, Số nhà"
                            icon="home-map-marker"
                            value={form.address}
                            onChangeText={v => updateField('address', v)}
                            placeholder="VD: Số 10, Lý Tự Trọng"
                            required
                        />
                        <FormField
                            label="Mã bưu điện"
                            icon="mailbox-outline"
                            value={form.postalCode}
                            onChangeText={v => updateField('postalCode', v)}
                            keyboardType="numeric"
                            placeholder="Tùy chọn"
                        />
                    </View>

                    {/* Default Switch */}
                    <View style={styles.section}>
                        <View style={styles.switchRow}>
                            <View style={styles.switchInfo}>
                                <Icon name="check-decagram-outline" size={20} color={COLORS.primary} />
                                <View>
                                    <Text style={styles.switchLabel}>Đặt làm địa chỉ mặc định</Text>
                                    <Text style={styles.switchHint}>Sẽ được dùng khi thanh toán</Text>
                                </View>
                            </View>
                            <Switch
                                value={form.isDefault}
                                onValueChange={v => updateField('isDefault', v)}
                                color={COLORS.primary}
                            />
                        </View>
                    </View>

                </ScrollView>

                {/* Save Button */}
                <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
                    <TouchableOpacity
                        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Icon name="content-save-outline" size={20} color="#fff" />
                                <Text style={styles.saveBtnText}>{isEdit ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f8' },

    /* Header */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: SPACING.md,
        paddingVertical: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
    },
    backBtn: { padding: SPACING.xs },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
    },

    /* Scroll */
    scrollContent: { padding: SPACING.md, paddingBottom: 120 },

    /* Section */
    section: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.lg,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.md,
        paddingBottom: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f2',
    },
    sectionTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.text.primary,
    },

    /* Form Fields */
    fieldWrapper: {
        marginBottom: SPACING.md,
    },
    fieldLabel: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
        color: COLORS.text.secondary,
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    fieldInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.sm,
        backgroundColor: '#fafafb',
    },
    fieldIcon: {
        marginRight: SPACING.xs,
    },
    fieldInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
    },

    /* Switch */
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    switchInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    switchLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        color: COLORS.text.primary,
    },
    switchHint: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.secondary,
        marginTop: 2,
    },

    /* Bottom Bar */
    bottomBar: {
        backgroundColor: '#fff',
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f2',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
    },
    saveBtn: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: { color: '#fff', fontSize: FONT_SIZE.md, fontWeight: '700' },
});

export default AddressFormScreen;
