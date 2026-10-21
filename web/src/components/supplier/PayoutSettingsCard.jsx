import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMyPayout, useSaveMyPayout } from '../../hooks/useSupplierPortal.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { formatDate } from '../../utils/format.js';

/*
 * PayoutSettingsCard — tài khoản nhận tiền của NCC / xưởng (BE-14 §1).
 *
 * BE mã hoá số tài khoản, NCC chỉ xem được số đã che (accountNumberMasked) → không có cách "sửa 1 field": muốn đổi
 * phải nhập lại ĐỦ thông tin, kể cả số tài khoản. Nên UI chỉ có 2 trạng thái: xem (đã che) và form trống "Đổi tài khoản".
 *
 * Danh sách ngân hàng: API công khai VietQR (BE dặn dùng `code` của VietQR). Không tải được → danh sách dự phòng
 * vài ngân hàng phổ biến để vẫn lưu được.
 */
const FALLBACK_BANKS = [
  ['VCB', 'Vietcombank'], ['TCB', 'Techcombank'], ['MB', 'MB Bank'], ['BIDV', 'BIDV'], ['ICB', 'VietinBank'],
  ['VBA', 'Agribank'], ['ACB', 'ACB'], ['VPB', 'VPBank'], ['TPB', 'TPBank'], ['STB', 'Sacombank'],
].map(([code, shortName]) => ({ code, shortName, name: shortName }));

const useBanks = () =>
  useQuery({
    queryKey: ['vietqrBanks'],
    queryFn: async () => {
      const res = await fetch('https://api.vietqr.io/v2/banks');
      const json = await res.json();
      return (json.data ?? []).map((b) => ({ code: b.code, shortName: b.shortName, name: b.name }));
    },
    staleTime: 24 * 60 * 60_000,
    retry: 1,
  });

const EMPTY = { bankCode: '', accountNumber: '', accountHolder: '', branch: '' };

