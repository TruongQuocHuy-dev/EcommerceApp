import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/buyer/HomeScreen';
import MailScreen from '../screens/buyer/MailScreen';
import NotificationsScreen from '../screens/buyer/NotificationsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
    console.log('MainTabNavigator: mounting');
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: string = 'circle';

                    switch (route.name) {
                        case 'Home':
                            iconName = focused ? 'home' : 'home-outline';
                            break;
                        case 'Mail':
                            iconName = focused ? 'store' : 'store-outline';
                            break;
                        case 'Notifications':
                            iconName = focused ? 'bell' : 'bell-outline';
                            break;
                        case 'Profile':
                            iconName = focused ? 'account' : 'account-outline';
                            break;
                        default:
                            iconName = 'circle';
                    }

                    return <Icon name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#22c55e',
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
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Trang chủ' }} />
            <Tab.Screen
                name="Mail"
                component={MailScreen}
                options={{
                    tabBarLabel: 'Cửa hàng',
                    headerShown: true,
                    headerTitle: 'Shopee Mall',
                    headerShadowVisible: false,
                    headerStyle: {
                        backgroundColor: '#fff',
                        elevation: 0, // for Android
                        shadowOpacity: 0, // for iOS
                    },
                    headerTintColor: '#000',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            />
            <Tab.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{
                    tabBarLabel: 'Thông báo',
                    headerShown: true,
                    headerTitle: 'Thông báo',
                    headerShadowVisible: false,
                    headerStyle: {
                        backgroundColor: '#fff',
                        elevation: 0, // for Android
                        shadowOpacity: 0, // for iOS
                    },
                    headerTintColor: '#000',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Cá nhân' }} />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;
