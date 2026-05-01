import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import SellerDashboard from '../screens/seller/SellerDashboard';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';
import SellerProductsScreen from '../screens/seller/SellerProductsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const SellerTabNavigator = () => {
    console.log('SellerTabNavigator: mounting');
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: string = 'circle';

                    switch (route.name) {
                        case 'SellerDashboardTab':
                            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
                            break;
                        case 'SellerOrdersTab':
                            iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
                            break;
                        case 'SellerProductsTab':
                            iconName = focused ? 'package-variant' : 'package-variant-closed';
                            break;
                        case 'SellerProfileTab':
                            iconName = focused ? 'account' : 'account-outline';
                            break;
                        default:
                            iconName = 'circle';
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#22c55e', // or a specific seller color if different
                tabBarInactiveTintColor: '#9ca3af',
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: '#f3f4f6',
                    paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
                    paddingTop: 8,
                    height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
                headerShown: false,
            })}
        >
            <Tab.Screen 
                name="SellerDashboardTab" 
                component={SellerDashboard} 
                options={{ tabBarLabel: 'Tổng quan' }} 
            />
            <Tab.Screen
                name="SellerOrdersTab"
                component={SellerOrdersScreen}
                options={{ tabBarLabel: 'Đơn hàng' }}
            />
            <Tab.Screen
                name="SellerProductsTab"
                component={SellerProductsScreen}
                options={{ tabBarLabel: 'Sản phẩm' }}
            />
            <Tab.Screen 
                name="SellerProfileTab" 
                component={ProfileScreen} 
                options={{ tabBarLabel: 'Cửa hàng' }} 
            />
        </Tab.Navigator>
    );
};

export default SellerTabNavigator;
