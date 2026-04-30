import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type MainTabParamList = {
    Home: { categoryId?: string; categoryName?: string } | undefined;
    Mail: undefined;
    Notifications: undefined;
    Profile: undefined;
};

export type SellerTabParamList = {
    SellerDashboardTab: undefined;
    SellerOrdersTab: undefined;
    SellerVouchersTab: undefined;
    SellerProfileTab: undefined;
};

export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Main: NavigatorScreenParams<MainTabParamList> | NavigatorScreenParams<SellerTabParamList>;
    ProductList: { categoryId: string; categoryName: string };
    CategoryDetail: { categoryId: string; categoryName: string };
    ProductDetail: { productId: string };
    ProductReviews: { productId: string; productName?: string };
    Checkout: undefined;
    Payment: { orderId: string; amount: number; paymentMethod: string };
    OrderDetail: { orderId: string };
    AddEditProduct: { productId?: string; isEdit?: boolean };
    SellerOrderDetail: { orderId: string };
    Categories: undefined;
    Cart: undefined;
    DiscountSelection: { scope?: 'shop' | 'system' };
    AddressList: { isSelectionMode?: boolean; onSelectAddress?: (a: any) => void } | undefined;
    AddressForm: { address?: any } | undefined;
    Orders: undefined;
    SellerDashboard: undefined;
    SellerOrders: undefined;
    SellerVouchers: undefined;
    SellerRegistration: undefined;
    ShopDetail: { shopId: string };
    EditProfile: undefined;
    Favorites: undefined;
    ActivityLogs: undefined;
};

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList { }
    }
}
