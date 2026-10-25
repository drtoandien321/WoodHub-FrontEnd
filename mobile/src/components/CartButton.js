import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from './Icon.js';
import { useTheme, fonts } from '../theme/theme.js';
import { useCart } from '../hooks/shop.js';

/* Nút giỏ hàng + badge số lượng (giống icon giỏ ở header web). Dùng ở Khám phá, Cửa hàng, trang sản phẩm. */
export default function CartButton({ bg }) {
  const { c } = useTheme();
  const nav = useNavigation();
  const { data: cart } = useCart();
  const n = cart?.totalQuantity ?? 0;
  return (
    <Pressable onPress={() => nav.navigate('Cart')} accessibilityRole="button" accessibilityLabel={n ? `Giỏ hàng, ${n} sản phẩm` : 'Giỏ hàng'}
      style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: bg || c.surf2, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="cart" size={24} color={c.pri} />
      {n > 0 ? (
        <View style={{ position: 'absolute', top: 4, right: 2, minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: c.gold, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: '#2B2119' }}>{n > 99 ? '99+' : n}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
