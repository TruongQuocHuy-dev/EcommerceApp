import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, setAppMode } from '../../store/authSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface MenuItemProps {
    icon: string;
    label: string;
    onPress: () => void;
    showArrow?: boolean;
}

const MenuItem = ({ icon, label, onPress, showArrow = true }: MenuItemProps) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.menuIcon}>
            <Icon name={icon} size={22} color={COLORS.primary} />
        </View>
        <Text style={styles.menuLabel}>{label}</Text>
        {showArrow && <Icon name="chevron-right" size={20} color={COLORS.text.muted} />}
    </TouchableOpacity>
);

const ProfileScreen = () => {
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavigationProp>();
    const { user, appMode } = useAppSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView>
                {/* User Info */}
                <View style={styles.userSection}>
                    <View style={styles.avatar}>
                        {user?.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        )}
                    </View>
                    <Text style={styles.userName}>{user?.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{user?.role || 'user'}</Text>
                    </View>
                </View>

                {/* Menu */}
                <View style={styles.menuSection}>
                    <MenuItem icon="account-edit-outline" label="Chỉnh sửa hồ sơ" onPress={() => navigation.navigate('EditProfile')} />
                    <MenuItem icon="map-marker-outline" label="Địa chỉ của tôi" onPress={() => navigation.navigate('AddressList')} />
                    <MenuItem icon="heart-outline" label="Danh sách yêu thích" onPress={() => navigation.navigate('Favorites')} />
                    <MenuItem icon="file-document-outline" label="Nhật ký hoạt động" onPress={() => navigation.navigate('ActivityLogs')} />
                    <MenuItem icon="bell-outline" label="Thông báo" onPress={() => { }} />
                    {user?.role !== 'seller' && user?.role !== 'admin' && (
                        <MenuItem
                            icon="store-plus-outline"
                            label="Đăng ký bán hàng"
                            onPress={() => navigation.navigate('SellerRegistration')}
                        />
                    )}
                    {(user?.role === 'seller' || user?.role === 'admin') && (
                        <>
                            {appMode === 'buyer' ? (
                                <MenuItem
                                    icon="view-dashboard-outline"
                                    label="Kênh Người Bán"
                                    onPress={() => dispatch(setAppMode('seller'))}
                                />
                            ) : (
                                <MenuItem
                                    icon="shopping-outline"
                                    label="Kênh Người Mua"
                                    onPress={() => dispatch(setAppMode('buyer'))}
                                />
                            )}
                            <MenuItem
                                icon="store-edit-outline"
                                label="Sửa thông tin Cửa hàng"
                                onPress={() => navigation.navigate('SellerRegistration')}
                            />
                        </>
                    )}
                    <MenuItem icon="shield-check-outline" label="Bảo mật" onPress={() => { }} />
                    <MenuItem icon="help-circle-outline" label="Trung tâm trợ giúp" onPress={() => { }} />
                </View>

                {/* Logout */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Icon name="logout" size={20} color={COLORS.error} />
                        <Text style={styles.logoutText}>Đăng xuất</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    userSection: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
        backgroundColor: COLORS.surface,
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.text.inverse,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: BORDER_RADIUS.full,
    },
    userName: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginBottom: SPACING.xs,
    },
    userEmail: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        marginTop: SPACING.xs,
    },
    roleBadge: {
        marginTop: SPACING.sm,
        backgroundColor: COLORS.primaryLight,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.full,
    },
    roleText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.primaryDark,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    menuSection: {
        backgroundColor: COLORS.surface,
        marginBottom: SPACING.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.primaryLight + '30',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    menuLabel: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        color: COLORS.text.primary,
    },
    logoutSection: {
        padding: SPACING.md,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        gap: SPACING.sm,
    },
    logoutText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.error,
        fontWeight: '600',
    },
});

export default ProfileScreen;
