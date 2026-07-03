import { useTranslation } from 'react-i18next';
import { Phone, Mail, Send, Bookmark, CheckCircle } from './icons.jsx';

/*
 * Sidebar "Thông tin nhanh" của trang hồ sơ — sticky trên desktop.
 * Đã bỏ: giá tham khảo, thời gian phản hồi, khu vực phục vụ, hình thức làm việc, lắp đặt,
 * tag chuyên môn/gỗ hỗ trợ — KHÔNG field nào trong số này tồn tại ở SupplierPublicResponse.
 * Chỉ còn Liên hệ (contactEmail/contactPhone — có thể null nếu supplier chưa điền) + 2 CTA.
 */
export default function SupplierQuickInfo({ supplier, onOrderCustom, fav = false, onToggleFav }) {
  const { t } = useTranslation();
  const hasContact = supplier.contactPhone || supplier.contactEmail;

  return (
    <aside id="supplier-quick-info" className="lg:sticky lg:top-24">
      <div className="flex flex-col gap-5 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="font-display text-lg">{t('suppliers.quickInfo')}</h2>

        {hasContact ? (
          <div>
            <h3 className="mb-2 text-sm font-medium text-base-content/70">{t('suppliers.contactTitle')}</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {supplier.contactPhone && (
                <li>
                  <a href={`tel:${supplier.contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-base-content/80 hover:text-primary">
                    <Phone width={16} height={16} className="text-primary" /> {supplier.contactPhone}
                  </a>
                </li>
              )}
              {supplier.contactEmail && (
                <li>
                  <a href={`mailto:${supplier.contactEmail}`} className="flex items-center gap-2 break-all text-base-content/80 hover:text-primary">
                    <Mail width={16} height={16} className="text-primary" /> {supplier.contactEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-base-content/55">{t('suppliers.noContact')}</p>
        )}

        <div className="border-t border-base-300" />

        <div className="flex flex-col gap-2">
          <button onClick={onOrderCustom} className="btn btn-primary gap-2">
            <Send width={16} height={16} /> {t('suppliers.orderCustom')}
          </button>
          <button
            onClick={() => onToggleFav?.(supplier.id)}
            aria-pressed={fav}
            className="btn btn-outline gap-2 border-base-300 hover:border-primary hover:bg-primary/10"
          >
            {fav ? <CheckCircle width={16} height={16} /> : <Bookmark width={16} height={16} />}
            {fav ? t('suppliers.saved') : t('suppliers.saveSupplier')}
          </button>
        </div>
      </div>
    </aside>
  );
}
