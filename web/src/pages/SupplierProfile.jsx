import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useSupplierPublicProfile, useSupplierStores, useSupplierPortfolio,
  useSupplierReviews, useSupplierReviewSummary,
} from '../hooks/usePublicSuppliers.js';
import { useSupplierChatStore } from '../stores/supplierChatStore.js';
import SupplierProfileHeader from '../components/suppliers/SupplierProfileHeader.jsx';
import SectionCard from '../components/suppliers/SectionCard.jsx';
import SupplierBranches from '../components/suppliers/SupplierBranches.jsx';
import SupplierPortfolio from '../components/suppliers/SupplierPortfolio.jsx';
import SupplierReviews from '../components/suppliers/SupplierReviews.jsx';
import SupplierWorkflow from '../components/suppliers/SupplierWorkflow.jsx';
import SupplierQuickInfo from '../components/suppliers/SupplierQuickInfo.jsx';
import SupplierStrengths from '../components/suppliers/SupplierStrengths.jsx';
import { Info, Send } from '../components/suppliers/icons.jsx';

/*
 * ⚠️ Bỏ hoàn toàn section "Năng lực sản xuất" (SupplierCapabilities) — supplier thật KHÔNG có
 * specialties/capacity/serviceArea/supportedProducts/supportedWood. Không "chế" dữ liệu giả.
 */
export default function SupplierProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: supplier, isLoading, isError } = useSupplierPublicProfile(id);
  const { data: branches } = useSupplierStores(id);
  const { data: portfolio } = useSupplierPortfolio(id);
  const { data: reviews } = useSupplierReviews(id);
  const { data: reviewSummary } = useSupplierReviewSummary(id);
  const [fav, setFav] = useState(false);
  const openChat = useSupplierChatStore((s) => s.openFromSupplier);

  const orderCustom = () => navigate(`/custom/configure/table?supplierId=${id}`);
  const contactSupplier = () => openChat({ id, name: supplier?.businessName });
  const scrollToContact = () =>
    document.getElementById('supplier-quick-info')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="skeleton h-56 rounded-3xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="skeleton h-96 rounded-3xl" />
          <div className="skeleton h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (isError || !supplier) {
    return (
      <div className="rounded-3xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-2xl">{t('suppliers.notFoundTitle')}</p>
        <Link to="/suppliers" className="btn btn-primary mt-5">{t('suppliers.notFoundBack')}</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-base-content/55">
        <Link to="/" className="hover:text-primary">{t('suppliers.breadcrumbHome')}</Link>
        <span>/</span>
        <Link to="/suppliers" className="hover:text-primary">{t('suppliers.title')}</Link>
        <span>/</span>
        <span className="font-medium text-base-content/80">{supplier.businessName}</span>
      </nav>

      <SupplierProfileHeader supplier={supplier} reviewSummary={reviewSummary} onOrderCustom={orderCustom} onContact={contactSupplier} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="flex flex-col gap-6">
          {supplier.description && (
            <SectionCard icon={Info} title={t('suppliers.sectionAbout')}>
              <p className="leading-relaxed text-base-content/75">{supplier.description}</p>
              <SupplierStrengths />
            </SectionCard>
          )}

          <SupplierBranches branches={branches ?? []} />
          <SupplierPortfolio items={portfolio ?? []} supplierName={supplier.businessName} onViewAll={scrollToContact} />
          <SupplierReviews items={reviews?.content ?? []} onViewAll={scrollToContact} />
          <SupplierWorkflow />
        </div>

        <SupplierQuickInfo supplier={supplier} onOrderCustom={orderCustom} fav={fav} onToggleFav={() => setFav((v) => !v)} />
      </div>

      <section className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-base-300 bg-base-200/60 p-6 text-center md:flex-row md:p-8 md:text-left">
        <div>
          <h2 className="font-display text-xl md:text-2xl">{t('suppliers.bottomCtaTitle')}</h2>
          <p className="mt-1 text-base-content/65">{t('suppliers.bottomCtaDesc', { name: supplier.businessName })}</p>
        </div>
        <button onClick={orderCustom} className="btn btn-primary shrink-0 gap-2">
          <Send width={16} height={16} /> {t('suppliers.bottomCtaBtn')}
        </button>
      </section>
    </div>
  );
}
