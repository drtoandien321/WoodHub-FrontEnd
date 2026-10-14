import React, { useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, AppBar, T, Button, Field, Photo } from '../components/ui.js';
import RequestQuoteSheet from '../components/RequestQuoteSheet.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { useStudio } from '../store/studio.js';
import { saveDesign } from '../utils/design.js';
import { api, errMsg } from '../api/client.js';

export function NameScreen({ navigation }) {
  const { c } = useTheme();
  const qc = useQueryClient();
  const s = useStudio();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [limit, setLimit] = useState(false);

  const save = async () => {
    setBusy(true); setErr(''); setLimit(false);
    try {
      const name = s.designName.trim();
      if (s.mode === 'result') {
        // Model AI đã TỰ LƯU khi gen xong (không tốn thêm lượt) — "Lưu" chỉ là đặt tên: PUT /custom/models/{id}
        const m = await api.renameModel({ id: s.model.id, name: name.slice(0, 255) });
        s.setSaved({ name: m.name });
        qc.invalidateQueries({ queryKey: ['my-models'] });
      } else {
        const d = await saveDesign({ model: s.model, cfg: s.cfg, name, designId: s.designId, designVersion: s.designVersion });
        s.setDesignMeta({ id: d.id, version: d.version });
        s.setSaved(d);
        qc.invalidateQueries({ queryKey: ['my-designs'] });
        qc.invalidateQueries({ queryKey: ['usage'] });
      }
      navigation.replace('Saved');
    } catch (e) {
      if (e?.freshMeta) s.setDesignMeta(e.freshMeta);
      if (e?.response?.status === 429) setLimit(true);
      setErr(e?.response?.status === 409 ? 'Thiết kế vừa được cập nhật ở nơi khác. Bấm Lưu lại để thử lần nữa.' : errMsg(e));
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <AppBar title="Lưu thiết kế" onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, padding: 20, gap: 16 }}>
        <Photo uri={s.model?.posterUrl} label={s.model?.name} style={{ height: 200, width: '100%' }} radius={24} />
        <Field label="Tên thiết kế" value={s.designName} onChangeText={s.setDesignName} placeholder="Ví dụ: Bàn ăn phòng khách" maxLength={80} />
        <T v="small" mute>{s.mode === 'result' ? 'Mô hình AI đã được lưu sẵn — bước này chỉ đặt tên để bạn dễ tìm.' : 'Lưu thiết kế hoàn chỉnh sẽ dùng 1 lượt thiết kế trong gói của bạn.'}</T>
        {err ? <T color={c.err}>{err}</T> : null}
        {limit ? <Button title="Xem các gói" kind="outline" onPress={() => navigation.navigate('Plans')} /> : null}
        <View style={{ flex: 1 }} />
        <Button title="Lưu thiết kế" onPress={save} loading={busy} disabled={s.designName.trim().length < 2} />
      </View>
    </Screen>
  );
}

export function SavedScreen({ navigation }) {
  const { c } = useTheme();
  const s = useStudio();
  const [sheet, setSheet] = useState(false);
  const d = s.savedDesign;
  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: c.bnBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={64} color={c.bnTx} />
        </View>
        <T v="h1" style={{ textAlign: 'center' }}>Đã lưu thiết kế</T>
        <T mute style={{ textAlign: 'center' }}>"{d?.name || s.designName}" đã nằm trong mục {s.mode === 'result' ? 'Model 3D của tôi' : 'Thiết kế của tôi'}.</T>
        <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 16 }}>
          <Button title="Gửi yêu cầu báo giá" icon="quote" onPress={() => setSheet(true)} />
          <Button title="Tiếp tục chỉnh sửa" kind="outline" onPress={() => navigation.navigate('Viewer')} />
          <Button title="Về trang Thiết kế" kind="ghost" onPress={() => { navigation.popToTop(); navigation.navigate('Main', { screen: 'Design' }); }} />
        </View>
      </View>
      <RequestQuoteSheet visible={sheet} onClose={() => setSheet(false)} designName={d?.name || s.designName} ensureDesignId={async () => {
        if (d?.id ?? s.designId) return d?.id ?? s.designId;
        // Model AI chưa có thiết kế: tạo khi người dùng gửi báo giá (báo giá cần customDesignId)
        const saved = await saveDesign({ model: s.model, cfg: s.cfg, name: d?.name || s.designName });
        s.setDesignMeta({ id: saved.id, version: saved.version });
        return saved.id;
      }}
        onSent={(q) => { setSheet(false); navigation.navigate('QuoteDetail', { id: q.id }); }} />
    </Screen>
  );
}
