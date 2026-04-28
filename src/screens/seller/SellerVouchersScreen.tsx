import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Alert, RefreshControl, Modal, TextInput, ScrollView,
    ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMyVouchers, createVoucher, updateVoucher, deleteVoucher, Voucher } from '../../store/discountSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';

// ─── Constants ───────────────────────────────────────────────────────────────
const TYPE_OPTIONS = [
    { key: 'percentage', label: '% Giảm giá', icon: 'percent' },
    { key: 'fixed', label: 'Giảm cố định', icon: 'currency-usd' },
    { key: 'freeship', label: 'Freeship', icon: 'truck-fast-outline' },
];

const TYPE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    percentage: { color: '#8b5cf6', bg: '#ede9fe', label: '% Giảm' },
    fixed: { color: '#3b82f6', bg: '#dbeafe', label: 'Cố định' },
    freeship: { color: '#22c55e', bg: '#dcfce7', label: 'Freeship' },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    active: { color: '#22c55e', bg: '#dcfce7', label: 'Đang chạy' },
    expired: { color: '#ef4444', bg: '#fee2e2', label: 'Hết hạn' },
    inactive: { color: '#94a3b8', bg: '#f1f5f9', label: 'Tạm dừng' },
};

const getVoucherStatus = (v: Voucher) => {
    if (!v.isActive) return 'inactive';
    if (new Date() > new Date(v.endDate)) return 'expired';
    return 'active';
};

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const toISOLocal = (date: Date) => date.toISOString();

// ─── Default form state ───────────────────────────────────────────────────────
const defaultForm = () => ({
    name: '',
    code: '',
    description: '',
    type: 'percentage' as const,
    value: '',
    minOrderValue: '',
    maxDiscount: '',
    startDate: toISOLocal(new Date()),
    endDate: toISOLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    usageLimit: '',
    usagePerUser: '1',
});

