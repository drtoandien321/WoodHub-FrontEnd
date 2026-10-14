import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Pressable, TextInput, Text } from 'react-native';
import { Screen, T, Button, Field, AppBar, IconBtn, useToast } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme, fonts } from '../theme/theme.js';
import { api, errMsg } from '../api/client.js';
import { useAuth } from '../store/auth.js';

const emailOk = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

function Brand() {
  const { c } = useTheme();
  return (
    <View>
      <Text style={{ fontFamily: fonts.display, fontSize: 28, letterSpacing: 1.1, color: c.pri }}>WOODHUB</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, letterSpacing: 4.5, color: c.mute }}>FURNITURE & CRAFT</Text>
    </View>
  );
}

function GoogleBtn({ label }) {
  const { c } = useTheme();
  const toast = useToast();
  return (
    <Pressable onPress={() => toast('Đăng nhập Google đang hoàn thiện — hiện dùng email')}
      style={{ height: 52, borderWidth: 1.5, borderColor: c.line2, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: c.line2, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: c.ink }}>G</Text>
      </View>
      <Text style={{ fontFamily: fonts.semi, fontSize: 16, color: c.ink }}>{label}</Text>
    </Pressable>
  );
}

// ---------------- Đăng nhập ----------------
export function LoginScreen({ navigation }) {
  const { c } = useTheme();
  const setAuth = useAuth((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!emailOk(email) || !pw) { setErr('Vui lòng nhập email hợp lệ và mật khẩu.'); return; }
    setBusy(true); setErr('');
    try {
      const auth = await api.login({ email: email.trim(), password: pw });
      await setAuth(auth); // RootNavigator tự chuyển sang Main khi có token
    } catch (e) {
      setErr(e?.response?.status === 401 || e?.response?.status === 400 ? 'Email hoặc mật khẩu không đúng.' : errMsg(e));
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, gap: 14, flexGrow: 1 }}>
        <Brand />
        <View style={{ marginTop: 24 }}>
          <T v="h1">Đăng nhập</T>
          <T mute style={{ marginTop: 4 }}>Chào mừng bạn quay lại.</T>
        </View>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="ban@example.com" />
        <Field label="Mật khẩu" value={pw} onChangeText={setPw} secureTextEntry={!show} placeholder="Mật khẩu" error={err}
          right={<IconBtn name="eye" color={show ? c.pri : c.mute} onPress={() => setShow(!show)} label="Hiện/ẩn mật khẩu" />} />
        <Pressable onPress={() => navigation.navigate('Forgot')} style={{ alignSelf: 'flex-end', height: 44, justifyContent: 'center', marginTop: -6 }}>
          <T v="semi" color={c.pri}>Quên mật khẩu?</T>
        </Pressable>
        <Button title="Đăng nhập" onPress={submit} loading={busy} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: c.line }} /><T v="small" mute>hoặc</T><View style={{ flex: 1, height: 1, backgroundColor: c.line }} />
        </View>
        <GoogleBtn label="Đăng nhập với Google" />
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
          <T mute>Chưa có tài khoản?</T>
          <Pressable onPress={() => navigation.navigate('Register')} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.pri} style={{ fontFamily: fonts.bold }}>Đăng ký</T></Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

// ---------------- Đăng ký ----------------
export function RegisterScreen({ navigation }) {
  const { c } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [agree, setAgree] = useState(true);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e = {};
    if (name.trim().length < 2) e.name = 'Vui lòng nhập họ tên.';
    if (!emailOk(email)) e.email = 'Email không hợp lệ.';
    if (pw.length < 6) e.pw = 'Mật khẩu tối thiểu 6 ký tự.';
    if (!agree) e.agree = 'Bạn cần đồng ý điều khoản để tiếp tục.';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await api.register({ name: name.trim(), email: email.trim(), password: pw });
      navigation.navigate('Otp', { email: email.trim(), mode: 'register' });
    } catch (ex) { setErr({ form: errMsg(ex) }); } finally { setBusy(false); }
  };

  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} title="" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 14 }}>
        <View><T v="h1">Tạo tài khoản</T><T mute style={{ marginTop: 4 }}>Lưu thiết kế và nhận báo giá từ xưởng.</T></View>
        <Field label="Họ và tên" value={name} onChangeText={setName} error={err.name} />
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={err.email} />
        <Field label="Mật khẩu" value={pw} onChangeText={setPw} secureTextEntry placeholder="Tối thiểu 6 ký tự" error={err.pw} />
        <Pressable onPress={() => setAgree(!agree)} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 6 }}>
          <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: c.pri, backgroundColor: agree ? c.pri : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {agree ? <Icon name="check" size={16} color={c.onpri} /> : null}
          </View>
          <T v="small" style={{ flex: 1 }}>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của WoodHub.</T>
        </Pressable>
        {err.agree ? <T v="small" color={c.err}>{err.agree}</T> : null}
        {err.form ? <T v="small" color={c.err}>{err.form}</T> : null}
        <Button title="Đăng ký" onPress={submit} loading={busy} />
        <GoogleBtn label="Đăng ký với Google" />
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
          <T mute>Đã có tài khoản?</T>
          <Pressable onPress={() => navigation.goBack()} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.pri} style={{ fontFamily: fonts.bold }}>Đăng nhập</T></Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

