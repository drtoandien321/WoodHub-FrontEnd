import React from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Screen, T, Card, Photo, Badge, Skeleton, EmptyState, Row, useToast } from '../components/ui.js';
import { Grid2 } from '../components/cards.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { useMyDesigns, useModels, useMyModels } from '../hooks/data.js';
import { useStudio } from '../store/studio.js';
import { defaultConfig } from '../utils/woods.js';

/* Tab "Thiết kế" (nút giữa): chọn mẫu 3D hoặc chụp ảnh cho AI dựng 3D; bên dưới là "Thiết kế của tôi". */
export default function DesignScreen({ navigation }) {
  const { c } = useTheme();
  const designs = useMyDesigns();
  const models = useModels();
  const mine = useMyModels();
  const studio = useStudio();
  const toast = useToast();

  // Mô hình gốc của thiết kế: mẫu thư viện HOẶC model AI của chính khách (trước đây chỉ tìm trong mẫu thư viện →
  // bấm thiết kế dựng từ model AI không có phản ứng gì)
  const modelOf = (d) => (models.data || []).find((x) => x.id === d.modelId) || (mine.data || []).find((x) => x.id === d.modelId);
  const open = (d) => {
    const m = modelOf(d);
    if (!m) { toast('Không tìm thấy mô hình gốc của thiết kế này (có thể đã bị gỡ).'); return; }
    studio.openModel(m, { mode: 'template' });
    const cf = d.configuration || {};
    const base = defaultConfig(m);
    studio.setCfg({
      color: cf.color || base.color, material: cf.material || base.material,
      W: cf.dimensions?.width || base.W, H: cf.dimensions?.height || base.H, D: cf.dimensions?.depth || base.D,
    });
    studio.setDesignMeta({ id: d.id, version: d.version });
    studio.setDesignName(d.name);
    navigation.navigate('Viewer');
  };

  // Model AI của tôi: mở lại để xem 3D / đặt AR (không có bước chỉnh sửa)
  const openMine = (m) => { studio.openModel(m, { mode: 'result' }); navigation.navigate('Viewer'); };

  const Big = ({ icon, title, hint, onPress, gold }) => (
    <Pressable onPress={onPress} style={{ flex: 1, minHeight: 150, borderRadius: 24, padding: 16, backgroundColor: gold ? c.hero : c.surf, borderWidth: gold ? 0 : 1, borderColor: c.line, justifyContent: 'space-between' }}>
      <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: gold ? 'rgba(248,244,236,0.14)' : c.surf2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={26} color={gold ? '#E2BE48' : c.pri} />
      </View>
      <View>
        <T v="h3" color={gold ? '#F8F4EC' : c.ink}>{title}</T>
        <T v="small" color={gold ? 'rgba(248,244,236,0.75)' : c.mute}>{hint}</T>
      </View>
    </Pressable>
  );

  const list = designs.data || [];
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={designs.isRefetching} onRefresh={() => { designs.refetch(); mine.refetch(); }} />}>
        <View><T v="h1">Thiết kế</T><T mute>Tạo món đồ riêng của bạn rồi nhận báo giá từ xưởng mộc.</T></View>
        <Row style={{ gap: 12 }}>
          <Big icon="cube" title="Chọn mẫu 3D" hint="Tuỳ chỉnh màu, kích thước" onPress={() => navigation.navigate('Templates')} />
          <Big gold icon="camera" title="Từ ảnh của bạn" hint="AI dựng 3D từ 1 tấm ảnh" onPress={() => navigation.navigate('Photo')} />
        </Row>
        <T v="h3">Thiết kế của tôi</T>
        {designs.isLoading ? <Skeleton h={180} r={20} /> : designs.isError ? (
          <Card><T mute>Không tải được danh sách thiết kế.</T><Pressable onPress={designs.refetch} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.pri}>Thử lại</T></Pressable></Card>
        ) : list.length === 0 ? (
          <EmptyState icon="cube" title="Chưa có thiết kế nào" hint="Chọn một mẫu 3D hoặc chụp ảnh để bắt đầu." />
        ) : (
          <Grid2 items={list} render={(d) => (
            <Pressable key={d.id} onPress={() => open(d)} style={{ flex: 1 }}>
              <Photo uri={d.thumbnailUrl || modelOf(d)?.posterUrl} label={d.name} style={{ width: '100%', aspectRatio: 1 }} radius={20} />
              <T v="semi" numberOfLines={1} style={{ marginTop: 8 }}>{d.name}</T>
              <Badge kind={d.status === 'completed' ? 'closed' : 'pending'} label={d.status === 'completed' ? 'Đã lưu' : 'Bản nháp'} style={{ marginTop: 4 }} />
            </Pressable>
          )} />
        )}
        <T v="h3">Model 3D của tôi</T>
        {mine.isLoading ? <Skeleton h={120} r={20} /> : mine.isError ? (
          <Card><T mute>Không tải được danh sách model.</T><Pressable onPress={mine.refetch} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.pri}>Thử lại</T></Pressable></Card>
        ) : (mine.data || []).length === 0 ? (
          <EmptyState icon="camera" title="Chưa có model từ ảnh" hint="Chụp ảnh món đồ để AI dựng 3D, sau đó xem trong phòng bằng AR." />
        ) : (
          <Grid2 items={mine.data} render={(m) => (
            <Pressable key={m.id} onPress={() => openMine(m)} style={{ flex: 1 }}>
              <Photo uri={m.posterUrl} label={m.name} style={{ width: '100%', aspectRatio: 1 }} radius={20} />
              <T v="semi" numberOfLines={1} style={{ marginTop: 8 }}>{m.name}</T>
            </Pressable>
          )} />
        )}
      </ScrollView>
    </Screen>
  );
}
