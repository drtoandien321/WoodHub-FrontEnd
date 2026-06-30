/*
 * Bộ icon dùng chung cho 2 trang Supplier — stroke icon nhẹ (Lucide-style), ăn theo currentColor
 * nên đổi màu bằng class text-* của Tailwind. Tách riêng để không lặp SVG trong từng component.
 */
const base = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const MapPin = (p) => (
  <svg {...base} {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
export const Clock = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const Calendar = (p) => (
  <svg {...base} {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
);
export const CheckCircle = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="m9 12 2 2 4-4" /></svg>
);
export const Heart = ({ filled, ...p }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} {...p}><path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5C2 12 5 14 12 21c2-2 4-3.5 5.5-5z" /></svg>
);
export const Search = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const UserPlus = (p) => (
  <svg {...base} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
);
export const Phone = (p) => (
  <svg {...base} {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
);
export const Mail = (p) => (
  <svg {...base} {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>
);
export const Star = ({ filled = true, ...p }) => (
  <svg {...base} fill={filled ? 'currentColor' : 'none'} strokeWidth={1.4} {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" /></svg>
);
export const ChevronRight = (p) => (
  <svg {...base} {...p}><path d="m9 18 6-6-6-6" /></svg>
);
export const Send = (p) => (
  <svg {...base} {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg>
);
export const Bookmark = (p) => (
  <svg {...base} {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
);
export const MessageCircle = (p) => (
  <svg {...base} {...p}><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-4-.9L3 21l1.9-4.9A8.4 8.4 0 1 1 21 11.5z" /></svg>
);
export const Award = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="6" /><path d="M8.2 13.3 7 22l5-3 5 3-1.2-8.7" /></svg>
);
export const Bolt = (p) => (
  <svg {...base} {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" /></svg>
);
export const Sofa = (p) => (
  <svg {...base} {...p}><path d="M4 11V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" /><path d="M2 13a2 2 0 0 1 4 0v3h12v-3a2 2 0 0 1 4 0v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1z" /><path d="M6 16h12" /></svg>
);
export const Cabinet = (p) => (
  <svg {...base} {...p}><rect x="5" y="3" width="14" height="18" rx="1" /><path d="M12 3v18M8 7h.5M15.5 7h.5M8 15h.5M15.5 15h.5" /></svg>
);
export const Tree = (p) => (
  <svg {...base} {...p}><path d="M12 2 7 9h3l-4 6h5v5h2v-5h5l-4-6h3z" /></svg>
);
export const Layers = (p) => (
  <svg {...base} {...p}><path d="m12 2 9 5-9 5-9-5 9-5z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></svg>
);
export const Info = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
);
export const Image = (p) => (
  <svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
);
export const Briefcase = (p) => (
  <svg {...base} {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);
export const Handshake = (p) => (
  <svg {...base} {...p}><path d="m11 17 2 2a1 1 0 0 0 1.4 0l3.6-3.6a2 2 0 0 0 0-2.8l-4.8-4.8a2 2 0 0 0-1.4-.6H6l-4 4" /><path d="m18 13 2-2M9 11l2 2" /></svg>
);

// ===== Bổ sung cho trang Product Detail + Chat drawer =====
export const ChevronLeft = (p) => (
  <svg {...base} {...p}><path d="m15 18-6-6 6-6" /></svg>
);
export const Plus = (p) => (
  <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const Minus = (p) => (
  <svg {...base} {...p}><path d="M5 12h14" /></svg>
);
export const X = (p) => (
  <svg {...base} {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const ShoppingCart = (p) => (
  <svg {...base} {...p}><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
);
export const Shield = (p) => (
  <svg {...base} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const Truck = (p) => (
  <svg {...base} {...p}><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7z" /><circle cx="5.5" cy="18.5" r="1.5" /><circle cx="18.5" cy="18.5" r="1.5" /></svg>
);
export const Tool = (p) => (
  <svg {...base} {...p}><path d="M14.7 6.3a4 4 0 0 1-5.3 5.3L3 18v3h3l6.4-6.4a4 4 0 0 1 5.3-5.3l-2.8 2.8-2-2 2.5-2.8z" /></svg>
);
export const Ruler = (p) => (
  <svg {...base} {...p}><rect x="2" y="8" width="20" height="8" rx="1" transform="rotate(0)" /><path d="M6 8v3M10 8v4M14 8v3M18 8v4" /></svg>
);
export const Pin = (p) => (
  <svg {...base} {...p}><path d="M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3-1-6z" /></svg>
);
export const Paperclip = (p) => (
  <svg {...base} {...p}><path d="M21 8l-9.5 9.5a4 4 0 0 1-6-6L14 3a3 3 0 0 1 4 4l-8.5 8.5a1.5 1.5 0 0 1-2-2L14 6" /></svg>
);
export const Smile = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></svg>
);
export const MoreVertical = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
);
export const Check = (p) => (
  <svg {...base} {...p}><path d="M20 6 9 17l-5-5" /></svg>
);
export const CheckCheck = (p) => (
  <svg {...base} {...p}><path d="M18 6 7 17l-4-4M22 10l-7.5 7.5" /></svg>
);
export const RefreshCw = (p) => (
  <svg {...base} {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
);
export const ExternalLink = (p) => (
  <svg {...base} {...p}><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>
);

// ===== Bổ sung cho Supplier Portal =====
export const Home = (p) => (
  <svg {...base} {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>
);
export const Store = (p) => (
  <svg {...base} {...p}><path d="M3 9l1.5-5h15L21 9" /><path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" /><path d="M5 9.5V20h14V9.5" /><path d="M9 20v-5h4v5" /></svg>
);
export const Package = (p) => (
  <svg {...base} {...p}><path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2z" /><path d="m4 6.5 8 4.5 8-4.5M12 11v9" /></svg>
);
export const ShoppingBag = (p) => (
  <svg {...base} {...p}><path d="M6 7h12l-1 14H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
);
export const Wallet = (p) => (
  <svg {...base} {...p}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 9h18M16 13h2" /></svg>
);
export const Users = (p) => (
  <svg {...base} {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" /></svg>
);
export const Bell = (p) => (
  <svg {...base} {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);
export const LogOut = (p) => (
  <svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
export const Pencil = (p) => (
  <svg {...base} {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>
);
export const Trash = (p) => (
  <svg {...base} {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14M10 11v6M14 11v6" /></svg>
);
export const Eye = (p) => (
  <svg {...base} {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const EyeOff = (p) => (
  <svg {...base} {...p}><path d="M9.9 4.2A10.5 10.5 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-3 4M6.6 6.6A18 18 0 0 0 2 12s3.5 8 10 8a10.5 10.5 0 0 0 5.4-1.5M3 3l18 18M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
);
export const BarChart = (p) => (
  <svg {...base} {...p}><path d="M3 3v18h18" /><rect x="7" y="11" width="3" height="6" /><rect x="12" y="7" width="3" height="10" /><rect x="17" y="13" width="3" height="4" /></svg>
);
export const Gear = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.3a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 2.7 14H2.6a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 7a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 2.7h0A1.7 1.7 0 0 0 11 1.1V1a2 2 0 1 1 4 0v.1A1.7 1.7 0 0 0 17 2.7a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21.3 7" /></svg>
);
export const TrendingUp = (p) => (
  <svg {...base} {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></svg>
);
export const Download = (p) => (
  <svg {...base} {...p}><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>
);
export const CreditCard = (p) => (
  <svg {...base} {...p}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></svg>
);
export const Filter = (p) => (
  <svg {...base} {...p}><path d="M3 5h18l-7 8v6l-4-2v-4L3 5z" /></svg>
);
export const Globe = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" /></svg>
);
export const DollarSign = (p) => (
  <svg {...base} {...p}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);
