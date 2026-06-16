import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWorkshopMatch } from '../hooks/useProducts.js';
import EmptyState from '../components/ui/EmptyState.jsx';

/*
 * Ghép xưởng RULE-BASED (scope MVP): lọc theo năng lực khai báo + chấm điểm đơn giản.
 * Logic nằm trong mockAdapter.matchWorkshops — BE port y nguyên sang service.
 */
export default function WorkshopMatch() {
  const { designId } = useParams();
  const { t } = useTranslation();
  const { data, isLoading } = useWorkshopMatch(designId);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl">{t('workshopMatch.title')}</h1>
        <p className="text-sm text-base-content/60 mt-1">{t('workshopMatch.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : data?.matches?.length ? (
        <div className="flex flex-col gap-3">
          {data.matches.map((w, idx) => (
            <div key={w.id} className="flex items-center gap-4 bg-base-200 rounded-2xl p-4 border border-base-300">
              <div className="radial-progress text-primary shrink-0" style={{ '--value': w.score, '--size': '3.5rem' }} role="progressbar">
                {w.score}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{w.name}</h3>
                  {idx === 0 && <span className="badge badge-accent badge-sm">{t('workshopMatch.bestMatch')}</span>}
                </div>
                <p className="text-sm text-base-content/60">
                  {t('workshopMatch.workshopInfo', { district: w.district, rating: w.rating, jobs: w.completedJobs, days: w.leadTimeDays })}
                </p>
              </div>
              <button className="btn btn-primary btn-sm">{t('workshopMatch.requestQuote')}</button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={t('workshopMatch.emptyTitle')} hint={t('workshopMatch.emptyHint')} ctaLabel={t('workshopMatch.editDesign')} ctaTo="/custom" />
      )}

      <Link to="/custom" className="link link-primary text-sm">{t('workshopMatch.designOther')}</Link>
    </div>
  );
}
