import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateProfile } from '../../store/authSlice';
import api from '../../api/client';

const EditProfileScreen = () => {
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const { user, isLoading } = useAppSelector((state) => state.auth);

    const [name, setName] = useState(user?.name || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handlePickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
            maxWidth: 800,
            maxHeight: 800,
        });

        if (result.assets && result.assets.length > 0) {
            setSelectedImage(result.assets[0]);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Tên không được để trống');
            return;
        }

        try {
            setIsUploading(true);
            let avatarUrl = avatar;

            if (selectedImage) {
                const formData = new FormData();
                formData.append('avatar', {
                    uri: Platform.OS === 'ios' ? selectedImage.uri.replace('file://', '') : selectedImage.uri,
                    type: selectedImage.type || 'image/jpeg',
                    name: selectedImage.fileName || 'avatar.jpg',
                } as any);

                const response = await api.post('/profile/avatar', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                avatarUrl = response.data.data.url;
            }

            await dispatch(updateProfile({ name, avatar: avatarUrl })).unwrap();
            Alert.alert('Thành công', 'Cập nhật hồ sơ thành công');
            navigation.goBack();
        } catch (error: any) {
            console.error('Update profile error:', error);
            Alert.alert('Lỗi', error.message || error || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={styles.content}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.avatarSection}>
                    <View style={styles.avatar}>
                        {selectedImage ? (
                            <Icon name="account" size={60} color={COLORS.surface} style={{ opacity: 0.5 }} />
                        ) : avatar ? (
                            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                        ) : (
                            <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || 'U'}</Text>
                        )}

                        {(selectedImage || avatar) && (
                            <View style={StyleSheet.absoluteFill}>
                                <Image
                                    source={{ uri: selectedImage?.uri || avatar }}
                                    style={styles.avatarImage}
                                />
                            </View>
                        )}

                        <TouchableOpacity style={styles.editAvatarBtn} onPress={handlePickImage}>
                            <Icon name="camera" size={16} color={COLORS.surface} />
                        </TouchableOpacity>
                    </View>
                    {selectedImage && <Text style={styles.imagePendingText}>Ảnh mới đã được chọn</Text>}
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Tên hiển thị</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Nhập tên của bạn"
                            placeholderTextColor={COLORS.text.muted}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled]}
                            value={user?.email}
                            editable={false}
                            placeholder="Email"
                            placeholderTextColor={COLORS.text.muted}
                        />
                        <Text style={styles.helpText}>Email không thể thay đổi</Text>
                    </View>
                </View>

                <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.lg) }]}>
                    <TouchableOpacity
                        style={[styles.saveBtn, (isLoading || isUploading) && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={isLoading || isUploading}
                    >
                        {isLoading || isUploading ? (
                            <ActivityIndicator color={COLORS.surface} />
                        ) : (
                            <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 0,
    },
    backButton: {
        padding: SPACING.sm,
    },
    headerTitle: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    content: {
        flex: 1,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        backgroundColor: COLORS.surface,
        marginBottom: SPACING.sm,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '700',
        color: COLORS.surface,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: BORDER_RADIUS.full,
    },
    imagePendingText: {
        marginTop: SPACING.sm,
        fontSize: FONT_SIZE.xs,
        color: COLORS.primary,
        fontWeight: '500',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primaryDark,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.surface,
    },
    form: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.xl,
        flex: 1,
    },
    inputContainer: {
        marginBottom: SPACING.xl,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        color: COLORS.text.secondary,
        marginBottom: SPACING.sm,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
        backgroundColor: COLORS.surface,
    },
    inputDisabled: {
        backgroundColor: COLORS.background,
        color: COLORS.text.muted,
    },
    helpText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
        marginTop: SPACING.xs,
    },
    footer: {
        padding: SPACING.lg,
        backgroundColor: COLORS.surface,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
    },
    saveBtnDisabled: {
        opacity: 0.7,
    },
    saveBtnText: {
        color: COLORS.surface,
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
    },
});

export default EditProfileScreen;
