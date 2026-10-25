import { useState } from 'react';
import { useUpdateProductStatus } from '../../hooks/useMyProducts.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { PRODUCT_STATUS } from '../../utils/supplierStatus.js';

/*
 * ProductStatusSelect — đổi nhanh trạng thái 1 sản phẩm (PATCH /products/{id}/status), không cần mở form sửa.
 *
 * BE chỉ có 3 trạng thái: draft | active | hidden. KHÔNG có trạng thái "Hết hàng" riêng — sàn không quản lý tồn kho
 * (NCC xác nhận còn hàng trong 24h sau khi khách thanh toán). Hết hàng / ngừng bán → chọn "Tạm ẩn": SP biến khỏi
 * cửa hàng, khách không đặt được; món đó trong giỏ của khách bị đánh dấu ngừng bán.
 * BE chặn chuyển "Đang bán" khi SP chưa có biến thể (400) → hiện đúng câu lỗi ngay dưới ô chọn.
 *
 * size: 'sm' cho dòng trong bảng, 'md' cho trang chi tiết.
 */
export default function ProductStatusSelect({ product, size = 'sm' }) {
  const updateStatus = useUpdateProductStatus();
  const [error, setError] = useState('');

  const change = (e) => {
    const status = e.target.value;
    if (status === product.status) return;
    if (status === 'hidden' && !window.confirm(`Tạm ẩn "${product.name}"? Sản phẩm sẽ không hiện trên cửa hàng và khách không đặt mua được.`)) return;
    setError('');
    updateStatus.mutate({ id: product.id, status }, {
      onError: (err) => setError(apiErrorMessage(err, 'Không đổi được trạng thái, vui lòng thử lại.')),
    });
  };

  const tone = product.status === 'active' ? 'select-success' : product.status === 'hidden' ? 'select-warning' : '';
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-2">
        <select
          value={product.status}
          onChange={change}
          disabled={updateStatus.isPending}
          className={`select select-bordered ${size === 'sm' ? 'select-sm w-36' : 'w-full sm:w-64'} ${tone}`}
          aria-label={`Trạng thái của ${product.name}`}
        >
          {Object.entries(PRODUCT_STATUS).map(([v, m]) => <option key={v} value={v}>{m.option}</option>)}
        </select>
        {updateStatus.isPending && <span className="loading loading-spinner loading-xs text-base-content/70" />}
      </span>
      {size !== 'sm' && <span className="text-xs text-base-content/70">{PRODUCT_STATUS[product.status]?.hint}</span>}
      {error && <span className="max-w-xs text-xs text-error">{error}</span>}
    </div>
  );
}
