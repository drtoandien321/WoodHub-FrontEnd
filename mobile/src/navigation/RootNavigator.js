import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, fonts } from '../theme/theme.js';
import Icon from '../components/Icon.js';
import { useAuth } from '../store/auth.js';

import OnboardingScreen from '../screens/OnboardingScreen.js';
import { LoginScreen, RegisterScreen, OtpScreen, ForgotScreen } from '../screens/AuthScreens.js';
import HomeScreen from '../screens/HomeScreen.js';
import ShopScreen from '../screens/ShopScreen.js';
import ProductScreen from '../screens/ProductScreen.js';
import ViewerScreen from '../screens/ViewerScreen.js';
import { ArPermScreen, ArUnsupportedScreen } from '../screens/ArScreens.js';
import DesignScreen from '../screens/DesignScreen.js';
import TemplatesScreen from '../screens/TemplatesScreen.js';
import PhotoScreen from '../screens/PhotoScreen.js';
import BuildingScreen from '../screens/BuildingScreen.js';
import { NameScreen, SavedScreen } from '../screens/SaveScreens.js';
import QuotesScreen from '../screens/QuotesScreen.js';
import QuoteDetailScreen from '../screens/QuoteDetailScreen.js';
import WorkshopsScreen from '../screens/WorkshopsScreen.js';
import ChatScreen from '../screens/ChatScreen.js';
import ProfileScreen from '../screens/ProfileScreen.js';
import PlansScreen from '../screens/PlansScreen.js';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/*
 * Thanh tab dưới theo thiết kế: 5 mục, mục giữa "Thiết kế" là nút tròn nổi (lõi AR/3D).
 */
const TABS = [
  { name: 'Home', label: 'Khám phá', icon: 'home' },
  { name: 'Shop', label: 'Cửa hàng', icon: 'store' },
  { name: 'Design', label: 'Thiết kế', icon: 'cube', center: true },
  { name: 'Quotes', label: 'Báo giá', icon: 'quote' },
  { name: 'Profile', label: 'Tôi', icon: 'user' },
];

function TabBar({ state, navigation }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.surf, borderTopWidth: 1, borderTopColor: c.line, paddingBottom: Math.max(insets.bottom, 4), alignItems: 'flex-end' }}>
      {state.routes.map((route, i) => {
        const t = TABS.find((x) => x.name === route.name);
        const focused = state.index === i;
        const color = focused ? c.pri : c.mute;
        const press = () => {
          const e = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !e.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable key={route.key} onPress={press} accessibilityRole="button" accessibilityLabel={t.label}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: t.center ? 64 : 60, gap: 3 }}>
            {t.center ? (
              <View style={{
                width: 62, height: 62, borderRadius: 31, backgroundColor: c.pri, alignItems: 'center', justifyContent: 'center',
                borderWidth: 4, borderColor: c.bg, marginTop: -30, shadowColor: '#3C2814', shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6,
              }}>
                <Icon name={t.icon} size={26} color={c.onpri} />
              </View>
            ) : <Icon name={t.icon} size={24} color={color} />}
            <Text style={{ fontFamily: fonts.semi, fontSize: 12, color }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Main() {
  return (
    <Tab.Navigator tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Shop" component={ShopScreen} />
      <Tab.Screen name="Design" component={DesignScreen} />
      <Tab.Screen name="Quotes" component={QuotesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const token = useAuth((s) => s.token);
  const onboarded = useAuth((s) => s.onboarded);
  const anim = { headerShown: false, animation: Platform.OS === 'android' ? 'slide_from_right' : 'default' };
  return (
    <Stack.Navigator screenOptions={anim}>
      {!token ? (
        <>
          {!onboarded ? <Stack.Screen name="Onboarding" component={OnboardingScreen} /> : null}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Otp" component={OtpScreen} />
          <Stack.Screen name="Forgot" component={ForgotScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Main" component={Main} />
          <Stack.Screen name="Product" component={ProductScreen} />
          <Stack.Screen name="Viewer" component={ViewerScreen} options={{ animation: 'fade' }} />
          <Stack.Screen name="ArPerm" component={ArPermScreen} options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="ArUnsupported" component={ArUnsupportedScreen} />
          <Stack.Screen name="Templates" component={TemplatesScreen} />
          <Stack.Screen name="Photo" component={PhotoScreen} />
          <Stack.Screen name="Building" component={BuildingScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="Name" component={NameScreen} />
          <Stack.Screen name="Saved" component={SavedScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="QuoteDetail" component={QuoteDetailScreen} />
          <Stack.Screen name="Workshops" component={WorkshopsScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Plans" component={PlansScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
