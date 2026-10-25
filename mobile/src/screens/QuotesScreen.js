import React, { useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { Screen, T, HTabs, Card, Badge, Photo, Skeleton, EmptyState, ErrorState, Row } from '../components/ui.js';
import { useTheme } from '../theme/theme.js';
import { useMyQuotes, useMyDesigns } from '../hooks/data.js';
import { quoteCardModel, formatDay } from '../utils/quoteSummary.js';
import { formatVnd } from '../utils/format.js';
import { readDesignSnapshot } from '../utils/design.js';

const TABS = [
  { l: 'Tất cả', f: () => true },
  { l: 'Chờ phản hồi', f: (q) => q.status === 'pending' },
  { l: 'Thương lượng', f: (q) => q.status === 'negotiating' },
  { l: 'Đã chốt', f: (q) => q.status === 'accepted' },
  { l: 'Đã đóng', f: (q) => ['rejected', 'expired', 'cancelled'].includes(q.status) },
];
export const STATUS = {
  pending: ['pending', 'Chờ phản hồi'], negotiating: ['neg', 'Đang thương lượng'], accepted: ['closed', 'Đã chốt'],
  rejected: ['rej', 'Đã từ chối'], expired: ['muted', 'Đã hết hạn'], cancelled: ['muted', 'Đã huỷ'],
};

// Dòng giá + thời gian trên thẻ (logic từ quoteSummary.js — cùng quy tắc với web)
export function PriceLine({ q }) {
  const { c } = useTheme();
  const m = quoteCardModel(q);
  if (m.kind === 'empty') return <T v="small" mute>Chưa có báo giá</T>;
  const dim = m.kind === 'dim';
  const days = m.days ? `~${m.days} ngày` : '';
  return (
    <View style={{ opacity: dim ? 0.55 : 1 }}>
      <T v="price" color={m.kind === 'final' ? c.bnTx : c.pri} style={dim ? { textDecorationLine: 'line-through' } : null}>{formatVnd(m.price)}</T>
      {m.quantity > 1 && m.total ? <T v="small" mute>× {m.quantity} = {formatVnd(m.total)}</T> : null}
      {m.kind === 'offer' ? <T v="small" mute>{m.by === 'workshop' ? 'Xưởng đề xuất' : 'Bạn đề xuất'} · vòng {m.rounds || 1}{days ? ` · ${days}` : ''}</T> : null}
      {m.kind === 'final' ? <T v="small" mute>{[days, m.date ? `dự kiến ${formatDay(m.date)}` : ''].filter(Boolean).join(' · ')}</T> : null}
    </View>
  );
}

export default function QuotesScreen({ navigation }) {
  const q = useMyQuotes();
  // Báo giá tạo trước khi BE thêm `designSnapshot.design` chỉ có màu/chất liệu/kích thước → lấy tên + ảnh từ
  // "Thiết kế của tôi" theo customDesignId (cùng cache với tab Thiết kế, không gọi thêm API khi đã mở tab đó)
  const designs = useMyDesigns();
  const designById = Object.fromEntries((designs.data || []).map((d) => [d.id, d]));
  const [tab, setTab] = useState(0);
  const list = (q.data || []).filter(TABS[tab].f);

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
        <T v="h1">Báo giá</T>
      </View>
      <View style={{ height: 44 }}><HTabs tabs={TABS.map((t) => t.l)} value={tab} onChange={setTab} /></View>
      {q.isError ? <ErrorState offline={!q.error?.response} onRetry={q.refetch} /> : (
        <FlatList
          data={q.isLoading ? [] : list} keyExtractor={(x) => String(x.id)} onRefresh={q.refetch} refreshing={q.isRefetching}
          contentContainerStyle={{ padding: 20, gap: 12, flexGrow: 1 }}
          ListHeaderComponent={q.isLoading ? <View style={{ gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={110} r={22} />)}</View> : null}
          ListEmptyComponent={q.isLoading ? null : <EmptyState icon="quote" title="Chưa có yêu cầu báo giá" hint="Lưu một thiết kế rồi gửi cho xưởng mộc để nhận báo giá." action="Bắt đầu thiết kế" onAction={() => navigation.navigate('Design')} />}
          renderItem={({ item }) => {
            const [kind, label] = STATUS[item.status] || ['muted', item.status];
            const snap = readDesignSnapshot(item.designSnapshot);
            const own = designById[item.customDesignId];
            const name = snap.name || own?.name || 'Thiết kế';
            return (
              <Card onPress={() => navigation.navigate('QuoteDetail', { id: item.id })} style={{ gap: 10 }}>
                <Row style={{ gap: 12, alignItems: 'flex-start' }}>
                  <Photo uri={snap.posterUrl || own?.thumbnailUrl} label={name} style={{ width: 64, height: 64 }} radius={14} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <T v="semi" numberOfLines={1}>{name}</T>
                    <T v="small" mute numberOfLines={1}>{item.workshopName}</T>
                    <Badge kind={kind} label={label} />
                  </View>
                </Row>
                <PriceLine q={item} />
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}
