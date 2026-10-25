import React, { useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { Screen, AppBar, T, Card, Badge, Button, Skeleton, ErrorState, EmptyState, Row, BottomSheet } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { useAddresses, useDeleteAddress, useSetDefaultAddress, formatAddressLine } from '../hooks/shop.js';
import { errMsg } from '../api/client.js';

/* Sổ địa chỉ (port web MyAddresses). BE giữ tối đa 1 mặc định, xoá mặc định thì tự đề bạt địa chỉ khác. */
export default function AddressesScreen({ navigation }) {
  const { c } = useTheme();
  const q = useAddresses();
  const del = useDeleteAddress();
  const setDefault = useSetDefaultAddress();
  const [confirm, setConfirm] = useState(null); // địa chỉ chờ xác nhận xoá
  const [err, setErr] = useState('');

  const remove = async () => {
    setErr('');
    try { await del.mutateAsync(confirm.id); setConfirm(null); } catch (e) { setErr(errMsg(e, 'Không xoá được địa chỉ.')); }
  };

  return (
    <Screen>
      <AppBar title="Sổ địa chỉ" onBack={() => navigation.goBack()}
        right={<Pressable onPress={() => navigation.navigate('AddressForm')} accessibilityLabel="Thêm địa chỉ" style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={24} color={c.pri} /></Pressable>} />
      {q.isError ? <ErrorState offline={!q.error?.response} onRetry={q.refetch} /> : (
        <FlatList
          data={q.isLoading ? [] : q.data || []} keyExtractor={(a) => String(a.id)} onRefresh={q.refetch} refreshing={q.isRefetching}
          contentContainerStyle={{ padding: 20, gap: 12, flexGrow: 1 }}
          ListHeaderComponent={q.isLoading ? <View style={{ gap: 12 }}>{[0, 1].map((i) => <Skeleton key={i} h={110} r={22} />)}</View> : (err ? <T color={c.err}>{err}</T> : null)}
          ListEmptyComponent={q.isLoading ? null : <EmptyState icon="pin" title="Chưa có địa chỉ" hint="Thêm địa chỉ nhận hàng để đặt mua nhanh hơn." action="Thêm địa chỉ" onAction={() => navigation.navigate('AddressForm')} />}
          renderItem={({ item: a }) => (
            <Card style={{ gap: 8 }}>
              <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                <T v="semi">{a.recipientName}</T><T mute>· {a.recipientPhone}</T>
                {a.isDefault ? <Badge kind="closed" label="Mặc định" /> : null}
              </Row>
              <T v="small" mute>{formatAddressLine(a)}</T>
              {a.hasCoordinates ? <T v="small" color={c.forest}>✓ Đã ghim vị trí</T> : <T v="small" color={c.goldtx}>Chưa ghim vị trí — sửa để dùng khi thanh toán</T>}
              <Row style={{ gap: 8, marginTop: 4 }}>
                <Button small kind="outline" title="Sửa" icon="edit" style={{ flex: 1 }} onPress={() => navigation.navigate('AddressForm', { address: a })} />
                {!a.isDefault ? <Button small kind="soft" title="Đặt mặc định" style={{ flex: 1.4 }} onPress={() => setDefault.mutate(a.id)} /> : null}
                <Pressable onPress={() => setConfirm(a)} accessibilityLabel="Xoá địa chỉ" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><Icon name="trash" size={20} color={c.err} /></Pressable>
              </Row>
            </Card>
          )}
        />
      )}
      <BottomSheet visible={!!confirm} onClose={() => setConfirm(null)} title="Xoá địa chỉ?"
        footer={<Row style={{ gap: 10 }}><Button title="Để lại" kind="outline" style={{ flex: 1 }} onPress={() => setConfirm(null)} /><Button title="Xoá" kind="danger" style={{ flex: 1 }} onPress={remove} loading={del.isPending} /></Row>}>
        <T mute>{confirm ? formatAddressLine(confirm) : ''}</T>
      </BottomSheet>
    </Screen>
  );
}
