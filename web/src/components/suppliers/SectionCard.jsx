/*
 * Khung section dùng chung ở cột nội dung trang hồ sơ: card bo góc + tiêu đề có icon + slot action.
 * Giữ giao diện các section đồng nhất, tránh lặp lại markup heading.
 */
export default function SectionCard({ icon: Icon, title, action, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm md:p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-xl">
          {Icon && <span className="text-primary"><Icon width={20} height={20} /></span>}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