// ─── VoucherCard ─────────────────────────────────────────────────────────────
const VoucherCard = ({
    item,
    onEdit,
    onDelete,
}: {
    item: Voucher;
    onEdit: (v: Voucher) => void;
    onDelete: (id: string) => void;
}) => {
    const tc = TYPE_CONFIG[item.type] || TYPE_CONFIG.percentage;
    const status = getVoucherStatus(item);
    const sc = STATUS_CONFIG[status];

    const valueLabel =
        item.type === 'percentage' ? `${item.value}%` :
        item.type === 'fixed' ? `$${item.value}` : 'Freeship';

    return (
        <View style={cardStyles.container}>
            {/* Top row */}
            <View style={cardStyles.topRow}>
                <View style={[cardStyles.typeBadge, { backgroundColor: tc.bg }]}>
                    <Text style={[cardStyles.typeText, { color: tc.color }]}>{tc.label}</Text>
                </View>
                <View style={[cardStyles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[cardStyles.statusText, { color: sc.color }]}>{sc.label}</Text>
                </View>
            </View>

            {/* Code + value */}
            <View style={cardStyles.mainRow}>
                <View style={cardStyles.codeWrap}>
                    <Icon name="ticket-percent-outline" size={18} color={COLORS.primary} />
                    <Text style={cardStyles.code}>{item.code}</Text>
                </View>
                <Text style={cardStyles.value}>{valueLabel}</Text>
            </View>

            <Text style={cardStyles.name} numberOfLines={1}>{item.name}</Text>

            {/* Meta row */}
            <View style={cardStyles.metaRow}>
                <View style={cardStyles.metaItem}>
                    <Icon name="calendar-range" size={12} color={COLORS.text.muted} />
                    <Text style={cardStyles.metaText}>
                        {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </Text>
                </View>
                <View style={cardStyles.metaItem}>
                    <Icon name="account-group-outline" size={12} color={COLORS.text.muted} />
                    <Text style={cardStyles.metaText}>
                        {item.usageCount}/{item.usageLimit ?? '∞'}
                    </Text>
                </View>
            </View>

            {item.minOrderValue > 0 && (
                <Text style={cardStyles.minOrder}>
                    Đơn tối thiểu: ${item.minOrderValue}
                </Text>
            )}

            {/* Actions */}
            <View style={cardStyles.actions}>
                <TouchableOpacity style={cardStyles.editBtn} onPress={() => onEdit(item)}>
                    <Icon name="pencil-outline" size={14} color={COLORS.primary} />
                    <Text style={cardStyles.editText}>Chỉnh sửa</Text>
                </TouchableOpacity>
                {item.isActive && (
                    <TouchableOpacity
                        style={cardStyles.deleteBtn}
                        onPress={() => onDelete(item.id)}
                    >
                        <Icon name="pause-circle-outline" size={14} color={COLORS.error} />
                        <Text style={cardStyles.deleteText}>Tạm dừng</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const cardStyles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: BORDER_RADIUS.xl,
        padding: SPACING.md,
        marginBottom: SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
    typeBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
    typeText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
    statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 3, borderRadius: BORDER_RADIUS.full },
    statusText: { fontSize: FONT_SIZE.xs, fontWeight: '700' },
    mainRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    codeWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    code: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: COLORS.text.primary, letterSpacing: 1 },
    value: { fontSize: FONT_SIZE.xxl, fontWeight: '800', color: COLORS.primary },
    name: { fontSize: FONT_SIZE.sm, color: COLORS.text.secondary, marginBottom: SPACING.sm },
    metaRow: { flexDirection: 'row', gap: SPACING.md, marginBottom: 6 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: FONT_SIZE.xs, color: COLORS.text.muted },
    minOrder: { fontSize: FONT_SIZE.xs, color: COLORS.warning, marginBottom: SPACING.sm },
    actions: {
        flexDirection: 'row',
        gap: SPACING.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        paddingTop: SPACING.sm,
        marginTop: 4,
    },
    editBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: 6, borderRadius: BORDER_RADIUS.md,
        backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: COLORS.primaryLight,
    },
    editText: { fontSize: FONT_SIZE.xs, color: COLORS.primary, fontWeight: '700' },
    deleteBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: 6, borderRadius: BORDER_RADIUS.md,
        backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    },
    deleteText: { fontSize: FONT_SIZE.xs, color: COLORS.error, fontWeight: '700' },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────
const SellerVouchersScreen = () => {
    const navigation = useNavigation();
    const dispatch = useAppDispatch();
    const { vouchers, isLoading } = useAppSelector((s) => s.discount);

    const [modalVisible, setModalVisible] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultForm());
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(() => { dispatch(fetchMyVouchers()); }, [dispatch]);
    useEffect(() => { load(); }, [load]);

    const setField = (key: string, val: string) =>
        setForm((p) => ({ ...p, [key]: val }));

    const openCreate = () => {
        setEditingId(null);
        setForm(defaultForm());
        setModalVisible(true);
    };

    const openEdit = (v: Voucher) => {
        setEditingId(v.id);
        setForm({
            name: v.name,
            code: v.code,
            description: v.description || '',
            type: v.type,
            value: String(v.value),
            minOrderValue: String(v.minOrderValue || ''),
            maxDiscount: String(v.maxDiscount || ''),
            startDate: v.startDate,
            endDate: v.endDate,
            usageLimit: String(v.usageLimit || ''),
            usagePerUser: String(v.usagePerUser || '1'),
        });
        setModalVisible(true);
    };

    const handleDelete = (id: string) => {
        Alert.alert('Tạm dừng voucher', 'Voucher sẽ ngừng hoạt động, bạn chắc chưa?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Tạm dừng', style: 'destructive',
                onPress: () => dispatch(deleteVoucher(id)),
            },
        ]);
    };

    const handleSubmit = async () => {
        if (!form.name || !form.code || !form.value) {
            Alert.alert('Lỗi', 'Vui lòng điền tên, mã và giá trị voucher');
            return;
        }
        setSubmitting(true);
        try {
            const payload: any = {
                name: form.name,
                code: form.code.toUpperCase(),
                description: form.description,
                type: form.type,
                value: Number(form.value),
                minOrderValue: Number(form.minOrderValue) || 0,
                startDate: form.startDate,
                endDate: form.endDate,
            };
            if (form.maxDiscount) payload.maxDiscount = Number(form.maxDiscount);
            if (form.usageLimit) payload.usageLimit = Number(form.usageLimit);
            if (form.usagePerUser) payload.usagePerUser = Number(form.usagePerUser);

            if (editingId) {
                await dispatch(updateVoucher({ id: editingId, data: payload })).unwrap();
                Alert.alert('✓', 'Đã cập nhật voucher');
            } else {
                await dispatch(createVoucher(payload)).unwrap();
                Alert.alert('✓', 'Đã tạo voucher mới');
            }
            setModalVisible(false);
        } catch (err: any) {
            Alert.alert('Lỗi', typeof err === 'string' ? err : 'Thao tác thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Render ──
    const renderEmpty = () => (
        !isLoading ? (
            <View style={styles.emptyBox}>
                <Icon name="ticket-percent-outline" size={60} color={COLORS.text.muted} />
                <Text style={styles.emptyTitle}>Chưa có voucher nào</Text>
                <Text style={styles.emptySub}>Tạo voucher để thu hút khách hàng cho gian hàng của bạn</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={openCreate}>
                    <Icon name="plus" size={16} color="#fff" />
                    <Text style={styles.emptyBtnText}>Tạo voucher đầu tiên</Text>
                </TouchableOpacity>
            </View>
        ) : null
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Voucher của tôi</Text>
                    <Text style={styles.headerSub}>{vouchers.length} voucher</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
                    <Icon name="plus" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={vouchers}
                keyExtractor={(v) => v.id}
                renderItem={({ item }) => (
                    <VoucherCard item={item} onEdit={openEdit} onDelete={handleDelete} />
                )}
                contentContainerStyle={styles.list}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={load} tintColor={COLORS.primary} />
                }
            />

            {/* ── Create/Edit Modal ── */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalSheet}>
                        {/* Modal header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingId ? 'Chỉnh sửa Voucher' : 'Tạo Voucher mới'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Icon name="close" size={24} color={COLORS.text.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Tên & Mã */}
                            <Text style={styles.label}>Tên voucher *</Text>
                            <TextInput
                                style={styles.input}
                                value={form.name}
                                onChangeText={(v) => setField('name', v)}
                                placeholder="VD: Giảm 20% cuối tuần"
                                placeholderTextColor={COLORS.text.muted}
                            />

                            <Text style={styles.label}>Mã code *</Text>
                            <TextInput
                                style={[styles.input, { textTransform: 'uppercase' }]}
                                value={form.code}
                                onChangeText={(v) => setField('code', v.toUpperCase())}
                                placeholder="VD: SALE20"
                                placeholderTextColor={COLORS.text.muted}
                                editable={!editingId}
                            />

                            {/* Loại voucher */}
                            <Text style={styles.label}>Loại *</Text>
                            <View style={styles.typeRow}>
                                {TYPE_OPTIONS.map((t) => (
                                    <TouchableOpacity
                                        key={t.key}
                                        style={[
                                            styles.typeBtn,
                                            form.type === t.key && styles.typeBtnActive,
                                        ]}
                                        onPress={() => setField('type', t.key)}
                                    >
                                        <Icon
                                            name={t.icon}
                                            size={16}
                                            color={form.type === t.key ? '#fff' : COLORS.text.secondary}
                                        />
                                        <Text
                                            style={[
                                                styles.typeBtnText,
                                                form.type === t.key && styles.typeBtnTextActive,
                                            ]}
                                        >
                                            {t.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Giá trị */}
                            {form.type !== 'freeship' && (
                                <>
                                    <Text style={styles.label}>
                                        Giá trị{form.type === 'percentage' ? ' (%)' : ' ($)'} *
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.value}
                                        onChangeText={(v) => setField('value', v)}
                                        keyboardType="numeric"
                                        placeholder={form.type === 'percentage' ? 'VD: 20' : 'VD: 50000'}
                                        placeholderTextColor={COLORS.text.muted}
                                    />
                                </>
                            )}
                            {form.type === 'freeship' && (
                                <Text style={styles.helperText}>Voucher miễn phí vận chuyển, không cần nhập giá trị.</Text>
                            )}

                            {/* Giảm tối đa (chỉ hiện khi %) */}
                            {form.type === 'percentage' && (
                                <>
                                    <Text style={styles.label}>Giảm tối đa ($)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.maxDiscount}
                                        onChangeText={(v) => setField('maxDiscount', v)}
                                        keyboardType="numeric"
                                        placeholder="Bỏ trống = không giới hạn"
                                        placeholderTextColor={COLORS.text.muted}
                                    />
                                </>
                            )}

                            {/* Đơn tối thiểu */}
                            <Text style={styles.label}>Đơn hàng tối thiểu ($)</Text>
                            <TextInput
                                style={styles.input}
                                value={form.minOrderValue}
                                onChangeText={(v) => setField('minOrderValue', v)}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor={COLORS.text.muted}
                            />

                            {/* Ngày */}
                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <Text style={styles.label}>Ngày bắt đầu</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.startDate.slice(0, 10)}
                                        onChangeText={(v) => setField('startDate', new Date(v).toISOString())}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={COLORS.text.muted}
                                    />
                                </View>
                                <View style={styles.halfField}>
                                    <Text style={styles.label}>Ngày kết thúc</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.endDate.slice(0, 10)}
                                        onChangeText={(v) => setField('endDate', new Date(v).toISOString())}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={COLORS.text.muted}
                                    />
                                </View>
                            </View>

                            {/* Giới hạn */}
                            <View style={styles.row}>
                                <View style={styles.halfField}>
                                    <Text style={styles.label}>Tổng lượt dùng</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.usageLimit}
                                        onChangeText={(v) => setField('usageLimit', v)}
                                        keyboardType="number-pad"
                                        placeholder="∞"
                                        placeholderTextColor={COLORS.text.muted}
                                    />
                                </View>
                                <View style={styles.halfField}>
                                    <Text style={styles.label}>Mỗi người</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={form.usagePerUser}
                                        onChangeText={(v) => setField('usagePerUser', v)}
                                        keyboardType="number-pad"
                                        placeholder="1"
                                        placeholderTextColor={COLORS.text.muted}
                                    />
                                </View>
                            </View>

                            {/* Mô tả */}
                            <Text style={styles.label}>Mô tả</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={form.description}
                                onChangeText={(v) => setField('description', v)}
                                multiline
                                placeholder="Mô tả ngắn về voucher..."
                                placeholderTextColor={COLORS.text.muted}
                            />

                            {/* Submit */}
                            <TouchableOpacity
                                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                                onPress={handleSubmit}
                                disabled={submitting}
                            >
                                {submitting
                                    ? <ActivityIndicator color="#fff" />
                                    : <Text style={styles.submitText}>
                                        {editingId ? 'Lưu thay đổi' : 'Tạo Voucher'}
                                    </Text>
                                }
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: SPACING.md, paddingVertical: SPACING.md,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text.primary },
    headerSub: { fontSize: FONT_SIZE.xs, color: COLORS.text.muted },
    addBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
    },

    list: { padding: SPACING.md, paddingBottom: 40 },

    // Empty
    emptyBox: { alignItems: 'center', paddingTop: 80, paddingHorizontal: SPACING.xl },
    emptyTitle: { fontSize: FONT_SIZE.xl, fontWeight: '700', color: COLORS.text.primary, marginTop: SPACING.md },
    emptySub: { fontSize: FONT_SIZE.sm, color: COLORS.text.muted, textAlign: 'center', marginTop: 6, marginBottom: SPACING.lg },
    emptyBtn: {
        flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.full,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
    },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        padding: SPACING.lg, maxHeight: '92%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: COLORS.text.primary },

    // Form
    label: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: COLORS.text.secondary, marginBottom: 6, marginTop: SPACING.sm },
    input: {
        backgroundColor: '#f8fafc', borderWidth: 1, borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.md,
        paddingVertical: 10, fontSize: FONT_SIZE.md, color: COLORS.text.primary,
    },
    helperText: { fontSize: FONT_SIZE.xs, color: COLORS.text.muted, fontStyle: 'italic', marginTop: 4 },
    row: { flexDirection: 'row', gap: SPACING.sm },
    halfField: { flex: 1 },

    typeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: 4 },
    typeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: 9, borderRadius: BORDER_RADIUS.lg,
        backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: COLORS.border,
    },
    typeBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    typeBtnText: { fontSize: FONT_SIZE.xs, color: COLORS.text.secondary, fontWeight: '600' },
    typeBtnTextActive: { color: '#fff' },

    submitBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: BORDER_RADIUS.xl,
        paddingVertical: SPACING.md,
        alignItems: 'center',
        marginTop: SPACING.lg,
        marginBottom: SPACING.xl,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
    },
    submitText: { color: '#fff', fontWeight: '800', fontSize: FONT_SIZE.lg },
});

export default SellerVouchersScreen;
