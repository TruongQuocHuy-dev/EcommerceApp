import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout, setAppMode } from '../../store/authSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SettingItemProps {
    icon: string;
    label: string;
    onPress?: () => void;
    showArrow?: boolean;
    value?: React.ReactNode;
    color?: string;
    isDestructive?: boolean;
}

const SettingItem = ({ icon, label, onPress, showArrow = true, value, color = COLORS.primary, isDestructive }: SettingItemProps) => (
    <TouchableOpacity 
        style={styles.settingItem} 
        onPress={onPress} 
        disabled={!onPress}
        activeOpacity={0.7}
    >
        <View style={styles.settingIconWrap}>
            <Icon name={icon} size={22} color={isDestructive ? COLORS.error : color} />
        </View>
        <Text style={[styles.settingLabel, isDestructive && { color: COLORS.error }]}>{label}</Text>
        {value && <View style={styles.settingValue}>{value}</View>}
        {showArrow && !value && <Icon name="chevron-right" size={20} color={COLORS.text.muted} />}
    </TouchableOpacity>
);

const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

const SellerProfileScreen = () => {
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAppSelector((state) => state.auth);

    const handleSwitchToBuyer = () => {
        dispatch(setAppMode('buyer'));
        // The RootNavigator will automatically re-render and switch stacks based on appMode
    };

    const handleLogout = () => {
        dispatch(logout());
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Store Header */}
                <View style={styles.header}>
                    <View style={styles.storeInfo}>
                        <View style={styles.avatarContainer}>
                            {user?.avatar ? (
                                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Icon name="storefront" size={40} color="#fff" />
                                </View>
                            )}
                            <TouchableOpacity style={styles.editAvatarBtn}>
                                <Icon name="camera" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.storeDetails}>
                            <Text style={styles.storeName}>{user?.name || 'Gian hàng của bạn'}</Text>
                            <View style={styles.storeStatsRow}>
                                <View style={styles.statBadge}>
                                    <Icon name="star" size={14} color="#f59e0b" />
                                    <Text style={styles.statText}> 4.9 Đánh giá</Text>
                                </View>
                                <View style={styles.statBadge}>
                                    <Icon name="account-group" size={14} color={COLORS.primary} />
                                    <Text style={styles.statText}> 1.2k Người theo dõi</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Switch Mode Toggle (Very prominent for Sellers) */}
                <View style={styles.switchModeCard}>
                    <View style={styles.switchModeInfo}>
                        <View style={[styles.settingIconWrap, { backgroundColor: COLORS.primary + '20' }]}>
                            <Icon name="store-cog" size={24} color={COLORS.primary} />
                        </View>
                        <View>
                            <Text style={styles.switchModeTitle}>Kênh Người Bán</Text>
                            <Text style={styles.switchModeDesc}>Đang ở chế độ quản lý cửa hàng</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.switchBtn} onPress={handleSwitchToBuyer}>
                        <Icon name="swap-horizontal" size={18} color={COLORS.primary} />
                        <Text style={styles.switchBtnText}>Sang Kênh Mua</Text>
                    </TouchableOpacity>
                </View>

                {/* Settings Sections */}
                <View style={styles.content}>
                    
                    <SettingSection title="Quản lý cửa hàng">
                        <SettingItem 
                            icon="store-edit-outline" 
                            label="Hồ sơ cửa hàng" 
                            color="#8b5cf6" 
                            onPress={() => navigation.navigate('SellerRegistration')} // Reuse form or create specific one
                        />
                        <SettingItem 
                            icon="truck-delivery-outline" 
                            label="Cài đặt vận chuyển" 
                            color="#3b82f6" 
                            onPress={() => {}} 
                        />
                        <SettingItem 
                            icon="bank-outline" 
                            label="Tài khoản ngân hàng" 
                            color="#10b981" 
                            onPress={() => {}} 
                        />
                    </SettingSection>

                    <SettingSection title="Công cụ kinh doanh">
                        <SettingItem 
                            icon="ticket-percent-outline" 
                            label="Mã giảm giá (Voucher)" 
                            color="#f59e0b" 
                            onPress={() => navigation.navigate('SellerVouchers' as any)} 
                        />
                        <SettingItem 
                            icon="chart-line" 
                            label="Phân tích & Báo cáo" 
                            color="#ec4899" 
                            onPress={() => {}} 
                        />
                        <SettingItem 
                            icon="bullhorn-outline" 
                            label="Quảng cáo gian hàng" 
                            color="#ef4444" 
                            onPress={() => {}} 
                            value={<Text style={styles.badgeNew}>MỚI</Text>}
                        />
                    </SettingSection>

                    <SettingSection title="Tài khoản & Hỗ trợ">
                        <SettingItem 
                            icon="shield-check-outline" 
                            label="Bảo mật tài khoản" 
                            color={COLORS.text.secondary} 
                            onPress={() => {}} 
                        />
                        <SettingItem 
                            icon="help-circle-outline" 
                            label="Trung tâm hỗ trợ Seller" 
                            color={COLORS.text.secondary} 
                            onPress={() => {}} 
                        />
                    </SettingSection>

                    {/* Logout */}
                    <View style={styles.logoutWrapper}>
                        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                            <Icon name="logout" size={20} color={COLORS.error} />
                            <Text style={styles.logoutText}>Đăng xuất khỏi thiết bị</Text>
                        </TouchableOpacity>
                        <Text style={styles.versionText}>Phiên bản 2.1.0 (BETA)</Text>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.xl,
        paddingBottom: SPACING.xl,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    storeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: SPACING.md,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#e2e8f0',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.text.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    storeDetails: {
        flex: 1,
    },
    storeName: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '800',
        color: COLORS.text.primary,
        marginBottom: 6,
    },
    storeStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BORDER_RADIUS.sm,
    },
    statText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.text.secondary,
    },
    
    switchModeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: SPACING.md,
        marginTop: -SPACING.lg,
        backgroundColor: '#fff',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    switchModeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    switchModeTitle: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.text.primary,
    },
    switchModeDesc: {
        fontSize: 11,
        color: COLORS.text.muted,
        marginTop: 2,
    },
    switchBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: BORDER_RADIUS.full,
        gap: 4,
    },
    switchBtnText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '700',
        color: COLORS.primary,
    },

    content: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.xl,
        paddingBottom: 100,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '700',
        color: COLORS.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: BORDER_RADIUS.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    settingIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    settingLabel: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontWeight: '500',
        color: COLORS.text.primary,
    },
    settingValue: {
        marginLeft: SPACING.sm,
    },
    badgeNew: {
        backgroundColor: COLORS.error,
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    
    logoutWrapper: {
        marginTop: SPACING.lg,
        alignItems: 'center',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee2e2',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: BORDER_RADIUS.full,
        gap: 8,
        width: '100%',
    },
    logoutText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.error,
    },
    versionText: {
        fontSize: 11,
        color: COLORS.text.muted,
        marginTop: SPACING.lg,
    },
});

export default SellerProfileScreen;
