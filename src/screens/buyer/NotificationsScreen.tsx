import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchNotifications, markAsRead, Notification } from '../../store/notificationSlice';
import { COLORS } from '../../theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NotificationsScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const insets = useSafeAreaInsets();
    const dispatch = useAppDispatch();

    const { notifications, isLoading } = useAppSelector(state => state.notification);
    const { isAuthenticated } = useAppSelector(state => state.auth);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            dispatch(fetchNotifications());
        }
    }, [dispatch, isAuthenticated]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchNotifications());
        setRefreshing(false);
    };

    const handleNotificationPress = (notification: Notification) => {
        if (!notification.isRead) {
            dispatch(markAsRead(notification._id));
        }

        // Navigation logic based on link
        if (notification.link) {
            // Simplified navigation check based on link string.
            // Adjust to your actual Route names if different.
            if (notification.link.includes('order')) {
                navigation.navigate('Orders');
            } else if (notification.link.includes('seller/dashboard')) {
                navigation.navigate('SellerDashboard');
            } else {
                // Default fallback
            }
        }
    };

    const getIconDetails = (type: string) => {
        switch (type) {
            case 'NEW_ORDER':
            case 'ORDER_STATUS_CHANGE':
                return { name: 'truck-delivery', color: '#2563eb', bg: '#dbeafe' };
            case 'SALE':
            case 'SYSTEM_ALERT':
                return { name: 'bell-ring', color: '#d97706', bg: '#fef3c7' };
            default:
                return { name: 'bell', color: '#059669', bg: '#d1fae5' };
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const renderHeader = () => (
        <View style={styles.headerLinks}>
            <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('Cart')}
            >
                <Icon name="cart" size={28} color="#22c55e" />
                <Text style={styles.linkText}>Giỏ hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('Orders')}
            >
                <Icon name="package-variant" size={28} color="#22c55e" />
                <Text style={styles.linkText}>Đơn hàng</Text>
            </TouchableOpacity>
        </View>
    );

    const renderItem = ({ item }: { item: Notification }) => {
        const { name, color, bg } = getIconDetails(item.type);

        return (
            <TouchableOpacity
                style={[
                    styles.notificationItem,
                    !item.isRead && styles.unreadItem
                ]}
                onPress={() => handleNotificationPress(item)}
            >
                <View style={[styles.iconContainer, { backgroundColor: bg }]}>
                    <Icon name={name} size={24} color={color} />
                </View>
                <View style={styles.notificationTextContainer}>
                    <Text style={[styles.notificationTitle, !item.isRead && styles.unreadText]}>
                        {item.title}
                    </Text>
                    <Text style={styles.notificationDesc} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={styles.timeText}>{formatDate(item.createdAt)}</Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyContainer}>
                            <Icon name="bell-off-outline" size={48} color="#9ca3af" />
                            <Text style={styles.emptyText}>Bạn chưa có thông báo nào</Text>
                        </View>
                    ) : null
                }
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f3f4f6',
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    listContainer: {
        flexGrow: 1,
        backgroundColor: '#fff',
    },
    headerLinks: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'space-around',
    },
    linkButton: {
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        width: '45%',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    linkText: {
        marginTop: 8,
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    notificationItem: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        alignItems: 'flex-start',
    },
    unreadItem: {
        backgroundColor: '#eff6ff', // Light blue background for unread
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationTextContainer: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 4,
    },
    unreadText: {
        fontWeight: '700',
        color: COLORS.primary,
    },
    notificationDesc: {
        fontSize: 14,
        color: '#4b5563',
        lineHeight: 20,
    },
    timeText: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 6,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginTop: 6,
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#9ca3af',
    }
});

export default NotificationsScreen;
