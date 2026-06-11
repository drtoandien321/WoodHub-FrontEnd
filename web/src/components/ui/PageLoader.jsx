// Fallback của Suspense khi bundle lazy đang tải
export default function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <span className="loading loading-ring loading-lg text-primary" />
    </div>
  );
}
