package exe.woodhub.entity;

/**
 * Tương ứng với kiểu enum "supplier_status" trong Postgres.
 * LƯU Ý: các giá trị ở đây phải khớp CHÍNH XÁC (kể cả chữ hoa/thường)
 * với các value đã khai báo khi tạo type supplier_status trong database.
 */
public enum SupplierStatus {
    pending,
    active,
    suspended
}
