import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { COLORS } from '../theme/colors.js';
import HomeScreen from '../screens/HomeScreen.js';
import ShopScreen from '../screens/ShopScreen.js';
import ProductDetailScreen from '../screens/ProductDetailScreen.js';
import CustomScreen from '../screens/CustomScreen.js';
import WorkshopMatchScreen from '../screens/WorkshopMatchScreen.js';
import CartScreen from '../screens/CartScreen.js';

/*
 * Pattern Bottom Tabs + Stack (giống MMA301 đã làm):
 * - Tab = 4 khu chính (Home / Shop / Custom / Cart)
 * - Mỗi tab có Stack riêng để push màn chi tiết (ProductDetail nằm TRONG ShopStack
 *   → bấm vào sản phẩm vẫn giữ tab bar, back về list tự nhiên).
 */
const Tab = createBottomTabNavigator();
const ShopStackNav = createNativeStackNavigator();
const CustomStackNav = createNativeStackNavigator();

const stackOptions = {
  headerStyle: { backgroundColor: COLORS.ivory },
  headerTintColor: COLORS.walnut,
  headerTitleStyle: { fontWeight: '600' },
  contentStyle: { backgroundColor: COLORS.ivory },
};

function ShopStack() {
  return (
    <ShopStackNav.Navigator screenOptions={stackOptions}>
      <ShopStackNav.Screen name="ShopList" component={ShopScreen} options={{ title: 'Cửa hàng' }} />
      <ShopStackNav.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Chi tiết sản phẩm' }} />
    </ShopStackNav.Navigator>
  );
}

function CustomStack() {
  return (
    <CustomStackNav.Navigator screenOptions={stackOptions}>
      <CustomStackNav.Screen name="Configurator" component={CustomScreen} options={{ title: 'Thiết kế Custom 3D' }} />
      <CustomStackNav.Screen name="WorkshopMatch" component={WorkshopMatchScreen} options={{ title: 'Xưởng phù hợp' }} />
    </CustomStackNav.Navigator>
  );
}

const tabIcon = (emoji) => ({ focused }) => (
  <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
);

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.walnut,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { backgroundColor: COLORS.white, borderTopColor: COLORS.ivoryDark },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Trang chủ', tabBarIcon: tabIcon('🏠'), headerShown: true, headerTitle: 'WoodHub', headerStyle: { backgroundColor: COLORS.ivory }, headerTintColor: COLORS.walnut }} />
      <Tab.Screen name="Shop" component={ShopStack} options={{ title: 'Cửa hàng', tabBarIcon: tabIcon('🛋️') }} />
      <Tab.Screen name="Custom" component={CustomStack} options={{ title: 'Custom 3D', tabBarIcon: tabIcon('🪄') }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Giỏ hàng', tabBarIcon: tabIcon('🛒'), headerShown: true, headerTitle: 'Giỏ hàng', headerStyle: { backgroundColor: COLORS.ivory }, headerTintColor: COLORS.walnut }} />
    </Tab.Navigator>
  );
}
