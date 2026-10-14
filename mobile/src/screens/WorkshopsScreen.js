import React, { useEffect, useState } from 'react';
import { View, FlatList, Linking } from 'react-native';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppBar, T, Card, Button, Skeleton, EmptyState, ErrorState, Row } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { api } from '../api/client.js';
import { formatKm } from '../utils/format.js';

/* Xưởng mộc gần bạn: xin quyền vị trí → GET /stores/nearby/workshops. Từ chối quyền thì hiện hướng dẫn, không chặn app. */
export default function WorkshopsScreen({ navigation }) {
  const { c } = useTheme();
  const [coords, setCoords] = useState(null);
  const [perm, setPerm] = useState('asking'); // asking | denied | ok | error

  const locate = async () => {
    setPerm('asking');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setPerm('denied'); return; }
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
      setPerm('ok');
    } catch { setPerm('error'); }
  };
  useEffect(() => { locate(); }, []);

  const q = useQuery({ queryKey: ['nearby', coords], enabled: !!coords, queryFn: () => api.getNearestWorkshops({ ...coords, limit: 10 }) });
  const list = Array.isArray(q.data) ? q.data : q.data?.content || [];

  return (
    <Screen>
      <AppBar title="Xưởng gần bạn" onBack={() => navigation.goBack()} />
      {perm === 'denied' ? (
        <EmptyState icon="pin" title="Chưa có quyền vị trí" hint="Cho phép WoodHub dùng vị trí để tìm xưởng mộc gần bạn." action="Mở cài đặt" onAction={() => Linking.openSettings()} />
      ) : perm === 'error' ? (
        <ErrorState title="Không lấy được vị trí" hint="Bật GPS rồi thử lại." onRetry={locate} />
      ) : q.isError ? <ErrorState offline={!q.error?.response} onRetry={q.refetch} /> : (
        <FlatList
          data={perm === 'ok' && !q.isLoading ? list : []} keyExtractor={(w) => String(w.supplierId)} contentContainerStyle={{ padding: 20, gap: 12, flexGrow: 1 }}
          ListHeaderComponent={perm === 'asking' || q.isLoading ? <View style={{ gap: 12 }}>{[0, 1, 2].map((i) => <Skeleton key={i} h={96} r={22} />)}</View> : null}
          ListEmptyComponent={perm === 'ok' && !q.isLoading ? <EmptyState icon="store" title="Chưa có xưởng gần bạn" hint="Thử lại sau hoặc chọn xưởng khi gửi yêu cầu báo giá." /> : null}
          renderItem={({ item }) => (
            <Card style={{ gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="h3" style={{ flex: 1 }} numberOfLines={1}>{item.businessName}</T>
                <View style={{ backgroundColor: c.surf2, borderRadius: 12, paddingHorizontal: 10, height: 26, justifyContent: 'center' }}><T v="label" color={c.pri}>{formatKm(item.distanceKm)}</T></View>
              </Row>
              <Row style={{ gap: 6 }}><Icon name="pin" size={16} color={c.mute} /><T v="small" mute>{[item.district, item.city].filter(Boolean).join(', ')}</T></Row>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
