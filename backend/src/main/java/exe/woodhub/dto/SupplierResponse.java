package exe.woodhub.dto;

import exe.woodhub.entity.Supplier;
import exe.woodhub.entity.SupplierStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
public class SupplierResponse {

    private UUID id;
    private UUID userId;
    private String businessName;
    private String taxCode;
    private String legalDocumentUrl;
    private SupplierStatus status;
    private BigDecimal commissionRate;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static SupplierResponse fromEntity(Supplier supplier) {
        return SupplierResponse.builder()
                .id(supplier.getId())
                .userId(supplier.getUser().getId())
                .businessName(supplier.getBusinessName())
                .taxCode(supplier.getTaxCode())
                .legalDocumentUrl(supplier.getLegalDocumentUrl())
                .status(supplier.getStatus())
                .commissionRate(supplier.getCommissionRate())
                .createdAt(supplier.getCreatedAt())
                .updatedAt(supplier.getUpdatedAt())
                .build();
    }
}
