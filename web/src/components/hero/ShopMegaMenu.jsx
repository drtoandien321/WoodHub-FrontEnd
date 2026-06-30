import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { SHOP_MENU } from '../../data/shopMenu.js';
import { ChevronRight } from './HeroNavbar.jsx';

/*
 * ShopMegaMenu — mega menu phân nhánh 4 cột cho nút "Cửa hàng" (Landing/HeroNavbar).
 *
 * Cách hoạt động:
 *  - Cột 1: danh mục lớn (icon + tên). Hover → chọn → đổ cột 2.
 *  - Cột 2: con của mục cột 1 đang chọn. Hover → đổ cột 3.
 *  - Cột 3: con của mục cột 2 đang chọn. Hover → đổ cột 4.
 *  - Cột 4: SP cụ thể (ảnh + tên + "Xem chi tiết") + link "Xem tất cả".
 *  Mỗi cấp MẶC ĐỊNH chọn mục đầu tiên (giống ảnh mẫu) — nên vừa mở đã thấy đủ 4 cột.
 *
 * State chỉ lưu id đang hover ở mỗi cấp; các giá trị "hiệu lực" (node2/node3) suy ra
 * bằng find(...) ?? phần tử đầu, nên không bao giờ rỗng khi nhánh còn dữ liệu.
 * Khi hover cấp trên thì reset cấp dưới để tránh chọn lệch nhánh.
 *
 * Hover giữ menu mở: panel này là CON của <nav> (xem HeroNavbar) → di chuột giữa các
 * cột không làm nav phát sự kiện mouseleave.
 */

// Icon line cho cột 1 (stroke, hợp tông nâu, không cần thêm thư viện icon)
const ICONS = {
  rooms: 'M3 21V9l9-6 9 6v12h-6v-7h-6v7H3Z',
  furniture: 'M4 10V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 10h18v6h-2v3M5 19v-3M3 10v6',
  materials: 'M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 18l9 5 9-5',
  decor: 'M12 3v4M8 7h8l1 5a5 5 0 0 1-10 0l1-5ZM9 21h6M12 17v4',
  lighting: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3Z',
  deals: 'M20.6 13.4 12 22l-8.6-8.6a4 4 0 0 1 0-5.7l.7-.7a4 4 0 0 1 5.7 0l2.2 2.2 2.2-2.2a4 4 0 0 1 5.7 0l.7.7a4 4 0 0 1 0 5.7Z',
};

const CategoryIcon = ({ name }) => (
  <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d={ICONS[name] ?? ICONS.furniture} />
  </svg>
);

const text = (node, lang) => node?.label?.[lang] ?? node?.label?.vi ?? '';

// 1 hàng trong cột 1–3: có thể là nút (hover để mở cấp sau) kèm link điều hướng.
function Row({ active, hasNext, onHover, to, onNavigate, children, icon }) {
  const inner = (
    <>
      {icon && <CategoryIcon name={icon} />}
      <span className="flex-1 truncate">{children}</span>
      {hasNext && <ChevronRight className="w-4 h-4 opacity-50" />}
    </>
  );
  const cls = `flex items-center gap-2.5 w-full text-left text-sm rounded-xl px-3 py-2.5 transition-colors ${
    active ? 'bg-white text-hero-ink shadow-[0_1px_4px_rgba(74,53,34,0.08)]' : 'text-hero-ink/80 hover:bg-white/60'
  }`;
  return to ? (
    <Link to={to} onClick={onNavigate} onMouseEnter={onHover} className={cls}>{inner}</Link>
  ) : (
    <button type="button" onMouseEnter={onHover} className={cls}>{inner}</button>
  );
}

export default function ShopMegaMenu({ onNavigate }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'vi';

  const [id1, setId1] = useState(SHOP_MENU[0].id);
  const [id2, setId2] = useState(null);
  const [id3, setId3] = useState(null);

  const node1 = SHOP_MENU.find((n) => n.id === id1) ?? SHOP_MENU[0];
  const col2 = node1.children ?? [];
  const node2 = col2.find((n) => n.id === id2) ?? col2[0];
  const col3 = node2?.children ?? [];
  const node3 = col3.find((n) => n.id === id3) ?? col3[0];
  const products = node3?.products ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      role="menu"
      className="rounded-2xl bg-ivory border border-black/5 shadow-[0_12px_40px_rgba(74,53,34,0.22)] p-2.5 flex"
    >
      {/* CỘT 1 — danh mục lớn */}
      <div className="w-60 flex flex-col gap-0.5 pr-2.5 border-r border-hero-ink/8">
        {SHOP_MENU.map((n) => (
          <Row
            key={n.id}
            icon={n.icon}
            active={n.id === node1.id}
            hasNext={!!n.children?.length}
            onHover={() => { setId1(n.id); setId2(null); setId3(null); }}
            to={n.to}
            onNavigate={onNavigate}
          >
            {text(n, lang)}
          </Row>
        ))}
      </div>

      {/* CỘT 2 — con của cột 1 */}
      {col2.length > 0 && (
        <div className="w-60 flex flex-col gap-0.5 px-2.5 border-r border-hero-ink/8">
          {col2.map((n) => (
            <Row
              key={n.id}
              active={n.id === node2?.id}
              hasNext={!!n.children?.length}
              onHover={() => { setId2(n.id); setId3(null); }}
              to={n.children?.length ? n.to : (n.to ?? '/shop')}
              onNavigate={onNavigate}
            >
              {text(n, lang)}
            </Row>
          ))}
        </div>
      )}

      {/* CỘT 3 — con của cột 2 */}
      {col3.length > 0 && (
        <div className="w-56 flex flex-col gap-0.5 px-2.5 border-r border-hero-ink/8">
          {col3.map((n) => (
            <Row
              key={n.id}
              active={n.id === node3?.id}
              hasNext={!!n.products?.length}
              onHover={() => setId3(n.id)}
              to={n.to ?? '/shop'}
              onNavigate={onNavigate}
            >
              {text(n, lang)}
            </Row>
          ))}
        </div>
      )}

      {/* CỘT 4 — SP cụ thể + "Xem tất cả" */}
      {products.length > 0 && (
        <div className="w-64 flex flex-col gap-1 pl-2.5">
          {products.map((p) => (
            <Link
              key={p.id}
              to={p.to ?? '/shop'}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/60 transition-colors"
            >
              <img src={p.image} alt="" loading="lazy" className="w-14 h-12 rounded-lg object-cover shrink-0 bg-hero-ink/5" />
              <span className="flex flex-col leading-tight">
                <span className="text-sm text-hero-ink">{text(p, lang)}</span>
                <span className="text-xs text-hero-ink/50">{t('megaMenu.viewDetail')}</span>
              </span>
            </Link>
          ))}
          <Link
            to={node3?.to ?? '/shop'}
            onClick={onNavigate}
            className="mt-1 flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-hero-ink/80 hover:bg-white/60 transition-colors border-t border-hero-ink/8"
          >
            <span>{t('megaMenu.viewAllNamed', { name: text(node3, lang) })}</span>
            <ChevronRight className="w-4 h-4 opacity-50" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
