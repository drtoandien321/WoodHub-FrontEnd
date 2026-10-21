import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useCategoryTree, useMaterials } from './useCatalog.js';
import { useProducts } from './useProducts.js';

/*
 * useShopMenu — dựng cây MEGA MENU "Cửa hàng" từ DỮ LIỆU THẬT (thay cho data/shopMenu.js viết cứng).
 *
 * Vì sao: bản cũ là taxonomy marketing cố định (Đèn, Decor, Phụ kiện, Ưu đãi…) — sàn không có hàng nào thuộc
 * các nhóm đó, mọi link lại trỏ /shop không lọc → khách bấm vào toàn thấy trang không liên quan (QA 21/10).
 * Giờ menu tự sinh từ: GET /categories/tree + GET /materials + GET /products, CHỈ hiện mục đang có sản phẩm.
 * NCC thêm danh mục / sản phẩm mới thì menu tự có, không phải sửa code.
 *
 * Đếm sản phẩm ở FE trên MENU_PRODUCT_LIMIT sản phẩm (catalog hiện ~30 SP). Khi catalog lớn hơn nhiều, nên nhờ BE
 * trả sẵn productCount trong /categories/tree thay vì tải danh sách sản phẩm.
 *
 * Shape node (component ShopMegaMenu đọc): { id, label, icon?, count?, to?, children?: node[], products?: preview[] }
 * preview = { id, label, image, to }
 */
const MENU_PRODUCT_LIMIT = 200;
const PREVIEW_PER_NODE = 4;
const PRODUCT_PARAMS = { page: 0, size: MENU_PRODUCT_LIMIT };

const toPreview = (p) => ({ id: p.id, label: p.name, image: p.primaryImageUrl, to: `/product/${p.id}` });

export function useShopMenu() {
  const { t } = useTranslation();
  const tree = useCategoryTree();
  const materials = useMaterials();
  const products = useProducts(PRODUCT_PARAMS);

  const menu = useMemo(() => {
    const list = products.data?.content ?? [];
    const cats = tree.data ?? [];
    const mats = materials.data?.content ?? materials.data ?? [];

    // Sản phẩm theo danh mục (categoryId của SP)
    const byCategory = new Map();
    for (const p of list) {
      if (!p.categoryId) continue;
      byCategory.set(p.categoryId, [...(byCategory.get(p.categoryId) ?? []), p]);
    }
    /*
     * `count` = số SP mà link /shop/:id THỰC SỰ trả về. BE lọc categoryId KHÔNG gộp danh mục con (vd Bàn → 11, không
     * tính 2 Bàn học) → hiển thị số của riêng danh mục đó, tránh menu ghi 13 mà bấm vào chỉ thấy 11.
     * Danh mục cha vẫn hiện nếu chỉ con có hàng (hasStock), khi đó cột SP lấy SP của con.
     */
    const categoryNode = (c) => {
      const children = (c.children ?? []).map(categoryNode).filter((n) => n.hasStock);
      const own = byCategory.get(c.id) ?? [];
      const all = [...own, ...children.flatMap((n) => n.all)];
      return {
        id: c.id, label: c.name, count: own.length, hasStock: all.length > 0, to: `/shop/${c.id}`, all,
        children: children.length ? children : undefined,
        products: (own.length ? own : all).slice(0, PREVIEW_PER_NODE).map(toPreview),
      };
    };
    const categoryNodes = cats.map(categoryNode).filter((n) => n.hasStock).sort((a, b) => b.all.length - a.all.length);

    // ProductSummaryResponse chỉ có materialName (không có materialId) → nối theo tên
    const materialNodes = mats
      .map((m) => {
        const all = list.filter((p) => p.materialName === m.name);
        return { id: m.id, label: m.name, count: all.length, to: `/shop?materialId=${m.id}`, products: all.slice(0, PREVIEW_PER_NODE).map(toPreview) };
      })
      .filter((n) => n.count > 0)
      .sort((a, b) => b.count - a.count);

    // Mặc định BE sắp createdAt giảm dần → PREVIEW_PER_NODE SP đầu là hàng mới nhất
    const newest = list.slice(0, PREVIEW_PER_NODE).map(toPreview);

    return [
      categoryNodes.length && { id: 'categories', icon: 'furniture', label: t('megaMenu.byCategory'), to: '/shop', children: categoryNodes },
      materialNodes.length && { id: 'materials', icon: 'materials', label: t('megaMenu.byMaterial'), to: '/shop', children: materialNodes },
      newest.length && { id: 'new', icon: 'deals', label: t('megaMenu.newArrivals'), to: '/shop', products: newest },
    ].filter(Boolean);
  }, [products.data, tree.data, materials.data, t]);

  return {
    menu,
    isLoading: products.isLoading || tree.isLoading || materials.isLoading,
    isError: products.isError || tree.isError,
  };
}
