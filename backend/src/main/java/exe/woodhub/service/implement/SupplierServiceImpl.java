package exe.woodhub.service.implement;

import exe.woodhub.dto.SupplierRegisterRequest;
import exe.woodhub.dto.SupplierResponse;
import exe.woodhub.entity.Supplier;
import exe.woodhub.entity.SupplierStatus;
import exe.woodhub.entity.User;
import exe.woodhub.repository.SupplierRepository;
import exe.woodhub.repository.UserRepository;
import exe.woodhub.service.SupplierService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

@Service
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final UserRepository userRepository;

    public SupplierServiceImpl(SupplierRepository supplierRepository,
                               UserRepository userRepository) {
        this.supplierRepository = supplierRepository;
        this.userRepository = userRepository;
    }

    @Override
    public SupplierResponse registerSupplier(SupplierRegisterRequest request) {
        User user = getAuthenticatedUser();

        if (supplierRepository.existsByUser(user)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Tài khoản đã đăng ký làm nhà cung cấp");
        }

        String taxCode = normalize(request.getTaxCode());
        if (taxCode != null && supplierRepository.existsByTaxCode(taxCode)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Mã số thuế đã được sử dụng");
        }

        Supplier supplier = Supplier.builder()
                .user(user)
                .businessName(request.getBusinessName())
                .taxCode(taxCode)
                .legalDocumentUrl(normalize(request.getLegalDocumentUrl()))
                .status(SupplierStatus.pending)
                .commissionRate(BigDecimal.ZERO)
                .build();

        Supplier saved = supplierRepository.save(supplier);
        return SupplierResponse.fromEntity(saved);
    }

    /**
     * Lấy user đang đăng nhập dựa trên email (subject) trong JWT.
     */
    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Chưa xác thực");
        }
        String email = auth.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ"));
    }

    /** Chuẩn hóa chuỗi rỗng/khoảng trắng về null để tránh vướng ràng buộc UNIQUE. */
    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