// ---------------- OTP (đăng ký + đặt lại mật khẩu) ----------------
export function OtpScreen({ navigation, route }) {
  const { c } = useTheme();
  const toast = useToast();
  const { email, mode } = route.params || {};
  const setAuth = useAuth((s) => s.setAuth);
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [left, setLeft] = useState(60);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const reset = mode === 'reset';

  useEffect(() => {
    const t = setInterval(() => setLeft((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const ready = code.length === 6 && (!reset || pw.length >= 6);
  const submit = async () => {
    setBusy(true); setErr('');
    try {
      if (reset) {
        await api.resetPassword({ email, code, newPassword: pw });
        toast('Đã đặt lại mật khẩu — hãy đăng nhập');
        navigation.popToTop();
      } else {
        const auth = await api.verifyOtp({ email, code });
        await setAuth(auth);
      }
    } catch (e) { setErr(e?.response?.status === 400 ? 'Mã không đúng hoặc đã hết hạn.' : errMsg(e)); } finally { setBusy(false); }
  };
  const resend = async () => {
    try { await (reset ? api.forgotPassword({ email }) : api.resendOtp({ email })); setLeft(60); toast('Đã gửi lại mã'); } catch (e) { setErr(errMsg(e)); }
  };
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} title="" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, gap: 12, flexGrow: 1 }}>
        <T v="h1">Nhập mã OTP</T>
        <T mute>Mã gồm 6 số đã được gửi đến <T v="semi">{email}</T></T>
        <Pressable onPress={() => input.current?.focus()} style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          {Array.from({ length: 6 }).map((_, k) => (
            <View key={k} style={{ flex: 1, height: 58, borderRadius: 14, borderWidth: 1.5, borderColor: k === code.length ? c.pri : c.line, backgroundColor: c.surf, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 26, color: c.ink }}>{code[k] || ''}</Text>
            </View>
          ))}
          <TextInput ref={input} value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6}
            autoFocus style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0 }} caretHidden />
        </Pressable>
        {err ? <T v="small" color={c.err}>{err}</T> : null}
        {left > 0
          ? <T mute style={{ marginTop: 6 }}>Gửi lại mã sau <T v="semi">{mm}:{ss}</T></T>
          : <Pressable onPress={resend} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.pri}>Gửi lại mã</T></Pressable>}
        {reset ? <Field label="Mật khẩu mới" value={pw} onChangeText={setPw} secureTextEntry placeholder="Tối thiểu 6 ký tự" /> : null}
        <View style={{ flex: 1 }} />
        <Button title={reset ? 'Đặt lại mật khẩu' : 'Xác nhận'} onPress={submit} disabled={!ready} loading={busy} />
      </ScrollView>
    </Screen>
  );
}

// ---------------- Quên mật khẩu ----------------
export function ForgotScreen({ navigation }) {
  const { c } = useTheme();
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!emailOk(email)) { setErr('Email không hợp lệ.'); return; }
    setBusy(true); setErr('');
    try { await api.forgotPassword({ email: email.trim() }); navigation.navigate('Otp', { email: email.trim(), mode: 'reset' }); }
    catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };
  return (
    <Screen>
      <AppBar onBack={() => navigation.goBack()} title="" />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24, gap: 14 }}>
        <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: c.surf2, alignItems: 'center', justifyContent: 'center' }}><Icon name="lock" size={28} color={c.pri} /></View>
        <T v="h1">Quên mật khẩu</T>
        <T mute>Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP để bạn đặt lại mật khẩu.</T>
        <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={err} />
        <View style={{ flex: 1 }} />
        <Button title="Gửi mã" onPress={submit} loading={busy} />
      </View>
    </Screen>
  );
}
