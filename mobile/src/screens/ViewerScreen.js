import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { T, Button, Row, Screen, Tag3D } from '../components/ui.js';
import Model3D from '../components/Model3D.js';
import Slider from '../components/Slider.js';
import Icon from '../components/Icon.js';
import { useTheme, fonts } from '../theme/theme.js';
import { useStudio } from '../store/studio.js';
import { MATERIALS, colorOptions, hexOfColor, materialIds, ranges, estimatePrice, TYPE_LABELS } from '../utils/woods.js';
import { formatVnd } from '../utils/format.js';

/*
 * Trình xem 3D — màn lõi. Phần trên: mô hình GLB (xoay/chụm). Phần dưới: tuỳ chỉnh màu, chất liệu, kích thước và giá ước tính.
 * Màu/kích thước áp lên mô hình ngay (setColor/setScale). AR dùng Scene Viewer nên chỉ hiển thị GLB gốc.
 */
export default function ViewerScreen({ navigation }) {
  const { c } = useTheme();
  const { model, cfg, cfg0, base, mode, productName, setCfg, resetCfg } = useStudio();
  const mv = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pct, setPct] = useState(0);
  const [open, setOpen] = useState(true);

  useEffect(() => { if (loaded && cfg) mv.current?.setColor(hexOfColor(model, cfg.color)); }, [loaded, cfg?.color]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (loaded && cfg && cfg0) mv.current?.setScale(cfg.W / cfg0.W, cfg.H / cfg0.H, cfg.D / cfg0.D);
  }, [loaded, cfg?.W, cfg?.H, cfg?.D]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!model || !cfg) {
    return <Screen><View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><T mute>Chưa chọn mô hình.</T><Button title="Quay lại" onPress={() => navigation.goBack()} style={{ marginTop: 12 }} /></View></Screen>;
  }

  const r = ranges(model, cfg0);
  const colors = colorOptions(model);
  const matIds = materialIds(model).filter((m) => MATERIALS[m]);
  const price = estimatePrice(base, cfg, cfg0);
  const dirty = JSON.stringify(cfg) !== JSON.stringify(cfg0);

  const dim = (key, label) => (
    <View key={key}>
      <Row style={{ justifyContent: 'space-between' }}>
        <T v="label">{label}</T><T v="semi" color={c.pri}>{cfg[key]} cm</T>
      </Row>
      <Slider value={cfg[key]} min={r[key].min} max={r[key].max} onChange={(v) => setCfg({ [key]: v })} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.v1 }}>
      <Screen bg={c.v1} edges={['top']}>
        <Row style={{ paddingHorizontal: 8, height: 56 }}>
          <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Quay lại" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.surf, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="back" size={24} color={c.ink} />
          </Pressable>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <T v="semi" numberOfLines={1}>{productName || model.name}</T>
            <T v="small" mute>{TYPE_LABELS[String(model.productType).toLowerCase()] || 'Nội thất'}</T>
          </View>
          <Pressable onPress={() => { mv.current?.resetView(); }} accessibilityLabel="Đặt lại góc nhìn" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.surf, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="rotate" size={22} color={c.ink} />
          </Pressable>
        </Row>

        <View style={{ flex: 1 }}>
          <Model3D ref={mv} src={model.modelGlbUrl} poster={model.posterUrl} style={{ flex: 1 }}
            onProgress={(v) => setPct(v)} onLoaded={() => setLoaded(true)} onError={() => setFailed(true)} />
          {!loaded && !failed ? (
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center' }}>
              <View style={{ backgroundColor: c.surf, borderRadius: 16, paddingHorizontal: 14, height: 32, justifyContent: 'center' }}><T v="small">Đang tải mô hình… {Math.round(pct * 100)}%</T></View>
            </View>
          ) : null}
          {failed ? (
            <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <T mute style={{ textAlign: 'center' }}>Không tải được mô hình 3D. Kiểm tra kết nối mạng rồi thử lại.</T>
            </View>
          ) : null}
          {loaded ? <View style={{ position: 'absolute', top: 8, left: 12 }}><Tag3D label="Kéo để xoay · chụm để phóng" /></View> : null}
        </View>

        {/* Bảng tuỳ chỉnh */}
        <View style={{ backgroundColor: c.surf, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 12, maxHeight: open ? '58%' : undefined }}>
          <Pressable onPress={() => setOpen(!open)} style={{ alignItems: 'center', paddingVertical: 10 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.line2 }} />
          </Pressable>
          {open ? (
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
              <T v="label">Màu gỗ</T>
              <Row style={{ gap: 12, flexWrap: 'wrap' }}>
                {colors.map((o) => (
                  <Pressable key={o.value} onPress={() => setCfg({ color: o.value })} accessibilityLabel={'Màu ' + o.label}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: o.hex || c.surf2, borderWidth: 3, borderColor: cfg.color === o.value ? c.pri : c.line, alignItems: 'center', justifyContent: 'center' }}>
                    {cfg.color === o.value ? <Icon name="check" size={18} color={o.hex ? '#fff' : c.ink} /> : (!o.hex ? <T v="small" mute style={{ fontSize: 10 }}>Gốc</T> : null)}
                  </Pressable>
                ))}
              </Row>
              {matIds.length > 1 ? <T v="label">Chất liệu</T> : null}
              {matIds.length > 1 ? <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                {matIds.map((id) => (
                  <Pressable key={id} onPress={() => setCfg({ material: id })}
                    style={{ minWidth: 76, height: 44, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, borderColor: cfg.material === id ? c.pri : c.line, backgroundColor: cfg.material === id ? c.surf2 : c.surf, alignItems: 'center', justifyContent: 'center' }}>
                    <T v="label">{MATERIALS[id].n}</T>
                  </Pressable>
                ))}
              </Row> : null}
              <T v="label">Kích thước</T>
              {model.source === 'ai_generated' ? <T v="small" mute style={{ marginTop: -8 }}>Kích thước tham khảo để xem trước; số đo thật do xưởng chốt khi báo giá.</T> : null}
              {dim('W', 'Rộng')}{dim('H', 'Cao')}{dim('D', 'Sâu')}
              {/* Sản phẩm bán sẵn: giá cố định của NCC, chỉnh màu/kích thước chỉ để xem trước → không hiện "giá ước tính do xưởng báo" */}
              <View style={{ backgroundColor: c.surf2, borderRadius: 16, padding: 14 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View>
                    <T v="small" mute>{mode === 'product' ? 'Giá sản phẩm' : 'Giá ước tính'}</T>
                    <T v="price" color={c.pri}>{formatVnd(mode === 'product' ? base : price)}</T>
                  </View>
                  {dirty ? <Pressable onPress={resetCfg} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.pri}>Đặt lại</T></Pressable> : null}
                </Row>
                <T v="small" mute style={{ marginTop: 4 }}>
                  {mode === 'product' ? 'Đổi màu/kích thước chỉ để xem trước trên mô hình — sản phẩm giao theo phiên bản bạn chọn ở trang sản phẩm.' : 'Chỉ là ước tính tham khảo — giá chính thức do xưởng báo.'}
                </T>
              </View>
            </ScrollView>
          ) : null}
          <View style={{ paddingHorizontal: 20, paddingTop: 10, gap: 10 }}>
            <Button title="Đặt vào phòng bằng AR" kind="gold" icon="ar" onPress={() => navigation.navigate('ArPerm')} />
            {mode !== 'product' ? <Button title="Lưu thiết kế" kind="outline" icon="check" onPress={() => navigation.navigate('Name')} /> : null}
          </View>
        </View>
      </Screen>
    </View>
  );
}
