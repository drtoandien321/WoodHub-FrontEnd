import { useTranslation } from 'react-i18next';
import { formatVnd } from '../../utils/format.js';
import { Clock, MapPin, Briefcase, Layers, Tree, Phone, Mail, Send, Bookmark, CheckCircle } from './icons.jsx';

/*
 * Sidebar "Thông tin nhanh" của trang hồ sơ — sticky trên desktop.
 * Gồm: thông số nhanh, tag chuyên môn/gỗ, khối liên hệ và 2 CTA (đặt thiết kế / lưu xưởng).
 */
export default function SupplierQuickInfo({ supplier, onOrderCustom, fav = false, onToggleFav }) {
  const { t } = useTranslation();

  const rows = [
    { icon: Tree, label: t('suppliers.qi.priceFrom'), value: formatVnd(supplier.referencePrice) },
    { icon: Clock, label: t('suppliers.qi.response'), value: supplier.responseTime },
    { icon: MapPin, label: t('suppliers.qi.serviceArea'), value: supplier.district },
    { icon: Briefcase, label: t('suppliers.qi.workType'), value: supplier.workType },
    { icon: Layers, label: t('suppliers.qi.installation'), value: supplier.installation },
  ];

  return (
    <aside id="supplier-quick-info" className="lg:sticky lg:top-24">
      <div className="flex flex-col gap-5 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="font-display text-lg">{t('suppliers.quickInfo')}</h2>

        {/* Thông số nhanh */}
        <dl className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-2 text-sm text-base-content/60">
                <r.icon width={16} height={16} /> {r.label}
              </dt>
              <dd className="text-right text-sm font-semibold">{r.value}</dd>
            </div>
          ))}
        </dl>

        <div className="border-t border-base-300" />

        {/* Tags chuyên môn */}
        <TagGroup title={t('suppliers.specialtyTags')} tags={supplier.specialties} />
        {/* Tags gỗ hỗ trợ */}
        <TagGroup title={t('suppliers.woodTags')} tags={supplier.supportedWood} />

        <div className="border-t border-base-300" />

        {/* Liên hệ */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-base-content/70">{t('suppliers.contactTitle')}</h3>
          <ul className="flex flex-col gap-2 text-sm">
            <li>
              <a href={`tel:${supplier.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-base-content/80 hover:text-primary">
                <Phone width={16} height={16} className="text-primary" /> {supplier.contact.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${supplier.contact.email}`} className="flex items-center gap-2 break-all text-base-content/80 hover:text-primary">
                <Mail width={16} height={16} className="text-primary" /> {supplier.contact.email}
              </a>
            </li>
            <li className="flex items-center gap-2 text-base-content/80">
              <MapPin width={16} height={16} className="text-primary" /> {supplier.contact.address}
            </li>
          </ul>
        </div>

        {/* CTA */}
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

function TagGroup({ title, tags }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-base-content/70">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full border border-base-300 bg-base-200/60 px-3 py-1 text-xs text-base-content/75">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
