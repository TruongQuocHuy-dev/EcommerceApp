import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Menu, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SPACING, FONT_SIZE } from '../theme';

interface AddressCardProps {
    item: any;
    isSelectionMode?: boolean;
    onSelect?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onSetDefault?: () => void;
}

const AddressCard = ({
    item,
    isSelectionMode = false,
    onSelect,
    onEdit,
    onDelete,
    onSetDefault,
}: AddressCardProps) => {
    const [visible, setVisible] = useState(false);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    const handleEdit = () => {
        closeMenu();
        onEdit?.();
    };

    const handleDelete = () => {
        closeMenu();
        onDelete?.();
    };

    const handleSetDefault = () => {
        closeMenu();
        onSetDefault?.();
    };

    return (
        <TouchableOpacity
            style={[styles.card, item.isDefault && styles.cardDefault]}
            onPress={isSelectionMode ? onSelect : undefined}
            activeOpacity={isSelectionMode ? 0.75 : 1}
        >
            {/* Accent strip for default address */}
            {item.isDefault && <View style={styles.accentStrip} />}

            <View style={styles.cardInner}>
                {/* Top Row */}
                <View style={styles.cardTopRow}>
                    <View style={styles.avatarWrapper}>
                        <Icon
                            name="account"
                            size={18}
                            color={item.isDefault ? '#fff' : COLORS.text.secondary}
                        />
                    </View>

                    <View style={styles.personInfoBlock}>
                        <Text style={styles.nameText}>{item.name}</Text>
                        <View style={styles.phonePill}>
                            <Icon name="phone" size={11} color={COLORS.text.muted} />
                            <Text style={styles.phoneText}>{item.phone}</Text>
                        </View>
                    </View>

                    {item.isDefault ? (
                        <View style={styles.defaultBadge}>
                            <Icon name="check-circle" size={11} color="#fff" />
                            <Text style={styles.defaultText}>Mặc định</Text>
                        </View>
                    ) : (
                        <Menu
                            visible={visible}
                            onDismiss={closeMenu}
                            anchor={
                                <TouchableOpacity onPress={openMenu} style={styles.menuTrigger}>
                                    <Icon name="dots-vertical" size={20} color={COLORS.text.muted} />
                                </TouchableOpacity>
                            }
                            contentStyle={styles.menuContent}
                        >
                            <Menu.Item
                                onPress={handleEdit}
                                title="Chỉnh sửa"
                                leadingIcon="pencil-outline"
                                titleStyle={styles.menuItemText}
                            />
                            <Menu.Item
                                onPress={handleSetDefault}
                                title="Đặt làm mặc định"
                                leadingIcon="star-outline"
                                titleStyle={styles.menuItemText}
                            />
                            <Divider style={styles.menuDivider} />
                            <Menu.Item
                                onPress={handleDelete}
                                title="Xóa địa chỉ"
                                leadingIcon="trash-can-outline"
                                titleStyle={[styles.menuItemText, { color: COLORS.error }]}
                            />
                        </Menu>
                    )}
                </View>

                {/* Address Block */}
                <View style={styles.addressBlock}>
                    <View style={styles.addressIconWrapper}>
                        <Icon name="map-marker" size={14} color={COLORS.primary} />
                    </View>
                    <Text style={styles.addressText} numberOfLines={3}>
                        {item.address}
                        {item.city ? `, ${item.city}` : ''}
                        {item.province ? `, ${item.province}` : ''}
                        {item.postalCode ? ` - ${item.postalCode}` : ''}
                    </Text>
                </View>

                {/* Selection Mode Hint */}
                {isSelectionMode && (
                    <View style={styles.selectRow}>
                        <Text style={styles.selectHint}>Chọn địa chỉ này</Text>
                        <View style={styles.selectArrowCircle}>
                            <Icon name="arrow-right" size={16} color={COLORS.primary} />
                        </View>
                    </View>
                )}

                {/* If default, we still want an Edit option but usually no menu */}
                {item.isDefault && !isSelectionMode && (
                    <TouchableOpacity style={styles.defaultEditBtn} onPress={onEdit}>
                        <Icon name="pencil-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.defaultEditText}>Chỉnh sửa</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: SPACING.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EBEBF0',
        shadowColor: '#1A1A3E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 3,
    },
    cardDefault: {
        borderColor: COLORS.primary + '33',
        backgroundColor: '#fff',
    },
    accentStrip: {
        height: 4,
        backgroundColor: COLORS.primary,
        width: '100%',
    },
    cardInner: {
        padding: SPACING.md,
        paddingTop: 14,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: 12,
    },
    avatarWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    personInfoBlock: {
        flex: 1,
        gap: 3,
    },
    nameText: {
        fontSize: FONT_SIZE.md,
        fontWeight: '700',
        color: COLORS.text.primary,
        letterSpacing: 0.1,
    },
    phonePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    phoneText: {
        fontSize: FONT_SIZE.xs,
        color: COLORS.text.muted,
        letterSpacing: 0.3,
    },
    defaultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
    },
    defaultText: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    menuTrigger: {
        padding: 4,
    },
    menuContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 4,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    menuItemText: {
        fontSize: 14,
        color: COLORS.text.primary,
    },
    menuDivider: {
        marginVertical: 4,
        height: 1,
        backgroundColor: '#F0F0F5',
    },
    addressBlock: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        backgroundColor: '#F7F7FB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 4,
    },
    addressIconWrapper: {
        marginTop: 2,
    },
    addressText: {
        flex: 1,
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        lineHeight: 20,
    },
    selectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F5',
    },
    selectHint: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.primary,
        fontWeight: '600',
    },
    selectArrowCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: COLORS.primary + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    defaultEditBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    defaultEditText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
    },
});

export default AddressCard;