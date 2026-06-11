/*
 * API client mobile — CÙNG CONTRACT với web (docs/API_CONTRACT.md).
 * MVP dùng mock; khi BE chạy: đổi USE_MOCK=false + API_URL (LAN IP khi test
 * trên điện thoại thật, vd http://192.168.1.x:8080/api — localhost của máy tính
 * KHÔNG truy cập được từ điện thoại, đây là lỗi kinh điển khi test Expo).
 */
const USE_MOCK = true;
const API_URL = 'http://192.168.1.10:8080/api'; // TODO: đổi sang IP máy chạy BE

import { PRODUCTS, PRODUCT_TYPES, WORKSHOPS } from './mockData.js';

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms));
const memoryDb = { designs: new Map() };
let seq = 1;

async function real(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export const api = {
  // GET /products
  async getProducts(category) {
    if (!USE_MOCK) return real(`/products${category ? `?category=${category}` : ''}`);
    await delay();
    return { items: category ? PRODUCTS.filter((p) => p.category === category) : PRODUCTS };
  },
  // GET /products/:id
  async getProduct(id) {
    if (!USE_MOCK) return real(`/products/${id}`);
    await delay(250);
    return PRODUCTS.find((p) => p.id === id);
  },
  // GET /custom/product-types
  async getProductTypes() {
    if (!USE_MOCK) return real('/custom/product-types');
    await delay(200);
    return { items: PRODUCT_TYPES };
  },
  // POST /custom/designs
  async saveDesign(body) {
    if (!USE_MOCK) return real('/custom/designs', { method: 'POST', body });
    await delay(400);
    const design = { id: `dsg_${Date.now()}_${seq++}`, ...body };
    memoryDb.designs.set(design.id, design);
    return design;
  },
  // POST /custom/match — rule-based, cùng logic với web
  async matchWorkshops({ designId }) {
    if (!USE_MOCK) return real('/custom/match', { method: 'POST', body: { designId } });
    await delay(500);
    const d = memoryDb.designs.get(designId) ?? {};
    const { productType = 'table', dimensions = { width: 120 }, materialId = 'oak' } = d;
    const matches = WORKSHOPS
      .filter((w) => w.capability.types.includes(productType) && w.capability.maxWidthCm >= dimensions.width && w.capability.materials.includes(materialId))
      .map((w) => ({ ...w, score: Math.round((w.rating / 5) * 50 + (1 - Math.min(w.leadTimeDays, 30) / 30) * 30 + Math.min(w.completedJobs / 150, 1) * 20) }))
      .sort((a, b) => b.score - a.score);
    return { designId, matches };
  },
};
