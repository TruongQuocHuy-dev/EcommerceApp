import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAddresses, deleteAddress, setDefaultAddress } from '../../store/orderSlice';
import { COLORS, SPACING, FONT_SIZE, BORDER_RADIUS } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import AddressCard from '../../components/AddressCard';

type AddressListNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AddressListScreen = () => {
    const navigation = useNavigation<AddressListNavigationProp>();
    const route = useRoute<any>();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();

    const isSelectionMode = route.params?.isSelectionMode || false;
    const onSelectAddress = route.params?.onSelectAddress;

    const { addresses, isLoading } = useAppSelector((state) => state.order);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        dispatch(fetchAddresses());
    }, [dispatch]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchAddresses());
        setRefreshing(false);
    };

    const handleDelete = (id: string) => {
        Alert.alert('Xóa địa chỉ', 'Bạn có chắc chắn muốn xóa địa chỉ này không?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Xóa',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await dispatch(deleteAddress(id)).unwrap();
                        dispatch(fetchAddresses());
                    } catch (error: any) {
                        Alert.alert('Lỗi', error || 'Không thể xóa địa chỉ');
                    }
                },
            },
        ]);
    };

    const handleSetDefault = async (id: string) => {
        try {
            await dispatch(setDefaultAddress(id)).unwrap();
            dispatch(fetchAddresses());
        } catch (error: any) {
            Alert.alert('Lỗi', error || 'Không thể đặt làm mặc định');
        }
    };

    const handleSelect = (address: any) => {
        if (isSelectionMode && onSelectAddress) {
            onSelectAddress(address);
            navigation.goBack();
        }
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Icon name="map-marker-off-outline" size={72} color={COLORS.text.muted} />
            <Text style={styles.emptyTitle}>Chưa có địa chỉ</Text>
            <Text style={styles.emptySubtitle}>Thêm địa chỉ giao hàng để dễ dàng thanh toán</Text>
            <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => navigation.navigate('AddressForm')}
            >
                <Icon name="plus" size={18} color="#fff" />
                <Text style={styles.emptyAddText}>Thêm địa chỉ đầu tiên</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-left" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isSelectionMode ? 'Chọn địa chỉ' : 'Địa chỉ của tôi'}
                </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('AddressForm')}
                    style={styles.addIconBtn}
                >
                    <Icon name="plus" size={24} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {isLoading && !refreshing ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loaderText}>Đang tải địa chỉ...</Text>
                </View>
            ) : (
                <FlatList
                    data={addresses}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <AddressCard
                            item={item}
                            isSelectionMode={isSelectionMode}
                            onSelect={() => handleSelect(item)}
                            onEdit={() => navigation.navigate('AddressForm', { address: item })}
                            onDelete={() => handleDelete(item.id)}
                            onSetDefault={() => handleSetDefault(item.id)}
                        />
                    )}
                    contentContainerStyle={[
                        styles.listContent,
                        addresses.length === 0 && { flex: 1 },
                        { paddingBottom: insets.bottom + SPACING.md }
                    ]}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    ListEmptyComponent={renderEmpty}
                    showsVerticalScrollIndicator={false}
                />
            )}
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
        marginHorizontal: SPACING.sm,
    },
    addIconBtn: { padding: SPACING.xs },

    /* Loader */
    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loaderText: { marginTop: SPACING.sm, fontSize: FONT_SIZE.sm, color: COLORS.text.secondary },

    /* List */
    listContent: { padding: SPACING.md },

    /* Empty State */
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    emptyTitle: {
        fontSize: FONT_SIZE.xl,
        fontWeight: '700',
        color: COLORS.text.primary,
        marginTop: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    emptySubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: SPACING.xl,
    },
    emptyAddBtn: {
        flexDirection: 'row',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        alignItems: 'center',
        gap: SPACING.sm,
    },
    emptyAddText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: FONT_SIZE.md,
    },
});

export default AddressListScreen;
