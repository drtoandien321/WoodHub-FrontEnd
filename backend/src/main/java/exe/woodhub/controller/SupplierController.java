package exe.woodhub.controller;

import exe.woodhub.dto.SupplierRegisterRequest;
import exe.woodhub.dto.SupplierResponse;
import exe.woodhub.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/suppliers")
@Tag(name = "Supplier", description = "API nhà cung cấp")
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @Operation(summary = "Đăng ký làm nhà cung cấp (người dùng đang đăng nhập)")
    @PostMapping("/register")
    public ResponseEntity<SupplierResponse> register(@Valid @RequestBody SupplierRegisterRequest request) {
        SupplierResponse response = supplierService.registerSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
