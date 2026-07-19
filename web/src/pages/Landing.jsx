import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import Hero from '../components/hero/Hero.jsx';
import ProductCard from '../components/ui/ProductCard.jsx';
import Footer from '../components/layout/Footer.jsx';
import SideRail from '../components/ui/SideRail.jsx';
import { useProducts } from '../hooks/useProducts.js';

const FLOW_LINKS = ['/shop', '/b2b', '/custom'];

/*
 * FE-7: "product cards xuất hiện theo scroll" — whileInView (không phải scroll-linked parallax,
 * chỉ trigger 1 lần khi phần tử lọt vào viewport) + viewport.once để không lặp lại khi cuộn qua
 * lại nhiều lần (tránh xao nhãng). reducedMotion đã xử lý toàn cục qua MotionConfig ở main.jsx.
 */
const REVEAL = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
};

// Sản phẩm nổi bật ở Landing dùng CHUNG nguồn dữ liệu thật với trang Shop (GET /products) — không
// có endpoint /products/featured riêng (đang lỗi 400 ở BE), nên lấy 4 sản phẩm mới nhất thay thế.
const FEATURED_PARAMS = { size: 4, sort: 'createdAt,desc' };

export default function Landing() {
  const { data, isLoading } = useProducts(FEATURED_PARAMS);
  const { t } = useTranslation();
  const flows = t('landing.flows', { returnObjects: true });

  return (
    <div className="bg-base-100">
      <SideRail />
      <Hero />

      {/* 3 luồng chính */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <h2 className="font-display text-3xl text-center mb-10">{t('landing.flowsTitle')}</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {flows.map((f, i) => (
            <motion.div
              key={f.title}
              className="card bg-base-200 border border-base-300 p-6 gap-3"
              initial={REVEAL.initial}
              whileInView={REVEAL.whileInView}
              viewport={REVEAL.viewport}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <h3 className="font-medium text-lg">{f.title}</h3>
              <p className="text-sm text-base-content/70 flex-1">{f.desc}</p>
              <Link to={FLOW_LINKS[i]} className="btn btn-outline btn-primary btn-sm self-start">{f.cta}</Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sản phẩm nổi bật — GET /products (xem FEATURED_PARAMS ở trên) */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-display text-3xl">{t('landing.featuredTitle')}</h2>
          <Link to="/shop" className="link link-primary text-sm">{t('landing.viewAll')}</Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(data?.content ?? []).map((p, i) => (
              <motion.div key={p.id} initial={REVEAL.initial} whileInView={REVEAL.whileInView} viewport={REVEAL.viewport} transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
