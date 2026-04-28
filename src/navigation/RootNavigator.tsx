import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ProductDetailScreen from '../screens/buyer/ProductDetailScreen';
import ProductReviewsScreen from '../screens/buyer/ProductReviewsScreen';
import ProductListScreen from '../screens/buyer/ProductListScreen';
import CategoryDetailScreen from '../screens/buyer/CategoryDetailScreen';
import CheckoutScreen from '../screens/buyer/CheckoutScreen';
import PaymentScreen from '../screens/buyer/PaymentScreen';
import OrderDetailScreen from '../screens/buyer/OrderDetailScreen';
import AddEditProductScreen from '../screens/seller/AddEditProductScreen';
import SellerOrderDetailScreen from '../screens/seller/SellerOrderDetailScreen';
import CategoriesScreen from '../screens/buyer/CategoriesScreen';
import CartScreen from '../screens/buyer/CartScreen';
import AddressListScreen from '../screens/buyer/AddressListScreen';
import AddressFormScreen from '../screens/buyer/AddressFormScreen';
import DiscountSelectionScreen from '../screens/buyer/DiscountSelectionScreen';
import OrdersScreen from '../screens/buyer/OrdersScreen';
import SellerDashboard from '../screens/seller/SellerDashboard';
import SellerOrdersScreen from '../screens/seller/SellerOrdersScreen';
import SellerVouchersScreen from '../screens/seller/SellerVouchersScreen';
import SellerRegistrationScreen from '../screens/profile/SellerRegistrationScreen';
import ShopDetailScreen from '../screens/buyer/ShopDetailScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import FavoritesScreen from '../screens/profile/FavoritesScreen';
import ActivityLogsScreen from '../screens/profile/ActivityLogsScreen';
import { useAppSelector } from '../store/hooks';
import { RootStackParamList } from './types';

import SplashScreen from '../components/SplashScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
    const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);
    console.log('RootNavigator: render', { isAuthenticated, isLoading });

    if (isLoading) {
        return <SplashScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                ) : (
                    <>
                        <Stack.Screen name="Main" component={MainTabNavigator} />
                        <Stack.Screen
                            name="ProductList"
                            component={ProductListScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="CategoryDetail"
                            component={CategoryDetailScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ProductDetail"
                            component={ProductDetailScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ProductReviews"
                            component={ProductReviewsScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Checkout"
                            component={CheckoutScreen}
                            options={{ headerShown: true, title: 'Thanh toán' }}
                        />
                        <Stack.Screen
                            name="Payment"
                            component={PaymentScreen}
                            options={{ headerShown: true, title: 'Thanh toán' }}
                        />
                        <Stack.Screen
                            name="OrderDetail"
                            component={OrderDetailScreen}
                            options={{ headerShown: true, title: 'Chi tiết đơn hàng' }}
                        />
                        <Stack.Screen
                            name="AddEditProduct"
                            component={AddEditProductScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="SellerOrderDetail"
                            component={SellerOrderDetailScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Categories"
                            component={CategoriesScreen}
                            options={{ headerShown: true, title: 'Danh mục' }}
                        />
                        <Stack.Screen
                            name="Cart"
                            component={CartScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="AddressList"
                            component={AddressListScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="AddressForm"
                            component={AddressFormScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="DiscountSelection"
                            component={DiscountSelectionScreen}
                            options={{ headerShown: false, presentation: 'modal' }}
                        />
                        <Stack.Screen
                            name="Orders"
                            component={OrdersScreen}
                            options={{ headerShown: true, title: 'Đơn hàng' }}
                        />
                        <Stack.Screen
                            name="SellerDashboard"
                            component={SellerDashboard}
                            options={{ headerShown: true, title: 'Shop của bạn' }}
                        />
                        <Stack.Screen
                            name="SellerOrders"
                            component={SellerOrdersScreen}
                            options={{ headerShown: true, title: 'Đơn bán' }}
                        />
                        <Stack.Screen
                            name="SellerVouchers"
                            component={SellerVouchersScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="SellerRegistration"
                            component={SellerRegistrationScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ShopDetail"
                            component={ShopDetailScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="EditProfile"
                            component={EditProfileScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Favorites"
                            component={FavoritesScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="ActivityLogs"
                            component={ActivityLogsScreen}
                            options={{ headerShown: true, title: 'Nhật ký hoạt động' }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
