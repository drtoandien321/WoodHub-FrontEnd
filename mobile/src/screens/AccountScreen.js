import React, { useEffect, useState } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, AppBar, T, Card, Field, Button, Skeleton, Row, Badge, useToast } from '../components/ui.js';
import { useTheme } from '../theme/theme.js';
import { useAuth } from '../store/auth.js';
import { useMe, useUpdateProfile, useBusinessProfile, useSaveBusinessProfile } from '../hooks/account.js';
import { errMsg } from '../api/client.js';

const PHONE_RE = /^0\d{9}$/;
const firstBeError = (e) => { const be = e?.response?.data?.errors; return be ? Object.values(be)[0] : null; };

/*
 * Hồ sơ cá nhân + hồ sơ doanh nghiệp (port web pages/Profile.jsx + BusinessProfileSection).
 * - PUT /users/{id} chỉ đổi họ tên + SĐT; email không đổi được.
 * - Hồ sơ DN (thông tin xuất VAT): tạo lần đầu → BE nâng tài khoản lên "doanh nghiệp" (mở báo giá số lượng lớn, VAT).
 */
export default function AccountScreen({ navigation }) {
  const { c } = useTheme();
  const toast = useToast();
  const user = useAuth((s) => s.user);
  const me = useMe();
  const upd = useUpdateProfile();
  const bp = useBusinessProfile();
  const saveBp = useSaveBusinessProfile(!!bp.data);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [perr, setPerr] = useState('');
  useEffect(() => { if (me.data) { setName(me.data.fullName || ''); setPhone(me.data.phone || ''); } }, [me.data]);

  const [co, setCo] = useState({ companyName: '', taxCode: '', companyAddress: '' });
  const [berr, setBerr] = useState('');
  useEffect(() => { if (bp.data) setCo({ companyName: bp.data.companyName || '', taxCode: bp.data.taxCode || '', companyAddress: bp.data.companyAddress || '' }); }, [bp.data]);

  const phoneOk = !phone.trim() || PHONE_RE.test(phone.replace(/\s/g, ''));
  const saveProfile = async () => {
    setPerr('');
    if (!name.trim()) { setPerr('Nhập họ tên.'); return; }
    if (!phoneOk) { setPerr('Số điện thoại gồm 10 số, bắt đầu bằng 0.'); return; }
    try { await upd.mutateAsync({ id: user.id, fullName: name.trim(), phone: phone.replace(/\s/g, '') || null }); toast('Đã lưu thông tin'); }
    catch (e) { setPerr(firstBeError(e) || errMsg(e, 'Không lưu được thông tin.')); }
  };
  const saveBusiness = async () => {
    setBerr('');
    const body = { companyName: co.companyName.trim(), taxCode: co.taxCode.trim(), companyAddress: co.companyAddress.trim() };
    if (!body.companyName || !body.taxCode || !body.companyAddress) { setBerr('Nhập đủ tên công ty, mã số thuế và địa chỉ công ty.'); return; }
    try { await saveBp.mutateAsync(body); toast(bp.data ? 'Đã cập nhật hồ sơ doanh nghiệp' : 'Tài khoản đã chuyển sang doanh nghiệp'); }
    catch (e) { setBerr(firstBeError(e) || errMsg(e, 'Không lưu được hồ sơ doanh nghiệp.')); }
  };

  const business = user?.customerType === 'business';
  return (
    <Screen>
      <AppBar title="Hồ sơ của tôi" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
          {me.isLoading ? <Skeleton h={220} r={22} /> : (
            <Card style={{ gap: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}><T v="h3">Thông tin cá nhân</T><Badge kind={business ? 'neg' : 'muted'} label={business ? 'Doanh nghiệp' : 'Cá nhân'} /></Row>
              <Field label="Họ tên" value={name} onChangeText={setName} maxLength={100} />
              <Field label="Số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0901234567" error={!phoneOk ? 'Số điện thoại gồm 10 số, bắt đầu bằng 0' : ''} maxLength={15} />
              <View style={{ gap: 4 }}><T v="label">Email</T><T mute>{me.data?.email || user?.email} (không đổi được)</T></View>
              {perr ? <T color={c.err}>{perr}</T> : null}
              <Button title="Lưu thay đổi" onPress={saveProfile} loading={upd.isPending} />
              <Button title="Đổi mật khẩu" kind="outline" icon="lock" onPress={() => navigation.navigate('ChangePassword')} />
            </Card>
          )}

          {bp.isLoading ? <Skeleton h={240} r={22} /> : (
            <Card style={{ gap: 12 }}>
              <T v="h3">Hồ sơ doanh nghiệp</T>
              <T v="small" mute>Dùng để xuất hoá đơn VAT và gửi yêu cầu báo giá số lượng lớn cho nhà cung cấp.</T>
              {!bp.data ? (
                <Card style={{ backgroundColor: c.bnBg, borderColor: c.bnBg }} pad={12}>
                  <T v="small" color={c.bnTx}>Bạn đang dùng tài khoản cá nhân. Tạo hồ sơ doanh nghiệp sẽ chuyển tài khoản sang loại Doanh nghiệp.</T>
                </Card>
              ) : null}
              <Field label="Tên công ty *" value={co.companyName} onChangeText={(v) => setCo((s) => ({ ...s, companyName: v }))} maxLength={255} />
              <Field label="Mã số thuế *" value={co.taxCode} onChangeText={(v) => setCo((s) => ({ ...s, taxCode: v }))} maxLength={20} keyboardType="number-pad" />
              <Field label="Địa chỉ công ty *" value={co.companyAddress} onChangeText={(v) => setCo((s) => ({ ...s, companyAddress: v }))} maxLength={500} multiline />
              {berr ? <T color={c.err}>{berr}</T> : null}
              <Button title={bp.data ? 'Cập nhật hồ sơ doanh nghiệp' : 'Tạo hồ sơ doanh nghiệp'} onPress={saveBusiness} loading={saveBp.isPending} />
              {business ? <Button title="Báo giá số lượng lớn của tôi" kind="outline" icon="quote" onPress={() => navigation.navigate('BulkQuotes')} /> : null}
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
