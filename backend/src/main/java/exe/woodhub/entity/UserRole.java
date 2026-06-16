package exe.woodhub.entity;

/**
 * Tương ứng với kiểu enum "user_role" trong Postgres.
 * LƯU Ý: các giá trị ở đây phải khớp CHÍNH XÁC (kể cả chữ hoa/thường)
 * với các value đã khai báo khi tạo type user_role trong database.
 */
public enum UserRole {
    customer,
    admin,
    supplier
}
