import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import { Screen, AppBar, T, Card, Badge, HTabs, Skeleton, ErrorState, EmptyState, Row } from '../components/ui.js';
import { useTheme } from '../theme/theme.js';
import { useAuth } from '../store/auth.js';
import { useMyBulkQuotes, BULK_STATUS, BULK_TABS } from '../hooks/account.js';
import { formatVnd, formatDate } from '../utils/format.js';

/*
 * Báo giá số lượng lớn của tôi (port web BulkQuoteList role="customer") — GET /bulk-quotes?status=.
 * Khách cá nhân vào được màn này (từ Hồ sơ) nhưng không gửi được yêu cầu → mời tạo hồ sơ doanh nghiệp (giống QA BUG-020 web).
 */
export default function BulkQuotesScreen({ navigation }) {
  const { c } = useTheme();
  const business = useAuth((s) => s.user?.customerType) === 'business';
  const [tab, setTab] = useState(0);
  const q = useMyBulkQuotes(BULK_TABS[tab]);
  const list = q.data || [];

  return (
    <Screen>
      <AppBar title="Báo giá số lượng lớn" onBack={() => navigation.goBack()} />
      <View style={{ height: 48 }}><HTabs tabs={BULK_TABS.map((s) => (s ? BULK_STATUS[s][1] : 'Tất cả'))} value={tab} onChange={setTab} /></View>
      {q.isError ? <ErrorState offline={!q.error?.response} onRetry={q.refetch} /> : (
        <FlatList
          data={q.isLoading ? [] : list} keyExtractor={(b) => String(b.id)} onRefresh={q.refetch} refreshing={q.isRefetching}
          contentContainerStyle={{ padding: 20, gap: 12, flexGrow: 1 }}
          ListHeaderComponent={q.isLoading ? <View style={{ gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={96} r={22} />)}</View> : null}
          ListEmptyComponent={q.isLoading ? null : business
            ? <EmptyState icon="quote" title="Chưa có yêu cầu nào" hint={'Vào trang sản phẩm và bấm "Yêu cầu báo giá số lượng lớn".'} action="Xem cửa hàng" onAction={() => navigation.navigate('Main', { screen: 'Shop' })} />
            : <EmptyState icon="quote" title="Dành cho khách doanh nghiệp" hint="Tạo hồ sơ doanh nghiệp để gửi yêu cầu giá sỉ tới nhà cung cấp." action="Tạo hồ sơ doanh nghiệp" onAction={() => navigation.navigate('Account')} />}
          renderItem={({ item: b }) => {
            const [kind, label] = BULK_STATUS[b.status] || ['muted', b.status];
            const qtySum = (b.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
            return (
              <Card onPress={() => navigation.navigate('BulkQuoteDetail', { id: b.id })} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between', gap: 8 }}>
                  <T v="semi" numberOfLines={1} style={{ flex: 1 }}>{b.supplier?.companyName || b.supplier?.name}</T>
                  <Badge kind={kind} label={label} />
                </Row>
                <T v="small" mute numberOfLines={1}>{(b.items || []).map((i) => `${i.productName} × ${i.quantity}`).join(', ')}</T>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="small" mute>{formatDate(b.createdAt)} · {qtySum} sản phẩm{b.vatRequested ? ' · VAT' : ''}</T>
                  {b.offer ? <T v="semi" color={c.pri}>{formatVnd(b.offer.totalAmount)}</T> : null}
                </Row>
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}
