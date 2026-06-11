import { Link } from 'react-router-dom';

// Empty state là "lời mời hành động", không phải màn hình chết
export default function EmptyState({ title, hint, ctaLabel, ctaTo }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="text-5xl">🪵</div>
      <h3 className="text-lg font-medium">{title}</h3>
      {hint && <p className="text-sm text-base-content/60 max-w-sm">{hint}</p>}
      {ctaTo && <Link to={ctaTo} className="btn btn-primary btn-sm mt-2">{ctaLabel}</Link>}
    </div>
  );
}
