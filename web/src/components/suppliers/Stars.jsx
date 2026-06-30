import { Star } from './icons.jsx';

// Rating sao (gold/accent). value = số sao đầy (0–5). size = px mỗi sao.
export default function Stars({ value = 5, size = 14, className = '' }) {
  const full = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-0.5 text-accent ${className}`} aria-label={`${value}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} width={size} height={size} filled={i < full} />
      ))}
    </span>
  );
}
