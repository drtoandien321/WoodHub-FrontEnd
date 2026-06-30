import { CheckCircle, Pencil, Award, Layers } from '../suppliers/icons.jsx';

/*
 * ProfileCapabilityView — trang "Hồ sơ & Năng lực" dùng chung (manufacturer & workshop).
 * Props: name, description, profile {cover,strengths[],capabilities[{label,value}],portfolio[],certs[]}, subtitle.
 */
export default function ProfileCapabilityView({ name, description, profile, subtitle }) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Hồ sơ &amp; Năng lực</h1>
        <p className="mt-1 text-base-content/60">{subtitle}</p>
      </header>

      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
        <img src={profile.cover} alt="" className="h-40 w-full object-cover md:h-52" />
        <div className="p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">{name}</h2>
            <button className="btn btn-outline btn-sm gap-2"><Pencil width={15} height={15} /> Chỉnh sửa</button>
          </div>
          <p className="mt-2 max-w-3xl leading-relaxed text-base-content/75">{description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.strengths.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5 rounded-full border border-base-300 bg-base-200/60 px-3 py-1.5 text-xs font-medium text-base-content/80">
                <CheckCircle width={13} height={13} className="text-primary" /> {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Năng lực + Chứng nhận */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg"><Layers width={18} height={18} className="text-primary" /> Năng lực</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profile.capabilities.map((c) => (
              <div key={c.label} className="rounded-2xl border border-base-300 bg-base-200/40 p-4">
                <p className="text-sm text-base-content/55">{c.label}</p>
                <p className="mt-0.5 font-medium">{c.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg"><Award width={18} height={18} className="text-primary" /> Chứng nhận</h2>
          <ul className="flex flex-col gap-2.5">
            {profile.certs.map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm"><CheckCircle width={16} height={16} className="text-success" /> {c}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* Portfolio */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg">Portfolio</h2>
          <button className="btn btn-outline btn-sm gap-2"><Pencil width={15} height={15} /> Quản lý ảnh</button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {profile.portfolio.map((src, i) => (
            <img key={i} src={src} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover transition-transform duration-300 hover:scale-[1.03]" />
          ))}
        </div>
      </section>
    </div>
  );
}
