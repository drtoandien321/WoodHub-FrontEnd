import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Screen, AppBar, T, Field, Button, IconBtn, useToast } from '../components/ui.js';
import { useTheme } from '../theme/theme.js';
import { useAuth } from '../store/auth.js';
import { useChangePassword } from '../hooks/account.js';
import { errMsg } from '../api/client.js';

/* Đổi mật khẩu — PUT /users/{id}/password { currentPassword, newPassword } → 204. Tối thiểu 6 ký tự (cùng @Size(min = 6) của BE ChangePasswordRequest). */
export default function ChangePasswordScreen({ navigation }) {
  const { c } = useTheme();
  const toast = useToast();
  const id = useAuth((s) => s.user?.id);
  const mut = useChangePassword();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setErr('');
    if (!cur) { setErr('Nhập mật khẩu hiện tại.'); return; }
    if (next.length < 6) { setErr('Mật khẩu mới cần ít nhất 6 ký tự.'); return; }
    if (next !== again) { setErr('Mật khẩu nhập lại không khớp.'); return; }
    if (next === cur) { setErr('Mật khẩu mới phải khác mật khẩu hiện tại.'); return; }
    try { await mut.mutateAsync({ id, currentPassword: cur, newPassword: next }); toast('Đã đổi mật khẩu'); navigation.goBack(); }
    catch (e) { setErr(e?.response?.status === 400 || e?.response?.status === 401 ? (e?.response?.data?.message || 'Mật khẩu hiện tại không đúng.') : errMsg(e)); }
  };

  const eye = <IconBtn name="eye" onPress={() => setShow(!show)} label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} />;
  return (
    <Screen>
      <AppBar title="Đổi mật khẩu" onBack={() => navigation.goBack()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 14 }}>
        <Field label="Mật khẩu hiện tại" value={cur} onChangeText={setCur} secureTextEntry={!show} autoCapitalize="none" right={eye} />
        <Field label="Mật khẩu mới (≥ 6 ký tự)" value={next} onChangeText={setNext} secureTextEntry={!show} autoCapitalize="none" />
        <Field label="Nhập lại mật khẩu mới" value={again} onChangeText={setAgain} secureTextEntry={!show} autoCapitalize="none" />
        {err ? <T color={c.err}>{err}</T> : null}
        <Button title="Đổi mật khẩu" onPress={submit} loading={mut.isPending} />
      </ScrollView>
    </Screen>
  );
}
