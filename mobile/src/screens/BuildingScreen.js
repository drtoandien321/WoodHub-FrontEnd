import React, { useEffect, useRef, useState } from 'react';
import { View, BackHandler } from 'react-native';
import { Screen, T, Button, Ring, Card } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { useStudio } from '../store/studio.js';
import { api, errMsg } from '../api/client.js';
import { useQueryClient } from '@tanstack/react-query';

/*
 * Theo dõi tác vụ AI dựng 3D: hỏi GET /custom/ai/tasks/{id} mỗi 3 giây.
 * succeeded → tải model theo modelSlug rồi mở Viewer; failed → thử lại / đổi ảnh; có thể huỷ.
 * Lỗi mạng tạm thời khi hỏi KHÔNG coi là thất bại — chỉ thử lại ở vòng sau.
 */
const MSG = {
  RATE_LIMIT: 'Bạn đã hết lượt dựng 3D trong tháng này.', default: 'Không dựng được mô hình từ ảnh này. Hãy thử ảnh khác rõ hơn.',
};

export default function BuildingScreen({ navigation }) {
  const { c } = useTheme();
  const { taskId, setTaskId, openModel } = useStudio();
  const qc = useQueryClient();
  const [task, setTask] = useState(null);
  const [net, setNet] = useState(false);
  const [failMsg, setFailMsg] = useState('');
  const done = useRef(false);
  const [nonce, setNonce] = useState(0); // đổi để chạy lại vòng hỏi sau "Thử lại"

  // Chặn nút Back vật lý khi đang dựng (tránh bỏ dở); người dùng dùng nút "Huỷ"
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => !done.current);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!taskId) return undefined;
    let stop = false;
    const tick = async () => {
      try {
        const t = await api.getGenTask(taskId);
        if (stop) return;
        setNet(false); setTask(t);
        if (t.status === 'succeeded' && t.modelSlug) {
          done.current = true;
          const model = await api.getModel3d(t.modelSlug);
          qc.invalidateQueries({ queryKey: ['models3d'] });
          qc.invalidateQueries({ queryKey: ['my-models'] }); // model AI vừa được BE tự lưu
          openModel(model, { mode: 'result' });
          setTaskId(null);
          navigation.replace('Viewer');
          return;
        }
        if (t.status === 'failed' || t.status === 'cancelled') { setFailMsg(MSG[t.errorCode] || t.errorMessage || MSG.default); return; }
      } catch (e) {
        if (stop) return;
        if (e?.response?.status === 404) { setFailMsg('Không tìm thấy tác vụ. Hãy tạo lại.'); return; }
        setNet(true);
      }
      setTimeout(tick, 3000);
    };
    tick();
    return () => { stop = true; };
  }, [taskId, nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.round(Math.max(0, Math.min(100, task?.progress ?? 0)));
  const failed = !!failMsg;

  const cancel = async () => { try { await api.cancelGenTask(taskId); } catch { /* bỏ qua */ } done.current = true; setTaskId(null); navigation.goBack(); };
  const retry = async () => { try { await api.retryGenTask(taskId); setFailMsg(''); setTask(null); setNonce((n) => n + 1); } catch (e) { setFailMsg(errMsg(e)); } };

  return (
    <Screen>
      <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        {failed ? (
          <>
            <View style={{ width: 120, height: 120, borderRadius: 36, backgroundColor: c.brBg, alignItems: 'center', justifyContent: 'center' }}><Icon name="alert" size={56} color={c.brTx} /></View>
            <T v="h2" style={{ textAlign: 'center' }}>Dựng 3D chưa thành công</T>
            <T mute style={{ textAlign: 'center' }}>{failMsg}</T>
            <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 12 }}>
              <Button title="Thử lại" onPress={retry} />
              <Button title="Chọn ảnh khác" kind="outline" onPress={() => { done.current = true; setTaskId(null); navigation.goBack(); }} />
            </View>
          </>
        ) : (
          <>
            <Ring pct={pct}><T v="h1">{pct}%</T></Ring>
            <T v="h2" style={{ textAlign: 'center' }}>AI đang dựng mô hình 3D</T>
            <T mute style={{ textAlign: 'center' }}>Việc này mất khoảng 1–3 phút. Bạn có thể để màn hình mở và chờ.</T>
            {net ? <Card style={{ alignSelf: 'stretch' }}><T v="small" mute>Mất kết nối tạm thời — đang thử lại…</T></Card> : null}
            <Button title="Huỷ" kind="ghost" onPress={cancel} />
          </>
        )}
      </View>
    </Screen>
  );
}