export default function PayoutSettingsCard() {
  const { data: payout, isLoading, isError } = useMyPayout();
  const banksQuery = useBanks();
  const save = useSaveMyPayout();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const banks = banksQuery.data?.length ? banksQuery.data : FALLBACK_BANKS;
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((x) => ({ ...x, [k]: undefined })); };

  const startEdit = () => { setForm({ ...EMPTY, bankCode: payout?.bankCode ?? '', branch: payout?.branch ?? '' }); setErrors({}); setSubmitError(''); setEditing(true); };

  const submit = (e) => {
    e.preventDefault();
    // BE chỉ nhận chữ số 6–19 → FE bỏ khoảng trắng / dấu chấm / gạch người dùng hay gõ khi chép số TK
    const accountNumber = form.accountNumber.replace(/[\s.-]/g, '');
    const next = {};
    if (!form.bankCode) next.bankCode = 'Chọn ngân hàng';
    if (!/^\d{6,19}$/.test(accountNumber)) next.accountNumber = 'Số tài khoản gồm 6–19 chữ số';
    if (!form.accountHolder.trim()) next.accountHolder = 'Nhập tên chủ tài khoản';
    setErrors(next);
    if (Object.keys(next).length) return;
    const bank = banks.find((b) => b.code === form.bankCode);
    setSubmitError('');
    save.mutate(
      { bankCode: form.bankCode, bankName: bank?.shortName ?? bank?.name ?? form.bankCode, accountNumber, accountHolder: form.accountHolder.trim(), branch: form.branch.trim() || undefined },
      {
        onSuccess: () => setEditing(false),
        onError: (err) => {
          if (err?.response?.data?.fieldErrorCodes?.accountNumber === 'PATTERN') setErrors({ accountNumber: 'Số tài khoản gồm 6–19 chữ số' });
          // 503 PAYOUT_ENCRYPTION_UNAVAILABLE = server chưa cấu hình khoá mã hoá
          setSubmitError(err?.response?.status === 503 ? 'Tạm thời chưa lưu được, vui lòng thử lại sau.' : apiErrorMessage(err, 'Không lưu được tài khoản nhận tiền.'));
        },
      }
    );
  };

  if (isLoading) return <div className="skeleton h-48 rounded-2xl" />;

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg">Tài khoản nhận tiền</h2>
        {!editing && payout?.configured && <button type="button" onClick={startEdit} className="btn btn-outline btn-sm">Đổi tài khoản</button>}
      </div>
      <p className="mb-4 text-xs text-base-content/55">WoodHub chuyển tiền bán hàng (sau hoa hồng) vào tài khoản này. Số tài khoản được mã hoá, chỉ hiển thị 4 số cuối.</p>

      {isError && <p className="mb-3 text-sm text-error">Không tải được thông tin nhận tiền.</p>}

      {!editing && payout?.configured && (
        <dl className="grid grid-cols-1 gap-3 rounded-xl bg-base-200/50 p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-xs text-base-content/55">Ngân hàng</dt><dd className="font-medium">{payout.bankName} ({payout.bankCode})</dd></div>
          <div><dt className="text-xs text-base-content/55">Số tài khoản</dt><dd className="font-mono font-medium">{payout.accountNumberMasked}</dd></div>
          <div><dt className="text-xs text-base-content/55">Chủ tài khoản</dt><dd className="font-medium">{payout.accountHolder}</dd></div>
          <div><dt className="text-xs text-base-content/55">Chi nhánh</dt><dd className="font-medium">{payout.branch || '—'}</dd></div>
          {payout.updatedAt && <p className="text-xs text-base-content/45 sm:col-span-2">Cập nhật {formatDate(payout.updatedAt)}</p>}
        </dl>
      )}

      {!editing && !payout?.configured && !isError && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-warning/50 bg-warning/5 p-4 text-sm">
          <p>Bạn chưa khai báo tài khoản nhận tiền. Cần có tài khoản để WoodHub đối soát và chuyển tiền bán hàng.</p>
          <button type="button" onClick={startEdit} className="btn btn-primary btn-sm">Thêm tài khoản</button>
        </div>
      )}

      {editing && (
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm text-base-content/70">Ngân hàng *</span>
            <select value={form.bankCode} onChange={set('bankCode')} className={`select select-bordered w-full ${errors.bankCode ? 'select-error' : ''}`}>
              <option value="">— Chọn ngân hàng —</option>
              {banks.map((b) => <option key={b.code} value={b.code}>{b.shortName} — {b.name}</option>)}
            </select>
            {banksQuery.isError && <span className="text-xs text-base-content/45">Không tải được danh sách đầy đủ, đang hiện các ngân hàng phổ biến.</span>}
            {errors.bankCode && <span className="text-xs text-error">{errors.bankCode}</span>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Số tài khoản *</span>
            <input value={form.accountNumber} onChange={set('accountNumber')} inputMode="numeric" autoComplete="off" className={`input input-bordered w-full font-mono ${errors.accountNumber ? 'input-error' : ''}`} />
            {errors.accountNumber && <span className="text-xs text-error">{errors.accountNumber}</span>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Tên chủ tài khoản *</span>
            <input value={form.accountHolder} onChange={set('accountHolder')} className={`input input-bordered w-full uppercase ${errors.accountHolder ? 'input-error' : ''}`} placeholder="NGUYEN VAN A" />
            {errors.accountHolder && <span className="text-xs text-error">{errors.accountHolder}</span>}
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm text-base-content/70">Chi nhánh</span>
            <input value={form.branch} onChange={set('branch')} className="input input-bordered w-full" placeholder="VD: Hà Nội" />
          </label>
          {payout?.configured && <p className="text-xs text-base-content/55 sm:col-span-2">Vì lý do bảo mật, cần nhập lại đầy đủ số tài khoản khi thay đổi.</p>}
          {submitError && <p className="text-sm text-error sm:col-span-2" role="alert">{submitError}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={() => setEditing(false)} disabled={save.isPending} className="btn btn-ghost">Hủy</button>
            <button type="submit" disabled={save.isPending} className="btn btn-primary">
              {save.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Lưu tài khoản'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
