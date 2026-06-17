import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Hero from '../components/hero/Hero.jsx';
import ProductCard from '../components/ui/ProductCard.jsx';
import Footer from '../components/layout/Footer.jsx';
import SideRail from '../components/ui/SideRail.jsx';
import { useFeaturedProducts } from '../hooks/useProducts.js';

const FLOW_LINKS = ['/shop', '/b2b', '/custom'];

export default function Landing() {
  const { data, isLoading } = useFeaturedProducts();
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
            <div key={f.title} className="card bg-base-200 border border-base-300 p-6 gap-3">
              <h3 className="font-medium text-lg">{f.title}</h3>
              <p className="text-sm text-base-content/70 flex-1">{f.desc}</p>
              <Link to={FLOW_LINKS[i]} className="btn btn-outline btn-primary btn-sm self-start">{f.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Sản phẩm nổi bật — GET /products/featured */}
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
            {data?.items?.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
