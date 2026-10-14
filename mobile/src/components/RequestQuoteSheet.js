import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { BottomSheet, T, Button, Field, Stepper, Skeleton, useToast } from './ui.js';
import Icon from './Icon.js';
import { useTheme } from '../theme/theme.js';
import { useWorkshops } from '../hooks/data.js';
import { api, errMsg } from '../api/client.js';

/*
 * Sheet "Yêu cầu báo giá": chọn xưởng + số lượng + khu vực + ghi chú → POST /quotes (giống RequestQuoteModal của web).
 * `ensureDesignId()` trả về id thiết kế (đã lưu sẵn, hoặc tạo mới khi vào từ trang sản phẩm).
 */
export default function RequestQuoteSheet({ visible, onClose, designName, ensureDesignId, onSent }) {
  const { c } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const ws = useWorkshops();
  const [workshopId, setWorkshopId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const send = async () => {
    setBusy(true); setErr('');
    try {
      const customDesignId = await ensureDesignId();
      const quote = await api.createQuote({ workshopId, customDesignId, quantity, location: location.trim() || undefined, note: note.trim() || undefined });
      qc.invalidateQueries({ queryKey: ['my-quotes'] });
      toast('Đã gửi yêu cầu báo giá');
      onSent?.(quote);
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Yêu cầu báo giá"
      footer={<Button title="Gửi yêu cầu" icon="send" onPress={send} disabled={!workshopId} loading={busy} />}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surf2, borderRadius: 14, padding: 12 }}>
        <Icon name="cube" size={20} color={c.pri} /><T v="semi" numberOfLines={1} style={{ flex: 1 }}>{designName}</T>
      </View>
      <T v="label">Chọn xưởng mộc</T>
      {ws.isLoading ? <Skeleton h={56} r={14} /> : (ws.data || []).length === 0 ? <T mute>Hiện chưa có xưởng nào để nhận yêu cầu.</T> : (
        <View style={{ gap: 8 }}>
          {(ws.data || []).map((w) => {
            const on = workshopId === w.id;
            return (
              <Pressable key={w.id} onPress={() => setWorkshopId(w.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 56, borderRadius: 14, borderWidth: 1.5, borderColor: on ? c.pri : c.line, backgroundColor: on ? c.surf2 : c.surf }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? c.pri : c.line2, alignItems: 'center', justifyContent: 'center' }}>
                  {on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.pri }} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <T v="semi" numberOfLines={1}>{w.businessName}</T>
                  <T v="small" mute numberOfLines={1}>{[w.district, w.city].filter(Boolean).join(', ') || 'Xưởng mộc'}</T>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T v="label">Số lượng</T><Stepper value={quantity} onChange={setQuantity} min={1} max={500} />
      </View>
      <Field label="Khu vực giao hàng" value={location} onChangeText={setLocation} placeholder="Quận / Thành phố" />
      <Field label="Ghi chú (không bắt buộc)" value={note} onChangeText={setNote} multiline placeholder="Yêu cầu thêm về kích thước, màu, thời gian…" />
      {err ? <T v="small" color={c.err}>{err}</T> : null}
    </BottomSheet>
  );
}
