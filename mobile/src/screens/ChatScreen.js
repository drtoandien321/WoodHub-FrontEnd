import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen, AppBar, T, Photo, Card, IconBtn, Skeleton, Row } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme, fonts } from '../theme/theme.js';
import { useAuth } from '../store/auth.js';
import { api, errMsg } from '../api/client.js';
import { formatVnd } from '../utils/format.js';

/*
 * Trợ lý AI tư vấn nội thất. Mỗi tài khoản có phiên riêng (BE lưu lịch sử). BE chỉ trả tin của trợ lý nên tin của người dùng
 * hiện ngay (optimistic) rồi tải lại lịch sử. 429 = hết lượt; 502/timeout = AI bận (cold start) → cho thử lại.
 */
const GREETING = 'Xin chào! Mình là trợ lý WoodHub. Bạn đang tìm món đồ nội thất nào? Ví dụ: "bàn ăn gỗ sồi cho 6 người".';

function Suggestion({ p, onOpen }) {
  const { c } = useTheme();
  const id = p.id ?? p.productId;
  return (
    <Card pad={10} onPress={id ? () => onOpen(id) : undefined} style={{ gap: 8 }}>
      <Row style={{ gap: 12 }}>
        <Photo uri={p.image_url || p.imageUrl} style={{ width: 64, height: 64 }} radius={12} />
        <View style={{ flex: 1 }}>
          <T v="semi" numberOfLines={2}>{p.name}</T>
          {p.price != null ? <T v="semi" color={c.pri}>{formatVnd(p.price)}</T> : null}
          <T v="small" mute numberOfLines={1}>{[p.category, p.material].filter(Boolean).join(' · ')}</T>
        </View>
      </Row>
      {Array.isArray(p.reasons) && p.reasons.length ? <T v="small" mute>• {p.reasons.slice(0, 3).join('\n• ')}</T> : null}
    </Card>
  );
}

export default function ChatScreen({ navigation }) {
  const { c } = useTheme();
  const qc = useQueryClient();
  const userId = useAuth((s) => s.user?.id);
  const [sessionId, setSessionId] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState(null);
  const [err, setErr] = useState(null);
  const list = useRef(null);

  // Lấy phiên mới nhất; chưa có thì tạo khi gửi tin đầu
  const sessions = useQuery({ queryKey: ['ai-sessions', userId], queryFn: () => api.getAiSessions() });
  useEffect(() => { if (sessions.data && !sessionId && sessions.data.length) setSessionId(sessions.data[0].id); }, [sessions.data, sessionId]);
  const msgs = useQuery({ queryKey: ['ai-msgs', sessionId], enabled: !!sessionId, queryFn: () => api.getAiMessages(sessionId) });
  const data = [...(msgs.data || []), ...(pending ? [{ id: 'pending', role: 'user', content: pending }] : [])];

  useEffect(() => { setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50); }, [data.length, sending]);

  const send = async (content) => {
    const body = (content ?? text).trim();
    if (!body || sending) return;
    setText(''); setErr(null); setPending(body); setSending(true);
    try {
      let id = sessionId;
      if (!id) { const s = await api.createAiSession({}); id = s.id; setSessionId(id); }
      await api.sendAiMessage({ sessionId: id, content: body });
    } catch (e) { setErr({ e, body }); } finally {
      setSending(false);
      await qc.invalidateQueries({ queryKey: ['ai-msgs'] });
      qc.invalidateQueries({ queryKey: ['ai-sessions'] });
      setPending(null);
    }
  };

  const newChat = async () => {
    try { const s = await api.createAiSession({}); setSessionId(s.id); setErr(null); qc.invalidateQueries({ queryKey: ['ai-sessions'] }); } catch (e) { setErr({ e }); }
  };

  const limit = err?.e?.response?.status === 429;
  return (
    <Screen>
      <AppBar title="Trợ lý AI" onBack={() => navigation.goBack()} right={<IconBtn name="plus" onPress={newChat} label="Cuộc trò chuyện mới" />} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {msgs.isLoading && sessionId ? <View style={{ padding: 20, gap: 10 }}><Skeleton h={50} r={18} /><Skeleton h={50} w="60%" r={18} style={{ alignSelf: 'flex-end' }} /></View> : (
          <FlatList
            ref={list} data={data} keyExtractor={(m) => String(m.id)} contentContainerStyle={{ padding: 16, gap: 12 }}
            ListHeaderComponent={data.length === 0 ? (
              <View style={{ gap: 12 }}>
                <View style={{ alignSelf: 'flex-start', maxWidth: '90%', backgroundColor: c.surf2, borderRadius: 20, borderBottomLeftRadius: 6, padding: 14 }}><T>{GREETING}</T></View>
                <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                  {['Bàn ăn gỗ sồi 6 người', 'Sofa nhỏ cho phòng khách', 'Kệ sách dưới 3 triệu'].map((s) => (
                    <Pressable key={s} onPress={() => send(s)} style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: c.line2, justifyContent: 'center' }}><T v="label">{s}</T></Pressable>
                  ))}
                </Row>
              </View>
            ) : null}
            renderItem={({ item: m }) => m.role === 'user' ? (
              <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: c.pri, borderRadius: 20, borderBottomRightRadius: 6, padding: 12 }}><T color={c.onpri}>{m.content}</T></View>
            ) : (
              <View style={{ alignSelf: 'flex-start', maxWidth: '92%', gap: 8 }}>
                <View style={{ backgroundColor: c.surf2, borderRadius: 20, borderBottomLeftRadius: 6, padding: 12 }}><T>{m.content}</T></View>
                {(m.suggestedProducts || []).map((p, i) => <Suggestion key={p.id ?? p.productId ?? i} p={p} onOpen={(id) => navigation.navigate('Product', { id })} />)}
              </View>
            )}
            ListFooterComponent={
              <View style={{ gap: 10 }}>
                {sending ? <View style={{ alignSelf: 'flex-start', backgroundColor: c.surf2, borderRadius: 20, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' }}><ActivityIndicator color={c.pri} /><T v="small" mute>Trợ lý đang trả lời…</T></View> : null}
                {err ? (
                  <Card style={{ backgroundColor: c.brBg, borderColor: c.brBg, gap: 6 }}>
                    <T color={c.brTx}>{limit ? 'Bạn đã dùng hết lượt chat AI trong tháng này.' : errMsg(err.e)}</T>
                    {limit ? <Pressable onPress={() => navigation.navigate('Plans')} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.brTx}>Xem các gói</T></Pressable>
                      : err.body ? <Pressable onPress={() => send(err.body)} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.brTx}>Thử lại</T></Pressable> : null}
                  </Card>
                ) : null}
              </View>
            }
          />
        )}
        <Row style={{ padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: c.line, backgroundColor: c.surf }}>
          <TextInput value={text} onChangeText={setText} placeholder="Nhập tin nhắn…" placeholderTextColor={c.mute} multiline
            style={{ flex: 1, maxHeight: 110, minHeight: 48, borderRadius: 24, backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, paddingHorizontal: 16, fontFamily: fonts.regular, fontSize: 16, color: c.ink }} />
          <Pressable onPress={() => send()} disabled={!text.trim() || sending} accessibilityLabel="Gửi"
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.pri, alignItems: 'center', justifyContent: 'center', opacity: !text.trim() || sending ? 0.45 : 1 }}>
            <Icon name="send" size={22} color={c.onpri} />
          </Pressable>
        </Row>
      </KeyboardAvoidingView>
    </Screen>
  );
}
