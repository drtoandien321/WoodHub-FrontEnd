import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import { Screen, AppBar, T, Card, Badge, HTabs, Skeleton, ErrorState, EmptyState, Row } from '../components/ui.js';
import { useTheme } from '../theme/theme.js';
import { useOrders } from '../hooks/shop.js';
import { formatVnd, formatDateTime } from '../utils/format.js';
import { ORDER_STATUS, ORDER_TABS } from '../utils/orders.js';

/* Đơn hàng B2C của tôi (port web pages/Orders.jsx) — lọc theo trạng thái ở BE (?status=). */
export default function OrdersScreen({ navigation }) {
  const { c } = useTheme();
  const [tab, setTab] = useState(0);
  const q = useOrders({ status: ORDER_TABS[tab].s });
  const list = q.data || [];

  return (
    <Screen>
      <AppBar title="Đơn hàng của tôi" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
      <View style={{ height: 48 }}><HTabs tabs={ORDER_TABS.map((t) => t.l)} value={tab} onChange={setTab} /></View>
      {q.isError ? <ErrorState offline={!q.error?.response} onRetry={q.refetch} /> : (
        <FlatList
          data={q.isLoading ? [] : list} keyExtractor={(o) => String(o.id)} onRefresh={q.refetch} refreshing={q.isRefetching}
          contentContainerStyle={{ padding: 20, gap: 12, flexGrow: 1 }}
          ListHeaderComponent={q.isLoading ? <View style={{ gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={104} r={22} />)}</View> : null}
          ListEmptyComponent={q.isLoading ? null : <EmptyState icon="package" title="Chưa có đơn hàng" hint="Đơn bạn đặt từ cửa hàng sẽ hiện ở đây." action="Xem cửa hàng" onAction={() => navigation.navigate('Main', { screen: 'Shop' })} />}
          renderItem={({ item: o }) => {
            const [kind, label] = ORDER_STATUS[o.status] || ['muted', o.status];
            const n = (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
            return (
              <Card onPress={() => navigation.navigate('OrderDetail', { id: o.id })} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}><T v="mono" color={c.pri}>{o.orderCode}</T><Badge kind={kind} label={label} /></Row>
                <T v="semi" numberOfLines={1}>{o.supplierName}</T>
                <T v="small" mute numberOfLines={1}>{(o.items || []).map((i) => i.productName).join(', ')}</T>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="small" mute>{formatDateTime(o.placedAt || o.createdAt)}{n ? ` · ${n} sản phẩm` : ''}</T>
                  <T v="semi" color={c.pri}>{formatVnd(o.totalAmount)}</T>
                </Row>
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}
